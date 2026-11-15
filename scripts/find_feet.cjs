const sharp = require('sharp');

async function findFeetBottom(file) {
  const { data, info } = await sharp('public/assets/aistudio/' + file).raw().toBuffer({ resolveWithObject: true });
  let bottomY = -1;
  for (let y = 1500; y > 1200; y--) {
    for (let x = 200; x < 750; x++) {
      const idx = (y * info.width + x) * 3;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      // Dark shoe leather (r < 90, g < 60, b < 60) AND NOT blue floor
      const isShoe = (r < 90 && g < 70 && b < 70) && (r > b - 5);
      if (isShoe) {
        bottomY = y;
        break;
      }
    }
    if (bottomY !== -1) break;
  }
  console.log(`${file}: Feet bottom detected at y=${bottomY}`);
}

async function run() {
  await findFeetBottom('Bad_Habit_midnight_blue_trousers-5_4217da07.png');
  await findFeetBottom('Bad_Habit_essentials_cream_trousers-7_c95787a6.png');
  await findFeetBottom('Essentials_Latte_against_blue_concrete-1_5dd8b573.png');
  await findFeetBottom('Ash_baggy_trousers_campaign_poster-5_9cf0b7e4.png');
  await findFeetBottom('Sage_trousers_on_blue_concrete-7_477eaae0.png');
  await findFeetBottom('Stone_Trousers_on_Blue_Concrete-5_f2f3ce3b.png');
}
run();
