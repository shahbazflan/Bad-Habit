const sharp = require('sharp');

sharp('public/test_model_tight.png').raw().toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    console.log('Pixels at right ankle fold:');
    for (let y = 880; y <= 910; y += 5) {
      for (let x = 250; x <= 285; x += 10) {
        const idx = (y * info.width + x) * 4;
        console.log(`x=${x}, y=${y}: R=${data[idx]}, G=${data[idx+1]}, B=${data[idx+2]}, A=${data[idx+3]}`);
      }
    }
  });
