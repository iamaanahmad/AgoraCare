/**
 * Medical specialization mapping and utilities
 */

export interface Specialization {
  name: string;
  description: string;
  commonSymptoms: string[];
  aliases: string[];
}

export const SPECIALIZATIONS: Record<string, Specialization> = {
  'general-practitioner': {
    name: 'General Practitioner',
    description: 'Primary care physician for general health concerns',
    commonSymptoms: ['fever', 'cough', 'cold', 'flu', 'general checkup'],
    aliases: ['GP', 'Family Doctor', 'Primary Care', 'General Medicine'],
  },
  cardiologist: {
    name: 'Cardiologist',
    description: 'Heart and cardiovascular system specialist',
    commonSymptoms: ['chest pain', 'heart palpitations', 'high blood pressure', 'shortness of breath'],
    aliases: ['Heart Doctor', 'Cardiovascular Specialist'],
  },
  dermatologist: {
    name: 'Dermatologist',
    description: 'Skin, hair, and nail specialist',
    commonSymptoms: ['rash', 'acne', 'skin lesion', 'hair loss', 'nail problems'],
    aliases: ['Skin Doctor'],
  },
  neurologist: {
    name: 'Neurologist',
    description: 'Brain and nervous system specialist',
    commonSymptoms: ['headache', 'migraine', 'dizziness', 'seizures', 'numbness', 'memory problems'],
    aliases: ['Brain Doctor', 'Nerve Specialist'],
  },
  orthopedist: {
    name: 'Orthopedist',
    description: 'Bone, joint, and muscle specialist',
    commonSymptoms: ['joint pain', 'back pain', 'fracture', 'arthritis', 'sports injury'],
    aliases: ['Orthopedic Surgeon', 'Bone Doctor'],
  },
  pediatrician: {
    name: 'Pediatrician',
    description: 'Children\'s health specialist',
    commonSymptoms: ['child illness', 'growth concerns', 'vaccination', 'developmental issues'],
    aliases: ['Child Doctor', 'Kids Doctor'],
  },
  psychiatrist: {
    name: 'Psychiatrist',
    description: 'Mental health and psychiatric disorders specialist',
    commonSymptoms: ['depression', 'anxiety', 'mood changes', 'sleep problems', 'stress'],
    aliases: ['Mental Health Doctor'],
  },
  ophthalmologist: {
    name: 'Ophthalmologist',
    description: 'Eye and vision specialist',
    commonSymptoms: ['vision problems', 'eye pain', 'blurred vision', 'eye infection'],
    aliases: ['Eye Doctor', 'Vision Specialist'],
  },
  ent: {
    name: 'ENT Specialist',
    description: 'Ear, nose, and throat specialist',
    commonSymptoms: ['ear pain', 'hearing loss', 'sinus problems', 'throat pain', 'tonsillitis'],
    aliases: ['Otolaryngologist', 'Ear Nose Throat Doctor'],
  },
  gastroenterologist: {
    name: 'Gastroenterologist',
    description: 'Digestive system specialist',
    commonSymptoms: ['stomach pain', 'nausea', 'diarrhea', 'constipation', 'acid reflux'],
    aliases: ['GI Doctor', 'Stomach Doctor'],
  },
  endocrinologist: {
    name: 'Endocrinologist',
    description: 'Hormone and metabolism specialist',
    commonSymptoms: ['diabetes', 'thyroid problems', 'weight changes', 'hormone imbalance'],
    aliases: ['Hormone Doctor', 'Diabetes Specialist'],
  },
  pulmonologist: {
    name: 'Pulmonologist',
    description: 'Lung and respiratory system specialist',
    commonSymptoms: ['breathing difficulty', 'chronic cough', 'asthma', 'lung problems'],
    aliases: ['Lung Doctor', 'Respiratory Specialist'],
  },
  rheumatologist: {
    name: 'Rheumatologist',
    description: 'Autoimmune and joint disease specialist',
    commonSymptoms: ['joint inflammation', 'autoimmune disease', 'lupus', 'rheumatoid arthritis'],
    aliases: ['Arthritis Doctor'],
  },
  urologist: {
    name: 'Urologist',
    description: 'Urinary tract and male reproductive system specialist',
    commonSymptoms: ['urinary problems', 'kidney stones', 'bladder issues', 'prostate problems'],
    aliases: ['Kidney Doctor', 'Bladder Specialist'],
  },
  gynecologist: {
    name: 'Gynecologist',
    description: 'Women\'s reproductive health specialist',
    commonSymptoms: ['menstrual problems', 'pregnancy', 'pelvic pain', 'reproductive issues'],
    aliases: ['Women\'s Health Doctor', 'OB-GYN'],
  },
  geriatrician: {
    name: 'Geriatrician',
    description: 'Elderly care specialist',
    commonSymptoms: ['age-related issues', 'memory decline', 'mobility problems', 'chronic conditions'],
    aliases: ['Elderly Care Doctor', 'Senior Health Specialist'],
  },
};

/**
 * Get all specialization names
 */
export function getAllSpecializations(): string[] {
  return Object.values(SPECIALIZATIONS).map((spec) => spec.name);
}

/**
 * Find specialization by name or alias
 */
export function findSpecialization(query: string): Specialization | null {
  const normalizedQuery = query.toLowerCase().trim();

  for (const spec of Object.values(SPECIALIZATIONS)) {
    if (spec.name.toLowerCase() === normalizedQuery) {
      return spec;
    }

    if (spec.aliases.some((alias) => alias.toLowerCase() === normalizedQuery)) {
      return spec;
    }
  }

  return null;
}

/**
 * Get specializations by symptom keywords
 */
export function getSpecializationsBySymptoms(symptoms: string[]): Specialization[] {
  const matches: Map<string, number> = new Map();

  symptoms.forEach((symptom) => {
    const normalizedSymptom = symptom.toLowerCase();

    Object.entries(SPECIALIZATIONS).forEach(([key, spec]) => {
      const matchCount = spec.commonSymptoms.filter((commonSymptom) =>
        normalizedSymptom.includes(commonSymptom.toLowerCase()) ||
        commonSymptom.toLowerCase().includes(normalizedSymptom)
      ).length;

      if (matchCount > 0) {
        matches.set(key, (matches.get(key) || 0) + matchCount);
      }
    });
  });

  // Sort by match count and return top matches
  const sortedMatches = Array.from(matches.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([key]) => SPECIALIZATIONS[key]);

  return sortedMatches;
}

/**
 * Normalize specialization name from AI output
 */
export function normalizeSpecialization(aiSpecialization: string): string {
  const found = findSpecialization(aiSpecialization);
  return found ? found.name : aiSpecialization;
}

/**
 * Get specialization description
 */
export function getSpecializationDescription(specializationName: string): string {
  const spec = findSpecialization(specializationName);
  return spec ? spec.description : '';
}
