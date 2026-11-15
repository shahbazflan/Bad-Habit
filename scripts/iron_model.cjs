const sharp = require('sharp');
const fs = require('fs');

async function ironModel() {
  // Input is test_model_tight.png (tightly cropped 340x1098)
  const inputPath = 'public/test_model_tight.png';
  const outputPath = 'public/model_ironed_test.png';

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels;

  // Create low-pass blurred version of the entire image to represent ironed form
  const blurredBuffer = await sharp(inputPath)
    .blur(9) // Smooths out all wrinkles and creases
    .raw()
    .toBuffer();

  const extraBlurredBuffer = await sharp(inputPath)
    .blur(16)
    .raw()
    .toBuffer();

  const outputData = Buffer.from(data);

  // Process pixel by pixel
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const a = data[idx + 3];
      if (a < 50) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Detect if pixel is in trousers zone:
      // Trousers are between y = 480 and y = 1010
      // Color characteristics: mocha/taupe/khaki
      // r in [110, 215], g in [85, 185], b in [60, 155]
      // r > b + 25, g > b + 15
      // And not the dark shoes: (r > 95 && g > 75)
      // And not the dark t-shirt: (r > b + 15 && r > 70)
      const isTrouserY = y >= 475 && y <= 1015;
      const isTrouserColor = (
        r >= 100 && g >= 75 && b >= 50 &&
        r > b + 18 && g > b + 10 &&
        !(r < 95 && g < 75 && b < 70) // not shoes
      );

      // Check if it's the ESSENTIALS logo on the left thigh:
      // Logo is around y: 530 - 565, x: 190 - 240
      const isLogoArea = (y >= 530 && y <= 568 && x >= 190 && x <= 245);

      if (isTrouserY && isTrouserColor) {
        // Blend between original and blurred
        // If it's a deep shadow crease (wrinkle), we lift it towards the base tone
        const blurR = blurredBuffer[idx];
        const blurG = blurredBuffer[idx + 1];
        const blurB = blurredBuffer[idx + 2];

        const xBlurR = extraBlurredBuffer[idx];
        const xBlurG = extraBlurredBuffer[idx + 1];
        const xBlurB = extraBlurredBuffer[idx + 2];

        if (isLogoArea) {
          // Keep subtle embossed logo crisp by keeping more of the original high frequency
          outputData[idx] = Math.round(0.4 * r + 0.6 * blurR);
          outputData[idx + 1] = Math.round(0.4 * g + 0.6 * blurG);
          outputData[idx + 2] = Math.round(0.4 * b + 0.6 * blurB);
        } else {
          // Ironing effect:
          // Heavy smoothing of crease lines and wrinkle shadows
          // We take the smooth form from blur and extra-blur
          // Smooth blend factor: 85% blurred (ironed flat), 15% original subtle micro-texture
          const ironFactor = 0.88;
          let ironR = (1 - ironFactor) * r + ironFactor * blurR;
          let ironG = (1 - ironFactor) * g + ironFactor * blurG;
          let ironB = (1 - ironFactor) * b + ironFactor * blurB;

          // If the original pixel was a crease shadow (r < blurR - 8), fill the shadow:
          if (r < blurR - 6) {
            // Shadow crease in wrinkle: lift it up towards xBlur
            ironR = Math.max(ironR, xBlurR * 0.98);
            ironG = Math.max(ironG, xBlurG * 0.98);
            ironB = Math.max(ironB, xBlurB * 0.98);
          }

          // If near the ankle bunches (y >= 880 && y <= 980), smooth even more:
          if (y >= 880 && y <= 980) {
            ironR = 0.95 * xBlurR + 0.05 * r;
            ironG = 0.95 * xBlurG + 0.05 * g;
            ironB = 0.95 * xBlurB + 0.05 * b;
          }

          // Enhance the clean pressed studio tone matching the left article
          // (Left article has warm mocha #be9f84 with gentle studio curve)
          outputData[idx] = Math.min(255, Math.max(0, Math.round(ironR)));
          outputData[idx + 1] = Math.min(255, Math.max(0, Math.round(ironG)));
          outputData[idx + 2] = Math.min(255, Math.max(0, Math.round(ironB)));
        }
      }
    }
  }

  await sharp(outputData, {
    raw: {
      width,
      height,
      channels
    }
  })
  .png()
  .toFile(outputPath);

  console.log('Successfully generated ironed model test:', outputPath);
}

ironModel().catch(console.error);
