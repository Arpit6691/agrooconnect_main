const BaseProvider = require('./baseProvider');
const axios = require('axios');
const fs = require('fs');

/**
 * Hugging Face Plant Disease Classification Provider Adapter
 */
class HuggingFaceProvider extends BaseProvider {
  constructor(apiKey = process.env.HUGGINGFACE_API_KEY, modelUrl = process.env.HUGGINGFACE_MODEL_URL) {
    super('huggingface');
    this.apiKey = apiKey;
    this.modelUrl = modelUrl || 'https://api-inference.huggingface.co/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey !== 'dummy_hf_key');
  }

  async analyzePlantImage(imageInfo) {
    if (!this.isConfigured()) {
      throw new Error('Hugging Face API key is missing. Please set HUGGINGFACE_API_KEY in .env.');
    }

    if (!imageInfo || !imageInfo.filePath || !fs.existsSync(imageInfo.filePath)) {
      throw new Error('Image file not found on disk for Hugging Face analysis');
    }

    const imageBuffer = fs.readFileSync(imageInfo.filePath);

    const response = await axios.post(this.modelUrl, imageBuffer, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': imageInfo.mimetype || 'image/jpeg'
      },
      timeout: 20000
    });

    // HF classification models typically return array of [{ label: "Tomato___Early_blight", score: 0.94 }, ...]
    const predictions = response.data;
    if (!Array.isArray(predictions) || predictions.length === 0) {
      throw new Error('Unexpected response structure from Hugging Face model');
    }

    const top = predictions[0];
    const rawLabel = top.label || 'General___Healthy';
    const parts = rawLabel.split('___');
    const cropName = (parts[0] || 'Plant').replace(/_/g, ' ');
    const rawDisease = (parts[1] || 'Healthy').replace(/_/g, ' ');
    const isHealthy = rawDisease.toLowerCase().includes('healthy');

    return {
      cropName,
      diseaseName: isHealthy ? null : rawDisease,
      status: isHealthy ? 'Healthy' : 'Diseased',
      confidence: Math.round(top.score * 100),
      severity: isHealthy ? 'None' : 'Moderate',
      description: `Classified via Hugging Face plant disease model as ${rawLabel}.`,
      possibleCauses: isHealthy ? [] : ['Fungal or bacterial pathogen typical for this crop family'],
      recommendedTreatment: isHealthy ? [] : [
        'Prune affected foliage',
        'Apply registered crop protectants per local agricultural advisories'
      ],
      preventionTips: [
        'Practice proper crop rotation and field sanitation',
        'Use drip irrigation to prevent excess leaf moisture'
      ],
      recommendations: [
        'Consult with an agricultural extension officer to verify symptoms'
      ]
    };
  }
}

module.exports = HuggingFaceProvider;
