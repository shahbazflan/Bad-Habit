const sharp = require('sharp');

sharp('public/assets/aistudio/MOCHA_ESSTENTIALS_7aedc5cb.png')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i + 3] > 150) {
        rSum += data[i];
        gSum += data[i + 1];
        bSum += data[i + 2];
        count++;
      }
    }
    console.log('Left article average RGB:', {
      r: Math.round(rSum / count),
      g: Math.round(gSum / count),
      b: Math.round(bSum / count),
    });
  });
