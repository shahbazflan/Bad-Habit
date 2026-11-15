const sharp = require('sharp');
const fs = require('fs');

async function refinedIron() {
  const inputPath = 'public/test_model_tight.png';
  const outputPath = 'public/assets/aistudio/mocha_model_ironed.png';

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Step 1: Accurate trouser mask
  // Identify every trouser pixel
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const a = data[idx + 3];
      if (a < 80) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (y >= 485 && y <= 1005) {
        // Exclude t-shirt
        const isShirt = (b > r + 3) || (r < 75 && g < 75);
        // Exclude left shoe (x < 175, y >= 895, dark leather)
        const isLeftShoe = (x < 175 && y >= 895 && r < 95 && g < 75 && b < 72);
        // Exclude right shoe (x >= 180, y >= 948, dark leather)
        const isRightShoe = (x >= 180 && y >= 948 && r < 95 && g < 75 && b < 72);
        const isShoe = isLeftShoe || isRightShoe || (y > 990 && r < 100 && g < 80);

        const isTrouserHue = (r > 100 && g > 75 && b > 50 && r > b + 15 && g > b + 8);

        if (!isShirt && !isShoe && isTrouserHue) {
          mask[y * width + x] = 1;
        }
      }
    }
  }

  // To prevent boundary bleed from shirt/shoes into the trousers during blurring,
  // create an image where non-trouser pixels are filled with the local average trouser color!
  const filledTrouserBuffer = Buffer.from(data);
  const avgTrouserR = 170, avgTrouserG = 142, avgTrouserB = 120;

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

  // Now blur the filled buffer so edges don't darken or lighten!
  const blurFine = await sharp(filledTrouserBuffer, { raw: { width, height, channels } })
    .blur(3)
    .raw()
    .toBuffer();

  const blurBroad = await sharp(filledTrouserBuffer, { raw: { width, height, channels } })
    .blur(14)
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

      // Wrinkle suppression:
      // In broad blur, all wrinkles are gone, only the 3D volume of the leg remains.
      // High frequency details (logo, fine grain): (fR - bR)
      // Wrinkle shadows are negative dips: (r < bR - 5)
      let ironR = bR;
      let ironG = bG;
      let ironB = bB;

      // Keep subtle high frequency texture / logo (reduced wrinkles):
      const detailR = fR - bR;
      const detailG = fG - bG;
      const detailB = fB - bB;

      // If it's a positive highlight or subtle texture, keep 30% of it
      // If it's a negative wrinkle dip, clamp it out completely!
      ironR += Math.max(-2, detailR * 0.35);
      ironG += Math.max(-2, detailG * 0.35);
      ironB += Math.max(-2, detailB * 0.35);

      // Clean bottom ankle cuffs: smooth out messy scrunches
      if (y >= 885 && y <= 980) {
        // Pure smooth form
        ironR = bR;
        ironG = bG;
        ironB = bB;
      }

      // Slightly calibrate color balance towards the left article's refined matte mocha
      ironR = ironR * 0.98;
      ironG = ironG * 1.01;
      ironB = ironB * 1.03;

      // Blend with original near boundaries to keep natural silhouettes and seams
      const blend = 0.90 * feather;
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

  console.log('Finished generating refined ironed model:', outputPath);
}

refinedIron().catch(console.error);
