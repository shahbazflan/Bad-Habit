const sharp = require('sharp');

async function analyze(file) {
  const { data, info } = await sharp('public/assets/aistudio/' + file)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  console.log(`=== ${file} (${width}x${height}) ===`);

  // Sample wall at top-left
  const wall = [];
  for (let y = 100; y < 200; y += 20) {
    for (let x = 100; x < 200; x += 20) {
      const idx = (y * width + x) * 3;
      wall.push({ r: data[idx], g: data[idx+1], b: data[idx+2] });
    }
  }
  const avgWall = {
    r: Math.round(wall.reduce((a,c) => a + c.r, 0) / wall.length),
    g: Math.round(wall.reduce((a,c) => a + c.g, 0) / wall.length),
    b: Math.round(wall.reduce((a,c) => a + c.b, 0) / wall.length),
  };
  console.log('Avg Wall RGB:', avgWall, 'Sum:', avgWall.r + avgWall.g + avgWall.b);

  // Sample shirt at center
  const shirt = [];
  for (let y = 500; y < 650; y += 20) {
    for (let x = 450; x < 550; x += 20) {
      const idx = (y * width + x) * 3;
      shirt.push({ r: data[idx], g: data[idx+1], b: data[idx+2] });
    }
  }
  const avgShirt = {
    r: Math.round(shirt.reduce((a,c) => a + c.r, 0) / shirt.length),
    g: Math.round(shirt.reduce((a,c) => a + c.g, 0) / shirt.length),
    b: Math.round(shirt.reduce((a,c) => a + c.b, 0) / shirt.length),
  };
  console.log('Avg Shirt RGB:', avgShirt, 'Sum:', avgShirt.r + avgShirt.g + avgShirt.b);

  // Sample pants at center
  const pants = [];
  for (let y = 900; y < 1050; y += 20) {
    for (let x = 450; x < 550; x += 20) {
      const idx = (y * width + x) * 3;
      pants.push({ r: data[idx], g: data[idx+1], b: data[idx+2] });
    }
  }
  const avgPants = {
    r: Math.round(pants.reduce((a,c) => a + c.r, 0) / pants.length),
    g: Math.round(pants.reduce((a,c) => a + c.g, 0) / pants.length),
    b: Math.round(pants.reduce((a,c) => a + c.b, 0) / pants.length),
  };
  console.log('Avg Pants RGB:', avgPants, 'Sum:', avgPants.r + avgPants.g + avgPants.b);
}

async function run() {
  await analyze('Bad_Habit_midnight_blue_trousers-5_4217da07.png');
  await analyze('Bad_Habit_essentials_cream_trousers-7_c95787a6.png');
  await analyze('Essentials_Latte_against_blue_concrete-1_5dd8b573.png');
  await analyze('Ash_baggy_trousers_campaign_poster-5_9cf0b7e4.png');
  await analyze('Sage_trousers_on_blue_concrete-7_477eaae0.png');
  await analyze('Stone_Trousers_on_Blue_Concrete-5_f2f3ce3b.png');
}

run();
