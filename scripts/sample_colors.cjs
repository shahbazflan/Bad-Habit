const sharp = require('sharp');

async function test(file) {
  const { data, info } = await sharp('public/assets/aistudio/' + file).raw().toBuffer({ resolveWithObject: true });
  console.log('--- ' + file + ' ---');
  const samples = [
    [50, 50], [850, 50], [50, 800], [850, 800], [50, 1400], [850, 1400],
    [470, 300], [470, 600], [470, 1000]
  ];
  for (const s of samples) {
    const x = s[0];
    const y = s[1];
    const idx = (y * info.width + x) * info.channels;
    const r = data[idx];
    const g = data[idx+1];
    const b = data[idx+2];
    console.log(`(${x}, ${y}): R=${r}, G=${g}, B=${b}`);
  }
}

async function run() {
  await test('Bad_Habit_midnight_blue_trousers-5_4217da07.png');
  await test('Bad_Habit_essentials_cream_trousers-7_c95787a6.png');
}
run();
