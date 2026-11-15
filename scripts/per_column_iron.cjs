const sharp = require('sharp');
const fs = require('fs');

async function perColumnIron() {
  const inputPath = 'public/test_model_tight.png';
  const outputPath = 'public/assets/aistudio/mocha_model_isolated.png';

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // For each column x, find exact topY (where navy shirt ends and mocha starts)
  // and bottomY (where mocha ends and shoes start)
  const topY = new Int32Array(width).fill(-1);
  const bottomY = new Int32Array(width).fill(-1);

  for (let x = 0; x < width; x++) {
    // Scan down for top of trousers
    for (let y = 450; y < 650; y++) {
      const idx = (y * width + x) * channels;
      const a = data[idx + 3];
      if (a < 100) continue;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      // Mocha trouser tone
      if (r > 110 && g > 85 && b > 55 && r > b + 18) {
        topY[x] = y;
        break;
      }
    }

    // Scan up from y=1050 for bottom of trousers (just above shoes)
    for (let y = 1010; y >= 750; y--) {
      const idx = (y * width + x) * channels;
      const a = data[idx + 3];
      if (a < 100) continue;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      // Mocha trouser tone
      if (r > 105 && g > 80 && b > 50 && r > b + 15) {
        bottomY[x] = y;
        break;
      }
    }
  }

  // Build mask from column profiles
  const mask = new Uint8Array(width * height);
  for (let x = 0; x < width; x++) {
    if (topY[x] === -1 || bottomY[x] === -1) continue;
    // Add small 2px margin from shirt and shoes to keep seams clean
    const startY = topY[x] + 1;
    const endY = bottomY[x] - 1;
    for (let y = startY; y <= endY; y++) {
      const idx = (y * width + x) * channels;
      if (data[idx + 3] > 80) {
        mask[y * width + x] = 1;
      }
    }
  }

  // Filled buffer for blur
  const filled = Buffer.from(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (!mask[y * width + x]) {
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

  const fineBlur = await sharp(filled, { raw: { width, height, channels } })
    .blur(3)
    .raw()
    .toBuffer();

  const out = Buffer.from(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (!mask[y * width + x]) continue;

      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const bR = broadBlur[idx], bG = broadBlur[idx + 1], bB = broadBlur[idx + 2];
      const fR = fineBlur[idx], fG = fineBlur[idx + 1], fB = fineBlur[idx + 2];

      // Distance from mask edge for soft boundary blending
      let dist = 5;
      for (let d = 1; d <= 4; d++) {
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
      const feather = Math.min(1.0, dist / 3.5);

      // Studio ironed composite
      let ironR = 0.85 * bR + 0.15 * fR;
      let ironG = 0.85 * bG + 0.15 * fG;
      let ironB = 0.85 * bB + 0.15 * fB;

      // Color calibration matching Mocha Essentials article on left (#be9f84)
      ironR = ironR * 0.98;
      ironG = ironG * 1.01;
      ironB = ironB * 1.03;

      const isWrinkle = (r < bR - 2);
      const blend = isWrinkle ? (0.95 * feather) : (0.88 * feather);

      out[idx] = Math.round((1 - blend) * r + blend * ironR);
      out[idx + 1] = Math.round((1 - blend) * g + blend * ironG);
      out[idx + 2] = Math.round((1 - blend) * b + blend * ironB);
      out[idx + 3] = data[idx + 3];
    }
  }

  const trimmed = await sharp(out, { raw: { width, height, channels } })
    .trim()
    .png()
    .toBuffer();

  fs.writeFileSync(outputPath, trimmed);
  const meta = await sharp(outputPath).metadata();
  console.log('Saved perColumnIron model:', meta.width, 'x', meta.height);
}

perColumnIron().catch(console.error);
