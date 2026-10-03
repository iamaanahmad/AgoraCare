/**
 * OpenAI-compatible LLM proxy for the Agora Conversational AI agent.
 *
 * Agora's agent calls this as an OpenAI chat-completions server. We forward to
 * Vertex AI (GCP service account) — reliable, no free-tier 429/503.
 *
 * It ALSO runs the tool-calling loop server-side (Agora never sees the
 * tool_call): we advertise an `escalateToHumanNurse` function to the model;
 * when the model calls it, we write an escalation to Firestore (the same
 * `escalations` collection the Flutter nurse dashboard streams), then feed the
 * tool result back so Aria confirms the escalation verbally.
 *
 * Agent config:
 *   llm.url     = <LLM_PROXY_URL>/api/agora/llm/chat/completions
 *   llm.api_key = <AGORA_LLM_PROXY_KEY>
 */

import { NextRequest, NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

export const dynamic = 'force-dynamic';

const PROJECT = process.env.GOOGLE_CLOUD_PROJECT_ID!;
const LOCATION = process.env.GCLOUD_LOCATION || 'us-central1';
const VERTEX_MODEL = process.env.VERTEX_LLM_MODEL || 'google/gemini-2.5-flash';
const PROXY_KEY = process.env.AGORA_LLM_PROXY_KEY || 'agoracare-vertex-proxy';

const VERTEX_URL =
  `https://${LOCATION}-aiplatform.googleapis.com/v1beta1/projects/${PROJECT}` +
  `/locations/${LOCATION}/endpoints/openapi/chat/completions`;

// ── Firebase (client SDK; rules allow writes) ───────────────────────────────
const fbApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

// ── The emergency tool advertised to the model ──────────────────────────────
const ESCALATE_TOOL = {
  type: 'function',
  function: {
    name: 'escalateToHumanNurse',
    description:
      'Immediately escalate to a human nurse when the patient reports a medical emergency, acute distress, chest pain, difficulty breathing, severe symptoms, or explicitly asks to speak to a nurse/human. Call this as soon as such a need is detected.',
    parameters: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Short description of the emergency or symptom reported by the patient.',
        },
        severity: {
          type: 'string',
          enum: ['critical', 'high', 'medium'],
          description: 'Clinical urgency of the situation.',
        },
      },
      required: ['reason'],
    },
  },
};

// ── Vertex auth (cached token) ──────────────────────────────────────────────
let _auth: GoogleAuth | null = null;
let _cachedToken: { token: string; expiresAt: number } | null = null;

function getAuth(): GoogleAuth {
  if (!_auth) {
    _auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    });
  }
  return _auth;
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (_cachedToken && _cachedToken.expiresAt > now + 60_000) return _cachedToken.token;
  const client = await getAuth().getClient();
  const res = await client.getAccessToken();
  const token = typeof res === 'string' ? res : res.token;
  if (!token) throw new Error('Failed to obtain Vertex access token');
  _cachedToken = { token, expiresAt: now + 50 * 60_000 };
  return token;
}

async function callVertex(token: string, body: any): Promise<Response> {
  return fetch(VERTEX_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

/**
 * Normalize the outbound request for Vertex/Gemini 2.5:
 *  - Gemini 2.5 models are "thinking" models — reasoning eats the token
 *    budget, truncating or emptying the spoken answer. Disable thinking and
 *    give a generous max_tokens so the actual reply always fits.
 */
function normalizeForVertex(body: any): any {
  const out = { ...body, model: VERTEX_MODEL };
  // Ensure room for a real answer regardless of what the agent requested.
  out.max_tokens = Math.max(Number(body?.max_tokens) || 0, 512);
  // Turn off Gemini "thinking" via the OpenAI-compat passthrough.
  out.extra_body = {
    ...(body?.extra_body || {}),
    google: {
      ...(body?.extra_body?.google || {}),
      thinking_config: { thinking_budget: 0 },
    },
  };
  return out;
}

/**
 * Strip Gemini-specific `extra_content` / `thought_signature` noise from the
 * response so the Agora agent receives a clean OpenAI-style payload.
 */
function sanitizeResponse(json: any): any {
  try {
    if (Array.isArray(json?.choices)) {
      for (const c of json.choices) {
        if (c?.message?.extra_content) delete c.message.extra_content;
      }
    }
  } catch {}
  return json;
}

/**
 * Writes the escalation to BOTH collections so either nurse surface works:
 *  - `escalations`     → the Flutter mobile "Live Escalations" page
 *  - `support_tickets` → the web Live Agent Dashboard (joins agoraChannel)
 * `agoraChannel` is the patient's live RTC channel so the web nurse joins
 * the exact room the patient is in → real two-way audio.
 */
async function writeEscalation(args: any, channelName: string | undefined) {
  const severityRaw = (args?.severity || 'critical').toString().toLowerCase();
  const severity = ['critical', 'high', 'medium'].includes(severityRaw) ? severityRaw : 'critical';
  const reason = args?.reason || 'Acute distress detected by Aria (voice AI)';
  const ch = channelName || '';

  // Mobile dashboard source.
  const ref = await addDoc(collection(db, 'escalations'), {
    patientName: 'Patient (Voice AI)',
    patientUid: 0,
    channelName: ch,
    reason,
    severity,
    status: 'active',
    source: 'agora-conversational-ai',
    timestamp: serverTimestamp(),
  });

  // Web dashboard source (support_tickets). agoraChannel = patient channel.
  try {
    await addDoc(collection(db, 'support_tickets'), {
      patientId: 'voice-ai-patient',
      patientName: 'Patient (Voice AI)',
      summary: reason,
      reason,
      status: 'open',
      agoraChannel: ch,
      escalationId: ref.id,
      source: 'agora-conversational-ai',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (e: any) {
    console.warn('[LLM proxy] support_tickets write failed:', e?.message);
  }

  console.log(`[LLM proxy] 🚨 escalation written id=${ref.id} channel=${ch} reason="${reason}"`);
  return ref.id;
}

function unauthorized(reason: string) {
  return NextResponse.json({ error: { message: reason } }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const presented = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (presented !== PROXY_KEY) return unauthorized('Invalid proxy key');

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: { message: 'Invalid JSON' } }, { status: 400 });
  }

  // Extract the patient's RTC channel from the system messages (the agent
  // embeds `<!-- agora_channel:... -->`). Falls back to body/header.
  let channelName: string | undefined =
    body?.channel || request.headers.get('x-agora-channel') || undefined;
  if (!channelName && Array.isArray(body?.messages)) {
    for (const m of body.messages) {
      const content = typeof m?.content === 'string' ? m.content : '';
      const match = content.match(/agora_channel:([^\s>]+)/);
      if (match) {
        channelName = match[1];
        break;
      }
    }
  }

  let token: string;
  try {
    token = await getAccessToken();
  } catch (e: any) {
    console.error('[LLM proxy] token error:', e?.message);
    return NextResponse.json({ error: { message: 'Vertex auth failed' } }, { status: 502 });
  }

  const isStream = body?.stream === true;

  // Base messages + our tool. We always advertise the escalation tool.
  const messages = Array.isArray(body?.messages) ? [...body.messages] : [];
  const tools = [...(body?.tools || []), ESCALATE_TOOL];

  // ── First pass: non-streamed so we can detect a tool call. ───────────────
  const firstBody = normalizeForVertex({
    ...body,
    messages,
    tools,
    stream: false,
  });

  const firstRes = await callVertex(token, firstBody);
  const firstText = await firstRes.text();
  if (!firstRes.ok) {
    console.error(`[LLM proxy] Vertex ${firstRes.status}: ${firstText.slice(0, 300)}`);
    return new NextResponse(firstText, {
      status: firstRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let firstJson: any;
  try {
    firstJson = JSON.parse(firstText);
  } catch {
    return new NextResponse(firstText, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const choice = firstJson?.choices?.[0];
  const toolCalls = choice?.message?.tool_calls;

  // ── No tool call → return the model's answer (sanitized). If the agent
  //    asked for a stream, emit SSE so it starts speaking immediately. ──────
  if (!toolCalls || toolCalls.length === 0) {
    const clean = sanitizeResponse(firstJson);
    if (isStream) {
      return sseFromCompletion(clean);
    }
    return new NextResponse(JSON.stringify(clean), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ── Tool call(s): execute, then ask the model for a final spoken reply. ──
  messages.push(choice.message); // assistant turn with tool_calls
  for (const tc of toolCalls) {
    const name = tc?.function?.name;
    let args: any = {};
    try {
      args = JSON.parse(tc?.function?.arguments || '{}');
    } catch {}

    let result: any = { ok: true };
    if (name === 'escalateToHumanNurse') {
      try {
        const ticketId = await writeEscalation(args, channelName);
        result = {
          escalated: true,
          ticketId,
          message: 'A human nurse has been alerted and is being connected now.',
        };
      } catch (e: any) {
        console.error('[LLM proxy] escalation write failed:', e?.message);
        result = { escalated: false, error: 'Failed to alert nurse' };
      }
    }

    messages.push({
      role: 'tool',
      tool_call_id: tc.id,
      content: JSON.stringify(result),
    });
  }

  // ── Second pass: final natural-language reply. Force non-streamed so we
  //    can sanitize the thinking-model noise before the agent sees it. ──────
  const secondBody = normalizeForVertex({
    ...body,
    messages,
    tools,
    stream: false,
  });

  const secondRes = await callVertex(token, secondBody);
  const secondText = await secondRes.text();
  if (!secondRes.ok) {
    return new NextResponse(secondText, {
      status: secondRes.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  let secondJson: any;
  try {
    secondJson = sanitizeResponse(JSON.parse(secondText));
  } catch {
    return new NextResponse(secondText, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (isStream) {
    return sseFromCompletion(secondJson);
  }
  return new NextResponse(JSON.stringify(secondJson), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Convert a buffered OpenAI chat-completion into a minimal SSE stream so the
 * Agora agent (which expects streaming) starts TTS without waiting on a
 * second round-trip. Emits one content delta + [DONE].
 */
function sseFromCompletion(completion: any): NextResponse {
  const choice = completion?.choices?.[0];
  const content = choice?.message?.content ?? '';
  const model = completion?.model ?? VERTEX_MODEL;
  const id = completion?.id ?? `chatcmpl-${Date.now()}`;
  const created = completion?.created ?? Math.floor(Date.now() / 1000);

  const chunk = (delta: any, finish: any = null) =>
    `data: ${JSON.stringify({
      id,
      object: 'chat.completion.chunk',
      created,
      model,
      choices: [{ index: 0, delta, finish_reason: finish }],
    })}\n\n`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(chunk({ role: 'assistant' })));
      if (content) controller.enqueue(encoder.encode(chunk({ content })));
      controller.enqueue(encoder.encode(chunk({}, 'stop')));
      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
