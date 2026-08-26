const BaseProvider = require('./baseProvider');
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

/**
 * Gemini Multimodal Vision AI Provider for Plant Disease Detection
 */
class GeminiProvider extends BaseProvider {
  constructor(apiKey = process.env.GEMINI_API_KEY) {
    super('gemini');
    this.apiKey = apiKey;
    this.candidateModels = [
      process.env.GEMINI_VISION_MODEL || 'gemini-3.6-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite'
    ].filter(Boolean);

    if (this.apiKey && this.apiKey !== 'dummy_gemini_key') {
      this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    } else {
      this.ai = null;
    }
  }

  /**
   * Check if Gemini is configured with a valid key
   */
  isConfigured() {
    return Boolean(this.apiKey && this.apiKey !== 'dummy_gemini_key' && this.ai);
  }

  async analyzePlantImage(imageInfo) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is missing or invalid. Please check your backend .env configuration.');
    }

    if (!imageInfo || !imageInfo.filePath || !fs.existsSync(imageInfo.filePath)) {
      throw new Error('Image file not found on disk for AI vision analysis');
    }

    // Read image buffer and convert to base64
    const fileBuffer = fs.readFileSync(imageInfo.filePath);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = imageInfo.mimetype || 'image/jpeg';

    const systemPrompt = `You are an expert agricultural plant pathologist and agronomist. 
Analyze the provided image of a plant/leaf and identify any visible plant disease, pest damage, nutrient deficiency, or confirm if the plant is healthy.

CRITICAL INSTRUCTIONS:
1. If the image is NOT a plant, leaf, or crop (e.g. human face, animal, random object), or if the image is too blurry/unclear to make any assessment:
   Respond ONLY with a JSON object where "status" is "Uncertain", "cropName" is "Unknown", "diseaseName" is "Unclear Image / Non-Plant", "confidence" is 20, "description" explains that a clearer photo of a plant leaf is required.

2. If the plant is HEALTHY:
   - "status": "Healthy"
   - "diseaseName": null
   - "confidence": number between 80 and 99
   - "severity": "None"
   - "possibleCauses": []
   - "recommendedTreatment": []
   - "preventionTips": []
   - "recommendations": [array of 3-4 healthy plant maintenance and monitoring tips]
   - "message": summary describing the healthy condition of the crop.

3. If the plant is DISEASED:
   - "status": "Diseased"
   - "cropName": identified crop/plant name (e.g. Tomato, Potato, Corn, Wheat, Rice, Apple, Pepper, Cotton, etc.)
   - "diseaseName": standardized disease name (e.g. Early Blight, Late Blight, Cercospora Leaf Spot, Alternaria Leaf Spot, Powdery Mildew, Rust, Bacterial Blight, Leaf Mosaic, Anthracnose, etc.)
   - "confidence": numeric percentage (0-100)
   - "severity": "Low", "Moderate", or "High"
   - "description": 2-3 sentence overview of the pathogen and visual symptoms
   - "possibleCauses": [array of 3-4 environmental and biological causes]
   - "recommendedTreatment": [array of 3-4 safe, actionable treatments; avoid recommending hazardous chemical dosages; recommend safe registered fungicides/bactericides and cultural practices]
   - "preventionTips": [array of 3-4 agronomic prevention methods like crop rotation, resistant varieties, drip irrigation]
   - "recommendations": [array of 2-3 advisory notes including consulting local agricultural extension officers]

4. Output Format:
   Respond ONLY with a valid JSON object matching the keys:
   {
     "cropName": string,
     "diseaseName": string or null,
     "status": "Healthy" | "Diseased" | "Uncertain",
     "confidence": number,
     "severity": "None" | "Low" | "Moderate" | "High",
     "description": string,
     "possibleCauses": string[],
     "recommendedTreatment": string[],
     "preventionTips": string[],
     "recommendations": string[],
     "message": string or null
   }
   Do NOT wrap in markdown \`\`\`json or add text outside the JSON.`;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: mimeType
      }
    };

    let lastError = null;

    // Try candidate models in order if one experiences 503 high demand
    for (const modelName of this.candidateModels) {
      try {
        console.log(`[GeminiProvider] Attempting vision analysis with model: ${modelName}`);

        const response = await this.ai.models.generateContent({
          model: modelName,
          contents: [
            systemPrompt,
            imagePart
          ]
        });

        if (!response || !response.text) {
          throw new Error(`Empty response received from Gemini Vision AI (${modelName})`);
        }

        // Clean potential markdown wrapping
        let cleanText = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        
        let parsed;
        try {
          parsed = JSON.parse(cleanText);
        } catch (parseErr) {
          const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error(`Failed to parse structured JSON from Gemini Vision AI response (${modelName})`);
          }
        }

        console.log(`[GeminiProvider] Vision analysis successfully completed with model: ${modelName}`);
        return parsed;
      } catch (err) {
        console.warn(`[GeminiProvider] Model ${modelName} failed: ${err.message}. Trying next candidate model if available...`);
        lastError = err;
        // Short backoff before next model
        await new Promise(r => setTimeout(r, 600));
      }
    }

    throw lastError || new Error('All Gemini Vision models failed to analyze the image');
  }
}

module.exports = GeminiProvider;
