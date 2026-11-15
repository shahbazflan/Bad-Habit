const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');
const fs = require('fs');

async function testImgly() {
  console.log('Running imgly background removal on Midnight Blue...');
  const inputPath = 'public/assets/aistudio/Bad_Habit_midnight_blue_trousers-5_4217da07.png';
  const blob = await removeBackground(inputPath, {
    output: {
      format: 'image/png',
      quality: 0.95
    }
  });

  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Trim transparent borders
  const trimmedBuffer = await sharp(buffer)
    .trim()
    .png({ compressionLevel: 9 })
    .toFile('public/assets/aistudio/test_midnight_isolated.png');

  console.log('Finished!', trimmedBuffer);
}

testImgly().catch(console.error);
