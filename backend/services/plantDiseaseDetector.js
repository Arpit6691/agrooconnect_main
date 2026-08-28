const PythonMLProvider = require('./providers/pythonMLProvider');
const GeminiProvider = require('./providers/geminiProvider');
const { normalizeDiagnosis } = require('./diseaseNormalizer');

// ==========================================
// INITIALIZE PROVIDERS
// ==========================================

const providers = {
  pythonml: new PythonMLProvider(),
  gemini: new GeminiProvider()
};


// ==========================================
// ALWAYS USE PYTHON ML FOR DISEASE DETECTION
// ==========================================

function getActiveProvider() {
  return providers.pythonml;
}


// ==========================================
// GET TREATMENT FROM GEMINI
// ==========================================

async function getTreatmentFromGemini(prediction) {

  // If Gemini API is not configured
  if (!providers.gemini.isConfigured()) {

    console.warn(
      '[PlantDiseaseDetector] Gemini is not configured.'
    );

    return {
      description:
        prediction.status === 'Healthy'
          ? 'The plant appears healthy.'
          : `The ML model detected ${prediction.diseaseName}.`,

      possibleCauses: [],

      recommendedTreatment: [],

      preventionTips: [],

      recommendations: [],

      sources: []
    };
  }


  try {

    // Gemini generates treatment based on
    // the disease predicted by Python ML
    const treatment =
      await providers.gemini.generateTreatment(prediction);

    return {
      description: treatment.description || '',

      possibleCauses:
        Array.isArray(treatment.possibleCauses)
          ? treatment.possibleCauses
          : [],

      recommendedTreatment:
        Array.isArray(treatment.recommendedTreatment)
          ? treatment.recommendedTreatment
          : [],

      preventionTips:
        Array.isArray(treatment.preventionTips)
          ? treatment.preventionTips
          : [],

      recommendations:
        Array.isArray(treatment.recommendations)
          ? treatment.recommendations
          : [],

      sources:
        Array.isArray(treatment.sources)
          ? treatment.sources
          : []
    };

  } catch (error) {

    console.error(
      '[PlantDiseaseDetector] Gemini treatment generation failed:',
      error.message
    );

    // Disease prediction should still work
    // even if Gemini fails

    return {
      description:
        prediction.description ||
        `The ML model detected ${prediction.diseaseName}.`,

      possibleCauses: [],

      recommendedTreatment: [],

      preventionTips: [],

      recommendations: [],

      sources: []
    };
  }
}


// ==========================================
// MAIN DISEASE DETECTION FUNCTION
// ==========================================

async function detect(imageInfo) {

  const provider = getActiveProvider();

  try {

    // --------------------------------------
    // STEP 1: PYTHON ML DETECTS DISEASE
    // --------------------------------------

    console.log(
      '[PlantDiseaseDetector] Running local Python ML prediction...'
    );

    const rawResult =
      await provider.analyzePlantImage(imageInfo);


    // Normalize Python ML result
    let diagnosis =
      normalizeDiagnosis(rawResult, provider.name);


    console.log(
      `[PlantDiseaseDetector] ML Prediction: ` +
      `${diagnosis.cropName} - ${diagnosis.diseaseName}`
    );


    // --------------------------------------
    // STEP 2: GEMINI GENERATES GUIDANCE
    // --------------------------------------

    console.log(
      '[PlantDiseaseDetector] Generating treatment and precautions with Gemini...'
    );

    const treatmentData =
      await getTreatmentFromGemini(diagnosis);


    // --------------------------------------
    // STEP 3: MERGE ML + GEMINI DATA
    // --------------------------------------

    diagnosis = {

      // Keep all original ML prediction data
      ...diagnosis,


      // Gemini-generated description
      description:
        treatmentData.description ||
        diagnosis.description,


      // Gemini-generated possible causes
      possibleCauses:
        treatmentData.possibleCauses || [],


      // Gemini-generated treatment
      recommendedTreatment:
        treatmentData.recommendedTreatment || [],


      // Gemini-generated prevention tips
      preventionTips:
        treatmentData.preventionTips || [],


      // Gemini-generated recommendations
      recommendations:
        treatmentData.recommendations || [],


      // Gemini-generated sources
      sources:
        treatmentData.sources || []
    };


    console.log(
      '[PlantDiseaseDetector] Complete diagnosis generated successfully.'
    );


    console.log(
      '[PlantDiseaseDetector] Sources:',
      diagnosis.sources
    );


    return diagnosis;

  } catch (error) {

    console.error(
      '[PlantDiseaseDetector] Python ML prediction failed:',
      error.message
    );

    throw error;
  }
}


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  detect,
  getActiveProvider,
  providers
};