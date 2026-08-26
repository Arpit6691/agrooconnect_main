/**
 * Base AI Provider Interface for Plant Disease Detection
 */
class BaseProvider {
  constructor(name = 'base') {
    this.name = name;
  }

  /**
   * Analyze an uploaded plant/leaf image
   * @param {Object} imageInfo
   * @param {string} imageInfo.filePath - Absolute path to local image file
   * @param {string} imageInfo.mimetype - Image MIME type (e.g. image/jpeg)
   * @param {string} imageInfo.filename - Image original/saved filename
   * @returns {Promise<Object>} Raw provider result
   */
  async analyzePlantImage(imageInfo) {
    throw new Error(`analyzePlantImage() not implemented for provider ${this.name}`);
  }
}

module.exports = BaseProvider;
