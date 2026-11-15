const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function isolateAndTrim(inputPath, outputPath) {
  console.log(`Processing ${inputPath} -> ${outputPath}...`);
  const blob = await removeBackground(inputPath, {
    output: {
      format: 'image/png',
      quality: 0.95
    }
  });

  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const result = await sharp(buffer)
    .trim()
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Success: ${outputPath} (${result.width}x${result.height})`);
}

async function run() {
  try {
    // 1. Ivory model (Image 1)
    await isolateAndTrim(
      'public/assets/aistudio/Bad_Habit_Ivory_Trousers-5_e0ed89e8.png',
      'public/assets/aistudio/ivory_model_isolated.png'
    );

    // 2. Essentials White / Cream model (Image 4)
    await isolateAndTrim(
      'public/assets/aistudio/Bad_Habit_Essentials_Cream_poster-8_aff17365.png',
      'public/assets/aistudio/essentials_white_model_isolated.png'
    );

    // 3. Ash Baggy model (Image 3)
    await isolateAndTrim(
      'public/assets/aistudio/Bad_Habit_Ash_Trousers_Poster-6_64fbe282.png',
      'public/assets/aistudio/ash_baggy_model_isolated.png'
    );

    console.log('All requested model images successfully isolated and saved!');
  } catch (err) {
    console.error('Error during model isolation:', err);
    process.exit(1);
  }
}

run();
