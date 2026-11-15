const sharp = require('sharp');
const fs = require('fs');

async function extractCleanModel(inputFile, outputFile) {
  console.log(`Processing: ${inputFile}`);
  const { data, info } = await sharp(inputFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // 1. Definite top and bottom background
      if (y < 310 || y > 1490) {
        data[idx + 3] = 0;
        continue;
      }

      // 2. Far left and far right walls
      if (x < 100 || x > width - 100) {
        data[idx + 3] = 0;
        continue;
      }

      const diffBR = b - r;
      const diffGR = g - r;
      const diffBG = b - g;

      // 3. Blue concrete signature (wall, floor, between arms, between legs)
      const isBlue = (diffBR > 25 && diffGR > 12 && b > 65) ||
                     (diffBR > 20 && diffBG > 10 && b > 75) ||
                     (diffBR > 35 && b > 70) ||
                     (b > 115 && b > r + 30);

      // 4. White floor neon reflection tubes outside shoes
      const isNeonFloor = (y > 1050) && (x < 240 || x > 700) && (diffBR > 15 || (r > 130 && b > 150));

      if (isBlue || isNeonFloor) {
        data[idx + 3] = 0;
      }
    }
  }

  // Remove small floating specks (morphological cleanup)
  const alphaCopy = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    alphaCopy[i] = data[i * 4 + 3];
  }

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (alphaCopy[idx] > 0) {
        // Count non-zero neighbors in 3x3
        let count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (alphaCopy[(y + dy) * width + (x + dx)] > 0) count++;
          }
        }
        if (count < 3) {
          data[idx * 4 + 3] = 0;
        }
      }
    }
  }

  // Find exact bounding box of remaining foreground
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log(`Bbox: x=[${minX}, ${maxX}] y=[${minY}, ${maxY}]`);
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  await sharp(data, {
    raw: { width, height, channels: 4 }
  })
    .extract({
      left: minX,
      top: minY,
      width: cropW,
      height: cropH
    })
    .png({ compressionLevel: 9 })
    .toFile(outputFile);

  console.log(`Saved: ${outputFile} (${cropW}x${cropH})`);
}

async function run() {
  await extractCleanModel(
    'public/assets/aistudio/Bad_Habit_essentials_cream_trousers-7_c95787a6.png',
    'public/assets/aistudio/model_cream.png'
  );
}

run();
