 const { spawn } = require('child_process');
const path = require('path');
const BaseProvider = require('./baseProvider');

class PythonMLProvider extends BaseProvider {
  constructor() {
    super();

    this.name = 'pythonml';

    // Path to Python ML project
    this.pythonProjectPath =
      process.env.PYTHON_ML_PATH ||
      'C:\\Users\\HP\\AgrooConnect-ML';

    // Python executable inside virtual environment
    this.pythonExecutable =
      process.env.PYTHON_EXECUTABLE ||
      path.join(
        this.pythonProjectPath,
        'venv',
        'Scripts',
        'python.exe'
      );

    // Prediction script
    this.predictScript = path.join(
      this.pythonProjectPath,
      'predict_image.py'
    );
  }

  isConfigured() {
    return true;
  }

  async analyzePlantImage(imageInfo) {
    return new Promise((resolve, reject) => {
      const imagePath = imageInfo.filePath;

      console.log('[Python ML] Predicting image:', imagePath);

      const python = spawn(
        this.pythonExecutable,
        [
          this.predictScript,
          imagePath
        ],
        {
          cwd: this.pythonProjectPath
        }
      );

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('error', (error) => {
        reject(
          new Error(
            `Failed to start Python process: ${error.message}`
          )
        );
      });

      python.on('close', (code) => {
        if (code !== 0) {
          console.error('[Python ML Error]', errorOutput);

          return reject(
            new Error(
              `Python prediction failed with code ${code}: ${errorOutput}`
            )
          );
        }

        try {
          // Extract JSON because TensorFlow may print warnings
          const jsonStart = output.indexOf('{');
          const jsonEnd = output.lastIndexOf('}');

          if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error('No JSON found in Python output');
          }

          const jsonOutput = output.substring(
            jsonStart,
            jsonEnd + 1
          );

          const result = JSON.parse(jsonOutput);

          console.log(
            '[Python ML] Prediction:',
            result
          );

          resolve(result);

        } catch (error) {
          console.error(
            '[Python ML] Raw output:',
            output
          );

          reject(
            new Error(
              `Invalid response from Python model: ${error.message}`
            )
          );
        }
      });
    });
  }
}

module.exports = PythonMLProvider;