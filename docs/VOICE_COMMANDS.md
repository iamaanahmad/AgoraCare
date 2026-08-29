# 🎤 AgoraCare Voice Commands Reference

**Last Updated:** November 14, 2025  
**Powered by:** Agora Conversational AI SDK

This guide lists all supported voice commands and natural language patterns for AgoraCare.

---

## 🚀 Getting Started with Voice

### Activating Voice Mode

**Wake Words:**
- "Hey AgoraCare"
- "AgoraCare"
- Click the microphone button

**Deactivating:**
- "Stop listening"
- "Cancel"
- Click the microphone button again

---

## 💊 Medication Commands

### Adding Medications

**Basic Pattern:**
> "Add medication [name] [dosage] [frequency] [timing]"

**Examples:**

```
✅ "Add medication Metformin 500 milligrams twice daily with meals"
✅ "Add Lisinopril 10 mg once a day in the morning"
✅ "Add my blood pressure medication Amlodipine 5 milligrams once daily"
✅ "Add Aspirin 81 mg every morning"
```

**Natural Language Variations:**

```
✅ "I need to add a new medication"
   → System: "What's the medication name?"
   → You: "Metformin"
   → System: "What's the dosage?"
   → You: "500 milligrams"
   → System: "How often should you take it?"
   → You: "Twice daily with meals"
```

### Frequency Patterns

**Daily:**
- "once a day" / "once daily" / "every day"
- "twice a day" / "twice daily" / "two times a day"
- "three times a day" / "three times daily"
- "four times a day"

**Alternate Days:**
- "every other day"
- "alternate days"
- "every two days"

**Weekly:**
- "once a week"
- "twice a week"
- "every Monday and Thursday"
- "on weekdays" / "on weekends"

**As Needed:**
- "as needed"
- "when needed"
- "PRN"

### Timing Patterns

**Meal-Related:**
- "with meals" / "with food"
- "after meals" / "after eating"
- "before meals" / "before eating"
- "with breakfast" / "with lunch" / "with dinner"
- "30 minutes before meals"

**Time of Day:**
- "in the morning" / "morning"
- "in the evening" / "evening"
- "at night" / "nighttime"
- "at bedtime" / "before bed"
- "at 8 AM" / "at 6 PM"

**Special:**
- "on empty stomach"
- "with water"
- "with milk"

### Marking Medications as Taken

**When Reminder Sounds:**

```
✅ "Taken"
✅ "Done"
✅ "I took it"
✅ "Just took it"
✅ "Already took it"
✅ "Yes"
```

### Marking Medications as Missed

```
✅ "Missed"
✅ "I missed it"
✅ "Didn't take it"
✅ "Skip"
✅ "No"
```

### Querying Medications

**Next Dose:**
```
✅ "What's my next medication?"
✅ "When is my next dose?"
✅ "What do I need to take next?"
✅ "What's next?"
```

**Today's Schedule:**
```
✅ "What medications do I have today?"
✅ "Show me today's medications"
✅ "What do I need to take today?"
```

**Specific Medication:**
```
✅ "When do I take Metformin?"
✅ "How much Lisinopril should I take?"
✅ "Tell me about my blood pressure medication"
```

### Editing Medications

```
✅ "Change Metformin dosage to 1000 milligrams"
✅ "Update my morning medication time to 7 AM"
✅ "Remove Aspirin from my schedule"
✅ "Delete my allergy medication"
```

---

## 📅 Appointment Commands

### Booking Appointments

**Symptom Description:**

```
✅ "I need to book an appointment"
   → System: "What symptoms are you experiencing?"
   → You: "I have a persistent cough and fever for three days"
   
✅ "Book appointment for chest pain and shortness of breath"
✅ "I need to see a doctor about my knee pain"
✅ "Schedule a checkup for my daughter's allergies"
```

**Direct Booking:**

```
✅ "Book a cardiology appointment for next Monday at 2 PM"
✅ "Schedule a dentist appointment next week"
✅ "I need a physical exam appointment"
```

### Querying Appointments

**Upcoming:**
```
✅ "What's my next appointment?"
✅ "When is my doctor's appointment?"
✅ "Show me upcoming appointments"
✅ "Do I have any appointments this week?"
```

**Specific Profile:**
```
✅ "What's Dad's next appointment?"
✅ "When is Mom's cardiology appointment?"
✅ "Show me Emma's appointments"
```

### Managing Appointments

```
✅ "Cancel my appointment on Monday"
✅ "Reschedule my dentist appointment to next week"
✅ "Remind me about tomorrow's appointment"
```

---

## 🚨 Emergency Commands

### Triggering Emergency Mode

**Critical Keywords (Highest Priority):**

```
⚠️ "Emergency"
⚠️ "Help"
⚠️ "Call 911"
⚠️ "I need help"
```

**Medical Emergency:**

```
⚠️ "Call my doctor"
⚠️ "I need my doctor"
⚠️ "Medical emergency"
⚠️ "I'm having chest pain"
⚠️ "I can't breathe"
⚠️ "I fell"
```

**Family Notification:**

```
⚠️ "Notify my family"
⚠️ "Call my daughter"
⚠️ "Alert my son"
⚠️ "Contact my emergency contacts"
```

### Emergency Responses

**System will ask:**
> "Emergency detected. Would you like to call your doctor or notify family?"

**Your options:**
```
✅ "Call doctor"
✅ "Notify family"
✅ "Both"
✅ "Call 911"
```

---

## 👨‍👩‍👧 Family & Profile Commands

### Switching Profiles

```
✅ "Switch to Dad's profile"
✅ "Show me Mom's medications"
✅ "Change to Emma's profile"
✅ "View Grandpa John's schedule"
```

### Querying Family Members

```
✅ "What's Dad's next dose?"
✅ "Did Mom take her medication?"
✅ "Show me Emma's adherence"
✅ "How is everyone doing today?"
```

### Adding Family Members

```
✅ "Add a new family member"
✅ "Create a profile for my father"
✅ "Add my daughter to the app"
```

---

## 📄 Prescription Commands

### Uploading Prescriptions

```
✅ "I have a new prescription"
✅ "Upload prescription"
✅ "Scan my prescription"
✅ "Add prescription from photo"
```

### Querying Prescriptions

```
✅ "Show me my prescriptions"
✅ "What did the doctor prescribe?"
✅ "Read my latest prescription"
✅ "Explain this prescription"
```

### Adding from Prescription

**After OCR and AI Summary:**

```
✅ "Add this to my schedule"
✅ "Add all medications from this prescription"
✅ "Create reminders for these medications"
```

---

## 🔍 General Queries

### Health Status

```
✅ "How am I doing?"
✅ "Show me my adherence"
✅ "What's my medication adherence rate?"
✅ "Am I taking my medications on time?"
```

### Navigation

```
✅ "Go to dashboard"
✅ "Show medications"
✅ "Open appointments"
✅ "View prescriptions"
✅ "Go to emergency page"
```

### Help

```
✅ "Help"
✅ "What can you do?"
✅ "Show me commands"
✅ "How do I add a medication?"
```

---

## 🎯 Pro Tips for Voice Commands

### 1. Speak Clearly and Naturally
- ✅ Use your normal speaking voice
- ✅ Speak at a moderate pace
- ❌ Don't shout or whisper
- ❌ Don't over-enunciate

### 2. Be Specific with Dosages
- ✅ "500 milligrams" or "500 mg"
- ✅ "10 micrograms" or "10 mcg"
- ❌ "Half a pill" (system may not understand)

### 3. Use Natural Language
- ✅ "I need to add my blood pressure medication"
- ✅ "What's my next dose?"
- ❌ "Add medication" (too vague, will prompt for details)

### 4. Confirm Important Actions
- System will always confirm critical actions
- Listen for confirmation before saying "Yes" or "Confirm"

### 5. Use Fallback to Text
- If voice isn't working, tap the text input
- All voice commands work as text too

---

## 🔧 Troubleshooting Voice Commands

### Command Not Recognized

**Try:**
1. Rephrase using simpler words
2. Break into smaller commands
3. Use the text input instead
4. Check microphone permissions

**Example:**
- ❌ "Add my antihypertensive pharmaceutical agent"
- ✅ "Add my blood pressure medication"

### Dosage Confusion

**Be explicit:**
- ✅ "500 milligrams" (clear)
- ⚠️ "500" (may need clarification)
- ✅ "5 milliliters" (for liquids)
- ✅ "2 tablets" (for pills)

### Timing Ambiguity

**Be specific:**
- ✅ "8 AM and 6 PM" (exact times)
- ⚠️ "Morning and evening" (system will ask for specific times)
- ✅ "With breakfast and dinner" (meal-based)

---

## 📊 Voice Command Categories

### High Confidence (95%+ Recognition)
- Emergency triggers
- Medication taken/missed
- Simple queries ("What's next?")
- Profile switching

### Medium Confidence (85-95% Recognition)
- Adding medications with full details
- Symptom descriptions
- Appointment booking
- Complex queries

### May Need Clarification (70-85% Recognition)
- Unusual medication names
- Complex timing patterns
- Multiple medications at once
- Editing existing medications

---

## 🎤 Voice Command Examples by Scenario

### Morning Routine

```
User: "Hey AgoraCare, what do I need to take this morning?"
System: "You have three medications: Metformin 500mg, Lisinopril 10mg, and Aspirin 81mg."
User: "Taken"
System: "Great! All three marked as taken at 8:05 AM."
```

### Adding New Medication

```
User: "Add medication"
System: "What's the medication name?"
User: "Atorvastatin"
System: "What's the dosage?"
User: "20 milligrams"
System: "How often should you take it?"
User: "Once daily at bedtime"
System: "Got it. Atorvastatin 20mg once daily at bedtime. Should I add this?"
User: "Yes"
System: "Added! Your first reminder will be tonight at 10 PM."
```

### Booking Appointment

```
User: "I need to book an appointment"
System: "What symptoms are you experiencing?"
User: "I've had a headache and dizziness for two days"
System: "Based on your symptoms, I recommend seeing a neurologist or your primary care physician. Would you like to see available appointments?"
User: "Yes, primary care"
System: "I have openings on November 18th at 2 PM and November 20th at 10 AM. Which works better?"
User: "November 18th at 2 PM"
System: "Booked! Appointment with Dr. Smith on November 18th at 2 PM. I've added it to your calendar."
```

### Emergency Situation

```
User: "Emergency!"
System: "Emergency mode activated. Would you like to call your doctor or notify family?"
User: "Call doctor"
System: "Calling Dr. Smith now. Notifying your emergency contacts."
[Call connects via Agora RTC]
```

### Caregiver Query

```
User: "What's Dad's next dose?"
System: "John's next medication is Metformin 500 milligrams at 6 PM, to be taken with dinner."
User: "Did he take his morning medications?"
System: "Yes, John took all three morning medications at 8:02 AM."
```

---

## 🌐 Multi-Language Support (Future)

**Coming Soon:**
- Spanish: "Agregar medicamento"
- Mandarin: "添加药物"
- Hindi: "दवा जोड़ें"
- French: "Ajouter un médicament"

---

## 📞 Voice Command Support

**Having trouble with voice commands?**

1. Check microphone permissions in browser
2. Ensure stable internet connection
3. Try using headphones to reduce echo
4. Use text input as fallback
5. Contact support: team@agoracare.health

---

<div align="center">

**Voice-First Healthcare Made Simple**

**Powered by Agora Conversational AI SDK**

[Back to README](../README.md) • [Quick Start](QUICK_START.md) • [Demo Script](DEMO_SCRIPT.md)

</div>
