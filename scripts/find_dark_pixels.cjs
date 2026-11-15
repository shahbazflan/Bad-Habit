const sharp = require('sharp');

sharp('public/assets/aistudio/mocha_model_isolated.png').raw().toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    console.log('Finding dark pixels in trousers zone:');
    for (let y = 780; y <= 950; y++) {
      for (let x = 0; x < info.width; x++) {
        const idx = (y * info.width + x) * 4;
        const r = data[idx], g = data[idx+1], b = data[idx+2], a = data[idx+3];
        // If it's not a shoe (shoes are at y >= 890 x < 180 or y >= 950 x >= 180)
        const isShoe = (x < 175 && y >= 895) || (x >= 180 && y >= 948);
        if (a > 100 && !isShoe && (r < 115 || g < 95 || b < 75)) {
          console.log(`Dark pixel at x=${x}, y=${y}: R=${r}, G=${g}, B=${b}`);
        }
      }
    }
  });
