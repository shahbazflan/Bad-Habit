const sharp = require('sharp');
const fs = require('fs');

async function finalIronModel() {
  const inputPath = 'public/test_model_tight.png';
  const outputPath = 'public/assets/aistudio/mocha_model_isolated.png';

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Build accurate trouser mask
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const a = data[idx + 3];
      if (a < 80) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (y >= 485 && y <= 1000) {
        // Exclude t-shirt
        const isShirt = (b > r + 3) || (r < 75 && g < 75);
        // Exclude shoes
        const isLeftShoe = (x < 175 && y >= 895 && r < 95 && g < 75 && b < 72);
        const isRightShoe = (x >= 180 && y >= 948 && r < 95 && g < 75 && b < 72);
        const isShoe = isLeftShoe || isRightShoe || (y > 990 && r < 100 && g < 80);

        // Include any pixel that is either mocha tone OR an inner shadow of the mocha trousers
        const isTrouserHue = (r > 90 && g > 70 && b > 45 && r > b + 12 && g > b + 6);
        // Include the inner seam shadow between legs so it gets smoothed rather than left as speckled artifact
        const isInnerCrotchSeam = (x >= 135 && x <= 158 && y >= 530 && y <= 780 && r > 60 && g > 45 && b > 35);
        // Include right ankle folds so they get ironed
        const isRightAnkleFold = (x >= 220 && x <= 295 && y >= 945 && y <= 982 && !isRightShoe && (r > 80 && g > 60));

        if (!isShirt && !isShoe && (isTrouserHue || isInnerCrotchSeam || isRightAnkleFold)) {
          mask[y * width + x] = 1;
        }
      }
    }
  }

  // Create filled buffer for boundary-safe blurring
  const filledTrouserBuffer = Buffer.from(data);
  const avgTrouserR = 168, avgTrouserG = 142, avgTrouserB = 122;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (mask[y * width + x] === 0) {
        filledTrouserBuffer[idx] = avgTrouserR;
        filledTrouserBuffer[idx + 1] = avgTrouserG;
        filledTrouserBuffer[idx + 2] = avgTrouserB;
      }
    }
  }

  const blurFine = await sharp(filledTrouserBuffer, { raw: { width, height, channels } })
    .blur(3)
    .raw()
    .toBuffer();

  const blurBroad = await sharp(filledTrouserBuffer, { raw: { width, height, channels } })
    .blur(16)
    .raw()
    .toBuffer();

  const out = Buffer.from(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (mask[y * width + x] === 0) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const fR = blurFine[idx];
      const fG = blurFine[idx + 1];
      const fB = blurFine[idx + 2];

      const bR = blurBroad[idx];
      const bG = blurBroad[idx + 1];
      const bB = blurBroad[idx + 2];

      // Measure distance to mask edge for smooth feathering
      let dist = 6;
      for (let d = 1; d <= 5; d++) {
        if (
          x - d < 0 || !mask[y * width + (x - d)] ||
          x + d >= width || !mask[y * width + (x + d)] ||
          y - d < 0 || !mask[(y - d) * width + x] ||
          y + d >= height || !mask[(y + d) * width + x]
        ) {
          dist = d;
          break;
        }
      }
      const feather = Math.min(1.0, dist / 4.0);

      let ironR = bR;
      let ironG = bG;
      let ironB = bB;

      // Keep subtle high frequency texture (logo, fine grain)
      const detailR = fR - bR;
      const detailG = fG - bG;
      const detailB = fB - bB;

      // Preserve positive highlights and delicate texture, suppress wrinkle troughs
      ironR += Math.max(-1, detailR * 0.35);
      ironG += Math.max(-1, detailG * 0.35);
      ironB += Math.max(-1, detailB * 0.35);

      // Clean bottom ankle cuffs: smooth out messy scrunches
      if (y >= 885 && y <= 980) {
        ironR = bR;
        ironG = bG;
        ironB = bB;
      }

      // Slightly calibrate color balance towards the left article's refined matte mocha
      ironR = ironR * 0.98;
      ironG = ironG * 1.01;
      ironB = ironB * 1.03;

      // Inner leg contour: gentle shading so the two legs are distinct
      if (x >= 135 && x <= 150 && y >= 535 && y <= 700) {
        // Natural leg separation shadow
        ironR *= 0.92;
        ironG *= 0.92;
        ironB *= 0.92;
      }

      // Blend with original based on edge feathering
      const blend = 0.92 * feather;
      out[idx] = Math.round((1 - blend) * r + blend * ironR);
      out[idx + 1] = Math.round((1 - blend) * g + blend * ironG);
      out[idx + 2] = Math.round((1 - blend) * b + blend * ironB);
    }
  }

  await sharp(out, {
    raw: { width, height, channels }
  })
  .png()
  .toFile(outputPath);

  console.log('Saved final ironed model to:', outputPath);
}

finalIronModel().catch(console.error);
