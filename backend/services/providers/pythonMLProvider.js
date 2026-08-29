const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');
const BaseProvider = require('./baseProvider');

class PythonMLProvider extends BaseProvider {
  constructor() {
    super();
    this.name = 'pythonml';

    // Deployed Python ML API on Render
    this.mlApiUrl =
      process.env.ML_API_URL ||
      'https://agrooconnect-ml.onrender.com';
  }

  /**
   * Check whether ML API URL is configured
   */
  isConfigured() {
    return Boolean(this.mlApiUrl);
  }

  /**
   * Ping the ML API root to wake Render free-tier instance.
   * Returns true if the service responded with JSON.
   */
  async _pingApi() {
    try {
      const res = await fetch(this.mlApiUrl, { method: 'GET' });
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const body = await res.json();
        console.log('[Python ML] Ping OK:', body.message || JSON.stringify(body));
        return true;
      }
      console.warn('[Python ML] Ping returned non-JSON content-type:', ct);
      return false;
    } catch (e) {
      console.warn('[Python ML] Ping failed:', e.message);
      return false;
    }
  }

  /**
   * POST image to /predict.
   * Always reads response as text first, then parses JSON safely.
   * Retries once if Render returns an HTML wake-up page.
   *
   * Field name: 'image' (verified — API returns 400 for any other name)
   *
   * @param {string} filePath   Absolute path to uploaded image
   * @param {string} filename   Original filename
   * @param {string} mimetype   MIME type (e.g. image/jpeg)
   * @param {number} attempt    Internal retry counter (1 or 2)
   */
  async _callPredict(filePath, filename, mimetype, attempt = 1) {
    const endpoint = `${this.mlApiUrl}/predict`;
    console.log(`[Python ML] POST ${endpoint} (attempt ${attempt})`);

    const form = new FormData();
    form.append('image', fs.createReadStream(filePath), {
      filename: filename || 'plant.jpg',
      contentType: mimetype || 'image/jpeg'
    });

    // 90-second timeout — Render free tier can take ~50 s to cold-start
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        body: form,
        headers: form.getHeaders(),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    // ── Diagnostic logging ──────────────────────────────────────────────
    const httpStatus  = response.status;
    const contentType = response.headers.get('content-type') || '(none)';
    console.log(`[Python ML] HTTP ${httpStatus} | Content-Type: ${contentType}`);

    // Always read body as text first
    const rawBody = await response.text();
    console.log(`[Python ML] Raw body (first 400 chars): ${rawBody.substring(0, 400)}`);
    // ────────────────────────────────────────────────────────────────────

    // Detect HTML — Render wake-up page or nginx error page
    if (
      contentType.includes('text/html') ||
      rawBody.trimStart().startsWith('<!DOCTYPE') ||
      rawBody.trimStart().startsWith('<html')
    ) {
      if (attempt === 1) {
        console.warn('[Python ML] Got HTML response (service warming up). Waiting 15 s then retrying…');
        await new Promise(resolve => setTimeout(resolve, 15000));
        return this._callPredict(filePath, filename, mimetype, 2);
      }
      throw new Error(
        'The Plant Disease AI service is still warming up. ' +
        'Please wait 30–60 seconds and try again.'
      );
    }

    // Safe JSON parse
    let result;
    try {
      result = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error('[Python ML] JSON parse failed. Raw body:', rawBody.substring(0, 500));
      throw new Error(
        `ML API returned invalid JSON (status ${httpStatus}). ` +
        `First 200 chars: ${rawBody.substring(0, 200)}`
      );
    }

    // API-level error
    if (!response.ok) {
      throw new Error(
        result.error ||
        result.message ||
        `ML API returned status ${httpStatus}`
      );
    }

    return result;
  }

  /**
   * Public entry point — called by plantDiseaseDetector.js
   *
   * Python API returns:
   *   { crop, disease, status, confidence }
   */
  async analyzePlantImage(imageInfo) {
    if (!imageInfo || !imageInfo.filePath) {
      throw new Error('Image file path is missing.');
    }
    if (!fs.existsSync(imageInfo.filePath)) {
      throw new Error(`Image file not found: ${imageInfo.filePath}`);
    }

    try {
      const result = await this._callPredict(
        imageInfo.filePath,
        imageInfo.filename,
        imageInfo.mimetype
      );

      console.log('[Python ML] Prediction received:', result);
      return result;

    } catch (error) {
      console.error('[Python ML] analyzePlantImage failed:', error.message);

      if (error.name === 'AbortError') {
        throw new Error(
          'The Plant Disease AI service timed out (90 s). ' +
          'It may still be warming up — please try again in 30–60 seconds.'
        );
      }

      // Re-throw with ML prefix so upstream can identify source
      throw new Error(`ML prediction failed: ${error.message}`);
    }
  }
}

module.exports = PythonMLProvider;