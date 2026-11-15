const sharp = require('sharp');

async function cleanLedge() {
  const { data, info } = await sharp('public/assets/aistudio/cream_model_isolated.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let y = 550; y < 635; y++) {
    for (let x = 290; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      data[idx + 3] = 0;
    }
  }

  await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .trim()
    .png({ compressionLevel: 9 })
    .toFile('public/assets/aistudio/cream_model_isolated.png');

  console.log('Cleaned cream model!');
}

cleanLedge();
