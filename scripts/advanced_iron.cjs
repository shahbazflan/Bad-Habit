const sharp = require('sharp');
const fs = require('fs');

async function advancedIron() {
  const inputPath = 'public/test_model_tight.png';
  const outputPath = 'public/assets/aistudio/mocha_model_ironed.png';

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // 1. Build high-precision trouser mask
  // 0 = outside trousers, 255 = inside trousers
  const mask = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const a = data[idx + 3];
      if (a < 80) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Trousers are between y = 478 and y = 1005
      if (y >= 478 && y <= 1005) {
        // Exclude t-shirt (navy/dark):
        const isShirt = (b > r + 5) || (r < 75 && g < 75 && b < 100);
        
        // Exclude shoes:
        // Left shoe is roughly at x: 0..170, y >= 890 with dark reddish/brown leather (r < 95, g < 65, b < 65)
        // Right shoe is at x: 200..320, y >= 950 with dark leather
        const isLeftShoe = (x < 175 && y >= 895 && r < 98 && g < 75 && b < 72);
        const isRightShoe = (x >= 180 && y >= 948 && r < 98 && g < 75 && b < 72);
        const isShoe = isLeftShoe || isRightShoe || (y > 990 && r < 105 && g < 80);

        // Exclude hands/skin if any (none in this region, hands are above y=450 or behind back)
        
        // Check if color matches mocha trouser range:
        const isMochaTone = (r > 100 && g > 75 && b > 50 && r > b + 15 && g > b + 8);

        if (!isShirt && !isShoe && isMochaTone) {
          mask[y * width + x] = 255;
        }
      }
    }
  }

  // Morphological cleanup of mask: dilate 1 then erode 1 to fill micro holes
  const tempMask = new Uint8Array(mask);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (tempMask[idx] === 0) {
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (tempMask[(y + dy) * width + (x + dx)] === 255) count++;
          }
        }
        if (count >= 5) mask[idx] = 255;
      }
    }
  }

  // Multi-scale Gaussian blurred passes
  const blurMedium = await sharp(inputPath).blur(7).raw().toBuffer();
  const blurWide = await sharp(inputPath).blur(15).raw().toBuffer();

  const out = Buffer.from(data);

  // Logo protection zone (thigh):
  // x: 190..245, y: 530..568

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const maskVal = mask[y * width + x];

      if (maskVal === 0) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const mR = blurMedium[idx];
      const mG = blurMedium[idx + 1];
      const mB = blurMedium[idx + 2];

      const wR = blurWide[idx];
      const wG = blurWide[idx + 1];
      const wB = blurWide[idx + 2];

      const isLogo = (x >= 188 && x <= 248 && y >= 530 && y <= 568);

      if (isLogo) {
        // Keep logo intact: gentle 40% iron
        out[idx] = Math.round(0.55 * r + 0.45 * mR);
        out[idx + 1] = Math.round(0.55 * g + 0.45 * mG);
        out[idx + 2] = Math.round(0.55 * b + 0.45 * mB);
        continue;
      }

      // Check distance to mask edge for soft boundary blending (feathering)
      let minDistToEdge = 6;
      for (let d = 1; d <= 5; d++) {
        if (
          x - d < 0 || mask[y * width + (x - d)] === 0 ||
          x + d >= width || mask[y * width + (x + d)] === 0 ||
          y - d < 0 || mask[(y - d) * width + x] === 0 ||
          y + d >= height || mask[(y + d) * width + x] === 0
        ) {
          minDistToEdge = d;
          break;
        }
      }
      const edgeWeight = Math.min(1, minDistToEdge / 5);

      // Base iron tone:
      // Combining wide blur (global light form) with medium blur (soft volume)
      let ironR = 0.65 * wR + 0.35 * mR;
      let ironG = 0.65 * wG + 0.35 * mG;
      let ironB = 0.65 * wB + 0.35 * mB;

      // Retain fine vertical crease lines:
      // Check if there is a vertical gradient vs horizontal
      // Wrinkles are mostly horizontal; vertical creases are intentional garment seams!
      const dy = Math.abs(r - (y > 0 ? data[((y - 1) * width + x) * channels] : r));
      const dx = Math.abs(r - (x > 0 ? data[(y * width + (x - 1)) * channels] : r));

      // Crease shadow compensation:
      // If original pixel was in a dark fold crevice (r < mR - 5), lift it
      if (r < mR - 4) {
        const shadowLift = Math.min(1.0, (mR - r) / 25);
        ironR = ironR + shadowLift * 6;
        ironG = ironG + shadowLift * 5;
        ironB = ironB + shadowLift * 4;
      }

      // Slightly tune color temperature towards the clean mocha of the left article (R: 164, G: 144, B: 126)
      // Model trousers are slightly more yellow/warm; matching left article makes them look identical
      ironR = ironR * 0.98;
      ironG = ironG * 1.01;
      ironB = ironB * 1.04;

      // Final blend with original based on edge feathering
      const finalIronAmount = 0.88 * edgeWeight;
      out[idx] = Math.round((1 - finalIronAmount) * r + finalIronAmount * ironR);
      out[idx + 1] = Math.round((1 - finalIronAmount) * g + finalIronAmount * ironG);
      out[idx + 2] = Math.round((1 - finalIronAmount) * b + finalIronAmount * ironB);
    }
  }

  await sharp(out, {
    raw: { width, height, channels }
  })
  .png()
  .toFile(outputPath);

  console.log('Finished generating advanced ironed model:', outputPath);
}

advancedIron().catch(console.error);
