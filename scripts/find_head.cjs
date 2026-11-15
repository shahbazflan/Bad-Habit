const sharp = require('sharp');

async function findHeadTop(file) {
  const { data, info } = await sharp('public/assets/aistudio/' + file).raw().toBuffer({ resolveWithObject: true });
  // Find where skin or hair starts around center x: 400-600
  let topY = -1;
  for (let y = 150; y < 500; y++) {
    for (let x = 400; x < 550; x++) {
      const idx = (y * info.width + x) * 3;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      // Hair or skin:
      // Hair: very dark (r < 50, g < 50, b < 50) AND NOT blue wall
      // Skin: warm (r > 120, r > b + 30)
      const isHair = (r < 50 && g < 50 && b < 50) && !(b > r + 20);
      const isSkin = (r > 120 && r > b + 25);
      if (isHair || isSkin) {
        topY = y;
        break;
      }
    }
    if (topY !== -1) break;
  }
  console.log(`${file}: Head top detected at y=${topY}`);
}

async function run() {
  await findHeadTop('Bad_Habit_midnight_blue_trousers-5_4217da07.png');
  await findHeadTop('Bad_Habit_essentials_cream_trousers-7_c95787a6.png');
  await findHeadTop('Essentials_Latte_against_blue_concrete-1_5dd8b573.png');
  await findHeadTop('Ash_baggy_trousers_campaign_poster-5_9cf0b7e4.png');
  await findHeadTop('Sage_trousers_on_blue_concrete-7_477eaae0.png');
  await findHeadTop('Stone_Trousers_on_Blue_Concrete-5_f2f3ce3b.png');
}
run();
