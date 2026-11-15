const sharp = require('sharp');
sharp('public/assets/aistudio/Bad_Habit_essentials_cream_trousers-7_c95787a6.png')
  .raw()
  .toBuffer({ resolveWithObject: true })
  .then(({ data, info }) => {
    for (let y = 350; y < 450; y += 30) {
      for (let x = 300; x < 650; x += 60) {
        const idx = (y * info.width + x) * 3;
        console.log(`x=${x}, y=${y}: R=${data[idx]}, G=${data[idx+1]}, B=${data[idx+2]}`);
      }
    }
  });
