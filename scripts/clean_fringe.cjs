const sharp = require('sharp');
const fs = require('fs');

async function cleanFringeAndPerfectIron() {
  const inputPath = 'public/test_model_tight.png';
  const outputPath = 'public/assets/aistudio/mocha_model_isolated.png';

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // 1. First pass: eliminate blue fringe from concrete around the entire trousers/model
  // Blue concrete has: b > r - 5, or r < 100 && b > 90
  for (let y = 480; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const a = data[idx + 3];
      if (a === 0) continue;

      const r = data[idx], g = data[idx + 1], b = data[idx + 2];

      // Exclude shoes
      const isShoe = (x < 175 && y >= 895 && r < 95) || (x >= 180 && y >= 948 && r < 95);
      if (isShoe) continue;

      // Blue background concrete bleed:
      if (b >= r || (b > 100 && r < 115) || (b > 85 && r < 100)) {
        // Transparent
        data[idx + 3] = 0;
      }
    }
  }

  // 2. Identify all valid trouser pixels
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const a = data[idx + 3];
      if (a < 50) continue;

      const r = data[idx], g = data[idx + 1], b = data[idx + 2];

      if (y >= 485 && y <= 995) {
        const isShirt = (b > r + 3) || (r < 75 && g < 75);
        const isShoe = (x < 175 && y >= 895 && r < 95) || (x >= 180 && y >= 948 && r < 95) || (y > 990);

        if (!isShirt && !isShoe && (r > 75 && g > 60)) {
          mask[y * width + x] = 1;
        }
      }
    }
  }

  // 3. Prepare filled buffer for edge-safe blurring
  const filledBuffer = Buffer.from(data);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (!mask[y * width + x]) {
        filledBuffer[idx] = 168;
        filledBuffer[idx + 1] = 142;
        filledBuffer[idx + 2] = 120;
      }
    }
  }

  const studioLight = await sharp(filledBuffer, { raw: { width, height, channels } })
    .blur(18)
    .raw()
    .toBuffer();

  const fineSurface = await sharp(filledBuffer, { raw: { width, height, channels } })
    .blur(4)
    .raw()
    .toBuffer();

  const out = Buffer.from(data);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (!mask[y * width + x]) continue;

      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      const sR = studioLight[idx], sG = studioLight[idx + 1], sB = studioLight[idx + 2];
      const fR = fineSurface[idx], fG = fineSurface[idx + 1], fB = fineSurface[idx + 2];

      let dist = 6;
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

      let ironR = 0.88 * sR + 0.12 * fR;
      let ironG = 0.88 * sG + 0.12 * fG;
      let ironB = 0.88 * sB + 0.12 * fB;

      // Color balance calibration matching Mocha Essentials article on left (#be9f84)
      ironR = ironR * 0.98;
      ironG = ironG * 1.01;
      ironB = ironB * 1.03;

      const alphaBlend = 0.94 * feather;
      out[idx] = Math.round((1 - alphaBlend) * r + alphaBlend * ironR);
      out[idx + 1] = Math.round((1 - alphaBlend) * g + alphaBlend * ironG);
      out[idx + 2] = Math.round((1 - alphaBlend) * b + alphaBlend * ironB);
    }
  }

  // Trim transparent padding to make sure bounding box is tight
  const trimmed = await sharp(out, { raw: { width, height, channels } })
    .trim()
    .png()
    .toBuffer();

  fs.writeFileSync(outputPath, trimmed);

  const finalMeta = await sharp(outputPath).metadata();
  console.log('Saved pristine ironed model:', finalMeta.width, 'x', finalMeta.height);
}

cleanFringeAndPerfectIron().catch(console.error);
