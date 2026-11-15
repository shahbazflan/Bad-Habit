const sharp = require('sharp');

sharp('public/test_model_tight.png')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let y = 520; y < 850; y++) {
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
        if (a > 150 && r > 110 && g > 85 && b > 55 && r > b + 20) {
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
      }
    }
    console.log('Model trouser average RGB:', {
      r: Math.round(rSum / count),
      g: Math.round(gSum / count),
      b: Math.round(bSum / count),
    });
  });
