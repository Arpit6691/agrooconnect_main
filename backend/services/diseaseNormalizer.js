/**
 * Disease Normalizer and Validator
 * Normalizes AI output into a standardized, safe, and robust format.
 */

// Category dictionary for standardized classification
const DISEASE_CATEGORY_MAP = {
  // Fungal diseases
  'early blight': 'FUNGAL',
  'late blight': 'FUNGAL',
  'powdery mildew': 'FUNGAL',
  'rust': 'FUNGAL',
  'common rust': 'FUNGAL',
  'leaf rust': 'FUNGAL',
  'anthracnose': 'FUNGAL',
  'alternaria': 'FUNGAL',
  'alternaria leaf spot': 'FUNGAL',
  'cercospora': 'FUNGAL',
  'cercospora leaf spot': 'FUNGAL',
  'apple scab': 'FUNGAL',
  'rice blast': 'FUNGAL',
  'leaf blast': 'FUNGAL',
  'brown spot': 'FUNGAL',
  'leaf mold': 'FUNGAL',
  'northern leaf blight': 'FUNGAL',
  'black rot': 'FUNGAL',
  'downy mildew': 'FUNGAL',

  // Bacterial diseases
  'bacterial blight': 'BACTERIAL',
  'bacterial leaf spot': 'BACTERIAL',
  'bacterial canker': 'BACTERIAL',
  'bacterial wilt': 'BACTERIAL',

  // Viral diseases
  'leaf mosaic': 'VIRAL',
  'mosaic virus': 'VIRAL',
  'tobacco mosaic virus': 'VIRAL',
  'cucumber mosaic virus': 'VIRAL',
  'yellow leaf curl': 'VIRAL',
  'tomato yellow leaf curl': 'VIRAL',

  // Pest related
  'spider mites': 'PEST_RELATED',
  'two-spotted spider mite': 'PEST_RELATED',
  'aphids': 'PEST_RELATED',
  'leaf miner': 'PEST_RELATED',

  // Nutrient deficiencies
  'chlorosis': 'NUTRIENT_DEFICIENCY',
  'nitrogen deficiency': 'NUTRIENT_DEFICIENCY',
  'potassium deficiency': 'NUTRIENT_DEFICIENCY',
  'iron deficiency': 'NUTRIENT_DEFICIENCY'
};

const STANDARD_NAME_MAP = {
  'cercospora': 'Cercospora Leaf Spot',
  'cercospora leaf spot': 'Cercospora Leaf Spot',
  'cercospora leaf spot disease': 'Cercospora Leaf Spot',
  'alternaria': 'Alternaria Leaf Spot',
  'alternaria leaf spot': 'Alternaria Leaf Spot',
  'alternaria leaf spot disease': 'Alternaria Leaf Spot',
  'powdery mildew': 'Powdery Mildew',
  'powdery mildew disease': 'Powdery Mildew',
  'rust': 'Rust',
  'rust disease': 'Rust',
  'common rust': 'Common Rust',
  'leaf rust': 'Leaf Rust',
  'bacterial blight': 'Bacterial Blight',
  'bacterial blight disease': 'Bacterial Blight',
  'early blight': 'Early Blight',
  'early blight disease': 'Early Blight',
  'late blight': 'Late Blight',
  'late blight disease': 'Late Blight',
  'leaf mosaic': 'Leaf Mosaic',
  'mosaic virus': 'Leaf Mosaic Virus',
  'anthracnose': 'Anthracnose',
  'anthracnose disease': 'Anthracnose',
  'apple scab': 'Apple Scab',
  'rice blast': 'Rice Blast',
  'leaf blast': 'Rice Leaf Blast',
  'brown spot': 'Brown Spot',
  'leaf mold': 'Leaf Mold',
  'northern leaf blight': 'Northern Leaf Blight'
};

/**
 * Standardizes confidence to an integer percentage 0-100
 */
function normalizeConfidence(confidence) {
  if (typeof confidence === 'string') {
    confidence = confidence.replace('%', '').trim();
    confidence = parseFloat(confidence);
  }

  if (typeof confidence !== 'number' || isNaN(confidence)) {
    return 65; // Safe default
  }

  // Handle decimal representation (e.g. 0.92 -> 92)
  if (confidence > 0 && confidence <= 1.0) {
    confidence = confidence * 100;
  }

  return Math.max(0, Math.min(100, Math.round(confidence)));
}

/**
 * Normalizes disease category based on disease name
 */
function determineCategory(diseaseName, status) {
  if (status === 'Healthy') return 'HEALTHY';
  if (!diseaseName || status === 'Uncertain') return 'UNKNOWN';

  const lower = diseaseName.toLowerCase().trim();
  for (const [key, category] of Object.entries(DISEASE_CATEGORY_MAP)) {
    if (lower.includes(key)) {
      return category;
    }
  }

  return 'UNKNOWN';
}

/**
 * Normalizes disease display name
 */
function normalizeDiseaseName(diseaseName) {
  if (!diseaseName) return null;
  const lower = diseaseName.toLowerCase().trim();
  for (const [key, standard] of Object.entries(STANDARD_NAME_MAP)) {
    if (lower === key || lower.includes(key)) {
      return standard;
    }
  }
  // Title-case fallback
  return diseaseName
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Normalizes severity
 */
function normalizeSeverity(severity, status) {
  if (status === 'Healthy') return 'None';
  const valid = ['None', 'Low', 'Moderate', 'High'];
  if (typeof severity === 'string') {
    const formatted = severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
    if (valid.includes(formatted)) return formatted;
  }
  return 'Moderate';
}

/**
 * Sanitizes and normalizes the entire AI diagnosis response
 * @param {Object} raw - Raw output from any AI provider
 * @param {string} providerName - Name of the provider used
 * @returns {Object} Normalized, validated diagnosis
 */
function normalizeDiagnosis(raw = {}, providerName = 'unknown') {
  const confidence = normalizeConfidence(raw.confidence);
  
  let status = 'Diseased';
  if (raw.status && typeof raw.status === 'string') {
    const s = raw.status.toLowerCase();
    if (s.includes('healthy')) status = 'Healthy';
    else if (s.includes('uncertain') || s.includes('unknown')) status = 'Uncertain';
  } else if (raw.diseaseName && raw.diseaseName.toLowerCase().includes('healthy')) {
    status = 'Healthy';
  }

  // Low confidence (< 60) triggers Uncertain status or warning
  if (confidence < 60 && status !== 'Healthy') {
    status = 'Uncertain';
  }

  let cropName = raw.cropName || 'General Crop / Plant';
  if (typeof cropName === 'string') {
    cropName = cropName.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }

  let diseaseName = status === 'Healthy' ? null : normalizeDiseaseName(raw.diseaseName);
  if (status === 'Uncertain' && !diseaseName) {
    diseaseName = 'Unknown / Needs Expert Review';
  }

  const diseaseCategory = determineCategory(diseaseName, status);
  const severity = normalizeSeverity(raw.severity, status);

  // Clean arrays
  const possibleCauses = Array.isArray(raw.possibleCauses) ? raw.possibleCauses.filter(Boolean) : [];
  const recommendedTreatment = Array.isArray(raw.recommendedTreatment) ? raw.recommendedTreatment.filter(Boolean) : [];
  const preventionTips = Array.isArray(raw.preventionTips) ? raw.preventionTips.filter(Boolean) : [];
  const recommendations = Array.isArray(raw.recommendations) ? raw.recommendations.filter(Boolean) : [];

  // Always ensure expert review notice exists
  const isMock = providerName === 'mock';

  return {
    success: true,
    provider: providerName,
    isMock: isMock,
    cropName,
    diseaseName,
    diseaseCategory,
    status,
    confidence,
    severity,
    description: raw.description || (status === 'Healthy' ? 'Plant foliage appears healthy with normal leaf coloration and structure.' : 'Disease symptoms detected on foliage.'),
    possibleCauses,
    recommendedTreatment,
    preventionTips,
    recommendations,
    message: raw.message || null
  };
}

module.exports = {
  normalizeDiagnosis,
  normalizeConfidence,
  normalizeDiseaseName,
  determineCategory,
  DISEASE_CATEGORY_MAP
};
