const sharp = require('sharp');
const fs = require('fs');

async function ironPerfection() {
  const inputPath = 'public/test_model_tight.png';
  const outputPath = 'public/assets/aistudio/mocha_model_isolated.png';

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Let's create a map of trouser pixels
  const isTrouser = new Uint8Array(width * height);
  for (let y = 515; y < 980; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const a = data[idx + 3];
      if (a < 100) continue;

      const r = data[idx], g = data[idx + 1], b = data[idx + 2];

      // Exclude shoes
      const isLeftShoe = (x < 172 && y >= 892 && r < 95 && g < 75);
      const isRightShoe = (x >= 178 && y >= 945 && r < 95 && g < 75);
      const isShoe = isLeftShoe || isRightShoe || (y > 980);

      // Exclude navy t-shirt
      const isNavyShirt = (b > r) || (r < 75 && g < 75);

      if (!isShoe && !isNavyShirt && (r > 90 && g > 70 && b > 45 && r > b + 12)) {
        isTrouser[y * width + x] = 1;
      }
    }
  }

  // Fill a background for smooth edge-preserving blurring
  const filled = Buffer.from(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (!isTrouser[y * width + x]) {
        filled[idx] = 168;
        filled[idx + 1] = 142;
        filled[idx + 2] = 120;
      }
    }
  }

  // Broad blur for wrinkle-free ironed volume
  const broadBlur = await sharp(filled, { raw: { width, height, channels } })
    .blur(16)
    .raw()
    .toBuffer();

  // Subtle blur for fine fabric grain
  const fineBlur = await sharp(filled, { raw: { width, height, channels } })
    .blur(3)
    .raw()
    .toBuffer();

  const out = Buffer.from(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (!isTrouser[y * width + x]) continue;

      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const bR = broadBlur[idx], bG = broadBlur[idx + 1], bB = broadBlur[idx + 2];
      const fR = fineBlur[idx], fG = fineBlur[idx + 1], fB = fineBlur[idx + 2];

      // Distance from edge for natural feathering
      let dist = 5;
      for (let d = 1; d <= 4; d++) {
        if (
          x - d < 0 || !isTrouser[y * width + (x - d)] ||
          x + d >= width || !isTrouser[y * width + (x + d)] ||
          y - d < 0 || !isTrouser[(y - d) * width + x] ||
          y + d >= height || !isTrouser[(y + d) * width + x]
        ) {
          dist = d;
          break;
        }
      }
      const feather = Math.min(1.0, dist / 3.0);

      // Studio ironed composite
      // Smooth pressed fabric
      let ironR = 0.85 * bR + 0.15 * fR;
      let ironG = 0.85 * bG + 0.15 * fG;
      let ironB = 0.85 * bB + 0.15 * fB;

      // Color calibration matching left Mocha Essentials article (#be9f84)
      ironR = ironR * 0.98;
      ironG = ironG * 1.01;
      ironB = ironB * 1.03;

      // Wrinkle shadow lift:
      // If original had dark wrinkle trough, completely replace it with smooth ironed fabric
      const isWrinkle = (r < bR - 3);
      const blend = isWrinkle ? (0.95 * feather) : (0.88 * feather);

      out[idx] = Math.round((1 - blend) * r + blend * ironR);
      out[idx + 1] = Math.round((1 - blend) * g + blend * ironG);
      out[idx + 2] = Math.round((1 - blend) * b + blend * ironB);
      // Keep alpha strictly intact!
      out[idx + 3] = data[idx + 3];
    }
  }

  // Ensure tight trim so image has no lateral transparent asymmetry
  const trimmed = await sharp(out, { raw: { width, height, channels } })
    .trim()
    .png()
    .toBuffer();

  fs.writeFileSync(outputPath, trimmed);
  const meta = await sharp(outputPath).metadata();
  console.log('Saved ironPerfection model:', meta.width, 'x', meta.height);
}

ironPerfection().catch(console.error);
