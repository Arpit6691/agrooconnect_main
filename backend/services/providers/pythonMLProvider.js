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
      throw new Error('Image file path is missing.');
    }

    if (!fs.existsSync(imageInfo.filePath)) {
      throw new Error(`Image file not found: ${imageInfo.filePath}`);
    }

    try {
      console.log('[Python ML] Sending image to ML API:', this.mlApiUrl);

      // Create multipart form
      const form = new FormData();
      form.append('image', fs.createReadStream(imageInfo.filePath), {
        filename: imageInfo.filename || 'plant.jpg',
        contentType: imageInfo.mimetype || 'image/jpeg'
      });

      // 60-second timeout (Render free tier can take ~50s to wake up)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      let response;
      try {
        response = await fetch(`${this.mlApiUrl}/predict`, {
          method: 'POST',
          body: form,
          headers: form.getHeaders(),
          signal: controller.signal
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Detect HTML response (Render wake-up page or error page)
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        throw new Error(
          'The Plant Disease AI service is warming up (free tier). ' +
          'Please wait 30–60 seconds and try again.'
        );
      }

      // Parse JSON only after confirming it is JSON
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `ML API returned status ${response.status}`);
      }

      console.log('[Python ML] Prediction received:', result);

      /*
        Python API returns:
        {
          crop: "Apple",
          disease: "Apple Scab",
          status: "Diseased",
          confidence: 99.5
        }
      */
      return result;

    } catch (error) {
      console.error('[Python ML] API request failed:', error.message);

      // Friendly message for timeout
      if (error.name === 'AbortError') {
        throw new Error(
          'The Plant Disease AI service timed out. It may be warming up — please try again in 30–60 seconds.'
        );
      }

      throw new Error(`ML prediction failed: ${error.message}`);
    }
  }

}

module.exports = PythonMLProvider;