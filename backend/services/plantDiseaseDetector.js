const GeminiProvider = require('./providers/geminiProvider');
const HuggingFaceProvider = require('./providers/huggingfaceProvider');
const MockProvider = require('./providers/mockProvider');
const { normalizeDiagnosis } = require('./diseaseNormalizer');

// Initialize singleton instances of available providers
const providers = {
  gemini: new GeminiProvider(),
  huggingface: new HuggingFaceProvider(),
  mock: new MockProvider()
};

/**
 * Determine the active provider based on environment and availability
 */
function getActiveProvider() {
  const configuredProvider = (process.env.PLANT_DETECTION_PROVIDER || '').toLowerCase().trim();

  if (configuredProvider === 'huggingface' && providers.huggingface.isConfigured()) {
    return providers.huggingface;
  }

  if (configuredProvider === 'gemini' && providers.gemini.isConfigured()) {
    return providers.gemini;
  }

  if (configuredProvider === 'mock') {
    return providers.mock;
  }

  // Automatic default: if Gemini is configured, use it; otherwise fallback to mock
  if (providers.gemini.isConfigured()) {
    return providers.gemini;
  }

  return providers.mock;
}

/**
 * Main plant disease detection interface
 * @param {Object} imageInfo
 * @param {string} imageInfo.filePath - Absolute path to local image file
 * @param {string} imageInfo.mimetype - Image MIME type (e.g. image/jpeg)
 * @param {string} imageInfo.filename - Image original/saved filename
 * @returns {Promise<Object>} Normalized diagnosis result
 */
async function detect(imageInfo) {
  const provider = getActiveProvider();
  const providerName = provider.name;

  try {
    const rawResult = await provider.analyzePlantImage(imageInfo);
    return normalizeDiagnosis(rawResult, providerName);
  } catch (providerError) {
    console.error(`[PlantDiseaseDetector] Provider '${providerName}' failed:`, providerError.message);

    // Fallback only if explicitly enabled via ALLOW_MOCK_FALLBACK=true
    const allowFallback = process.env.ALLOW_MOCK_FALLBACK === 'true';
    if (providerName !== 'mock' && allowFallback) {
      console.warn(`[PlantDiseaseDetector] ALLOW_MOCK_FALLBACK is enabled. Falling back to MockProvider.`);
      const mockResult = await providers.mock.analyzePlantImage(imageInfo);
      return normalizeDiagnosis(mockResult, 'mock');
    }

    // Throw clear, meaningful error without silent mock masquerading
    throw new Error(`Plant disease AI analysis failed with provider '${providerName}': ${providerError.message}`);
  }
}

module.exports = {
  detect,
  getActiveProvider,
  providers
};
