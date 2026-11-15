const sharp = require('sharp');
const fs = require('fs');

async function extractModel(inputFile, outputFile) {
  console.log('Processing:', inputFile);
  const { data, info } = await sharp(inputFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const isBg = new Uint8Array(width * height);

  // Classify background pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      // Definite background text regions at top and bottom
      if (y < 340 || y > 1460) {
        // Top and bottom text: "BAD HABIT", "DM TO ORDER", headers
        // Model head only reaches up to y ~ 330 in some poses, feet down to ~ 1450
        const isWhiteText = r > 180 && g > 180 && b > 180;
        const isBlueWall = (b > r + 25) && (b > g + 10);
        const isDarkBlueFloor = b > r + 15 && b > 80;
        if (isWhiteText || isBlueWall || isDarkBlueFloor) {
          isBg[y * width + x] = 1;
          continue;
        }
      }

      // Blue concrete wall and floor detection:
      // In blue concrete: B is dominant over R and G
      // Typical wall: R~30, G~70, B~110 -> (b-r) ~ 80, (b-g) ~ 40
      // Floor highlight: R~120, G~160, B~200 -> (b-r) ~ 80, (b-g) ~ 40
      const diffBR = b - r;
      const diffBG = b - g;

      // Check if clearly blue background
      if (diffBR > 22 && diffBG > 8 && b > 65) {
        isBg[y * width + x] = 1;
      }
    }
  }

  // Flood fill from edges so any blue connected to outside borders is removed
  const queue = [];
  const visited = new Uint8Array(width * height);

  // Push border pixels
  for (let x = 0; x < width; x++) {
    queue.push(x, 0);
    queue.push(x, height - 1);
    visited[x] = 1;
    visited[(height - 1) * width + x] = 1;
  }
  for (let y = 0; y < height; y++) {
    queue.push(0, y);
    queue.push(width - 1, y);
    visited[y * width] = 1;
    visited[y * width + (width - 1)] = 1;
  }

  let head = 0;
  while (head < queue.length) {
    const cx = queue[head++];
    const cy = queue[head++];
    const cidx = cy * width + cx;

    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nidx = ny * width + nx;
        if (!visited[nidx]) {
          visited[nidx] = 1;
          // Can expand if classified as background or if close to border outside model zone
          if (isBg[nidx] || (nx < 80 || nx > width - 80 || ny < 250 || ny > 1520)) {
            isBg[nidx] = 1;
            queue.push(nx, ny);
          }
        }
      }
    }
  }

  // Apply alpha mask
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const pidx = y * width + x;
      if (isBg[pidx]) {
        data[idx + 3] = 0;
      }
    }
  }

  // Find tight bounding box of remaining non-transparent pixels
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      if (a > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log(`Bounding box: x=[${minX}, ${maxX}] y=[${minY}, ${maxY}]`);

  // Crop to bounding box
  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;

  await sharp(data, {
    raw: { width, height, channels: 4 }
  })
    .extract({
      left: minX,
      top: minY,
      width: cropWidth,
      height: cropHeight
    })
    .png({ compressionLevel: 9 })
    .toFile(outputFile);

  console.log(`Saved: ${outputFile} (${cropWidth}x${cropHeight})`);
}

async function run() {
  const models = [
    { in: 'public/assets/aistudio/Bad_Habit_midnight_blue_trousers-5_4217da07.png', out: 'public/assets/aistudio/model_midnight_blue.png' },
    { in: 'public/assets/aistudio/Essentials_Latte_against_blue_concrete-1_5dd8b573.png', out: 'public/assets/aistudio/model_latte.png' },
    { in: 'public/assets/aistudio/Bad_Habit_essentials_cream_trousers-7_c95787a6.png', out: 'public/assets/aistudio/model_cream.png' },
    { in: 'public/assets/aistudio/Ash_baggy_trousers_campaign_poster-5_9cf0b7e4.png', out: 'public/assets/aistudio/model_ash.png' },
    { in: 'public/assets/aistudio/Sage_trousers_on_blue_concrete-7_477eaae0.png', out: 'public/assets/aistudio/model_sage.png' },
    { in: 'public/assets/aistudio/Stone_Trousers_on_Blue_Concrete-5_f2f3ce3b.png', out: 'public/assets/aistudio/model_stone.png' },
  ];

  for (const m of models) {
    await extractModel(m.in, m.out);
  }
}

run().catch(console.error);
