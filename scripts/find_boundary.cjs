const sharp = require('sharp');

sharp('public/test_model_tight.png').raw().toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    for (let y = 350; y < 550; y += 10) {
      let shirt = 0, trousers = 0;
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
        if (a > 50) {
          if (b > r || (r < 70 && g < 70 && b < 100)) shirt++;
          else if (r > 120 && g > 90 && b > 60 && r > b + 20) trousers++;
        }
      }
      console.log('y=' + y + ': shirt=' + shirt + ', trousers=' + trousers);
    }
  });
