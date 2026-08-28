const BaseProvider = require('./baseProvider');
const { GoogleGenAI } = require('@google/genai');

/**
 * Gemini Provider
 *
 * Used ONLY for:
 * - Disease description
 * - Possible causes
 * - Treatment
 * - Precautions
 * - Prevention tips
 * - Recommendations
 * - Reference sources
 *
 * Disease prediction is done by the local Python MobileNetV2 model.
 */
class GeminiProvider extends BaseProvider {
  constructor(apiKey = process.env.GEMINI_API_KEY) {
    super('gemini');

    this.apiKey = apiKey;

    this.modelName =
      process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (
      this.apiKey &&
      this.apiKey !== 'dummy_gemini_key'
    ) {
      this.ai = new GoogleGenAI({
        apiKey: this.apiKey
      });
    } else {
      this.ai = null;
    }
  }

  /**
   * Check whether Gemini API is configured
   */
  isConfigured() {
    return Boolean(
      this.apiKey &&
      this.apiKey !== 'dummy_gemini_key' &&
      this.ai
    );
  }

  /**
   * Generate agricultural guidance based ONLY
   * on the disease predicted by the Python ML model.
   */
  async generateTreatment(prediction) {
    if (!this.isConfigured()) {
      throw new Error(
        'Gemini API key is missing or invalid.'
      );
    }

    const {
      cropName,
      diseaseName,
      status,
      confidence,
      severity
    } = prediction;

    const prompt = `
You are an agricultural guidance assistant.

IMPORTANT:

The crop and disease have ALREADY been predicted by a local
Machine Learning model.

DO NOT change, verify, or predict another crop or disease.

Use exactly this prediction:

Crop: ${cropName}
Disease: ${diseaseName || 'Healthy'}
Status: ${status}
Confidence: ${confidence}%
Severity: ${severity}

Your job is ONLY to provide agricultural guidance
for this already predicted result.

If the plant is diseased, provide:

1. A simple description of the disease.
2. 3-4 possible causes.
3. 3-4 recommended treatments or immediate actions.
4. 3-4 prevention tips.
5. 2-3 additional recommendations.

If the plant is healthy, provide:

1. A short healthy plant description.
2. An empty possibleCauses array.
3. An empty recommendedTreatment array.
4. 3-4 prevention and maintenance tips.
5. 2-3 monitoring recommendations.

IMPORTANT SAFETY RULES:

- Do not change the predicted crop.
- Do not change the predicted disease.
- Do not invent another diagnosis.
- Give practical and simple agricultural advice.
- Avoid dangerous pesticide or fungicide dosage instructions.
- Recommend checking local agricultural regulations and product labels.

SOURCES:

Also provide 2-4 trustworthy agricultural or scientific
reference sources related to the predicted crop or disease.

Prefer authoritative organizations such as:

- USDA
- UC IPM
- Cornell University
- University agricultural extension services
- FAO
- APS (American Phytopathological Society)
- Government agricultural departments

IMPORTANT SOURCE RULES:

- Do NOT invent fake URLs.
- Only include a URL if you are reasonably confident it is correct.
- If unsure about the exact URL, set "url" to null.
- Sources should be relevant to the predicted disease.

Return ONLY valid JSON.

Use exactly this format:

{
  "description": "string",
  "possibleCauses": [
    "string"
  ],
  "recommendedTreatment": [
    "string"
  ],
  "preventionTips": [
    "string"
  ],
  "recommendations": [
    "string"
  ],
  "sources": [
    {
      "name": "Organization name",
      "title": "Relevant article or resource title",
      "url": "https://example.com/article"
    }
  ]
}

Do NOT wrap the JSON inside markdown.
Do NOT add any text before or after the JSON.
`;

    try {
      console.log(
        `[GeminiProvider] Generating guidance for: ${cropName} - ${diseaseName}`
      );

      const response =
        await this.ai.models.generateContent({
          model: this.modelName,
          contents: prompt
        });

      if (!response || !response.text) {
        throw new Error(
          'Empty response received from Gemini.'
        );
      }

      let cleanText = response.text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      let result;

      try {
        result = JSON.parse(cleanText);
      } catch (error) {
        const jsonMatch =
          cleanText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error(
            'Failed to parse Gemini JSON response.'
          );
        }
      }

      // Make sure sources always exists
      if (!Array.isArray(result.sources)) {
        result.sources = [];
      }

      return result;

    } catch (error) {
      console.error(
        '[GeminiProvider] Guidance generation failed:',
        error.message
      );

      throw error;
    }
  }
}

module.exports = GeminiProvider;