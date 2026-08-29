const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');
const BaseProvider = require('./baseProvider');

class PythonMLProvider extends BaseProvider {
  constructor() {
    super();

    this.name = 'pythonml';

    // Deployed Python ML API
    this.mlApiUrl =
      process.env.ML_API_URL ||
      'https://agrooconnect-ml.onrender.com';
  }

  /**
   * Check whether ML API URL exists
   */
  isConfigured() {
    return Boolean(this.mlApiUrl);
  }

  /**
   * Send plant image to deployed Python ML API
   */
  async analyzePlantImage(imageInfo) {
    if (!imageInfo || !imageInfo.filePath) {
      throw new Error(
        'Image file path is missing.'
      );
    }

    if (!fs.existsSync(imageInfo.filePath)) {
      throw new Error(
        `Image file not found: ${imageInfo.filePath}`
      );
    }

    try {
      console.log(
        '[Python ML] Sending image to ML API:',
        this.mlApiUrl
      );

      // Create multipart form
      const form = new FormData();

      form.append(
        'image',
        fs.createReadStream(imageInfo.filePath),
        {
          filename:
            imageInfo.filename || 'plant.jpg',
          contentType:
            imageInfo.mimetype || 'image/jpeg'
        }
      );

      // Send image to Python ML API
      const response = await fetch(
        `${this.mlApiUrl}/predict`,
        {
          method: 'POST',
          body: form,
          headers: form.getHeaders()
        }
      );

      const result = await response.json();

      // Handle API errors
      if (!response.ok) {
        throw new Error(
          result.error ||
          `ML API returned status ${response.status}`
        );
      }

      console.log(
        '[Python ML] Prediction received:',
        result
      );

      /*
        Python API returns:

        {
          crop: "Apple",
          disease: "Apple Scab",
          status: "Diseased",
          confidence: 99.5
        }

        Return directly to diseaseNormalizer
      */

      return result;

    } catch (error) {
      console.error(
        '[Python ML] API request failed:',
        error.message
      );

      throw new Error(
        `ML prediction failed: ${error.message}`
      );
    }
  }
}

module.exports = PythonMLProvider;