const sharp = require('sharp');
const fs = require('fs');

async function perfectIron() {
  const inputPath = 'public/test_model_tight.png';
  const outputPath = 'public/assets/aistudio/mocha_model_isolated.png';

  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // 1. Identify trouser mask
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const a = data[idx + 3];
      if (a < 80) continue;

      const r = data[idx], g = data[idx + 1], b = data[idx + 2];

      if (y >= 485 && y <= 995) {
        const isShirt = (b > r + 3) || (r < 75 && g < 75);
        const isLeftShoe = (x < 175 && y >= 895 && r < 95 && g < 75 && b < 72);
        const isRightShoe = (x >= 180 && y >= 948 && r < 95 && g < 75 && b < 72);
        const isShoe = isLeftShoe || isRightShoe || (y > 990 && r < 100);

        // Include any pixel in the trouser area that isn't shirt or shoe
        if (!isShirt && !isShoe && (y <= 880 || (x < 175 && y < 895) || (x >= 175 && y < 948) || (r > 70 && g > 55))) {
          mask[y * width + x] = 1;
        }
      }
    }
  }

  // Filled buffer for boundary-safe blurring
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

  // Smooth studio lighting gradient
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

      // Feather distance
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

      // Studio ironed finish
      let ironR = 0.88 * sR + 0.12 * fR;
      let ironG = 0.88 * sG + 0.12 * fG;
      let ironB = 0.88 * sB + 0.12 * fB;

      // Color calibration matching Mocha Essentials article on left (#be9f84)
      ironR = ironR * 0.98;
      ironG = ironG * 1.01;
      ironB = ironB * 1.03;

      // If the original pixel was a dark artifact/crease (r < 120 or near the inner seam/ankle folds),
      // force 100% smooth ironed studio tone with no dark spots
      const isDarkCrease = (r < 125);
      const alphaBlend = isDarkCrease ? 1.0 : (0.94 * feather);

      out[idx] = Math.round((1 - alphaBlend) * r + alphaBlend * ironR);
      out[idx + 1] = Math.round((1 - alphaBlend) * g + alphaBlend * ironG);
      out[idx + 2] = Math.round((1 - alphaBlend) * b + alphaBlend * ironB);
    }
  }

  await sharp(out, { raw: { width, height, channels } })
    .png()
    .toFile(outputPath);

  console.log('Saved final flawless ironed model to:', outputPath);
}

perfectIron().catch(console.error);
