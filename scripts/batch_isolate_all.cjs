const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');
const fs = require('fs');

async function processOne(inputPath, outputPath) {
  console.log(`Starting background removal: ${inputPath}...`);
  const blob = await removeBackground(inputPath, {
    output: {
      format: 'image/png',
      quality: 0.95
    }
  });

  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Trim transparent borders so model is tight and perfectly centerable
  const result = await sharp(buffer)
    .trim()
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Saved: ${outputPath} (${result.width}x${result.height})`);
}

async function run() {
  const tasks = [
    { in: 'public/assets/aistudio/Bad_Habit_midnight_blue_trousers-5_4217da07.png', out: 'public/assets/aistudio/midnight_blue_model_isolated.png' },
    { in: 'public/assets/aistudio/Bad_Habit_essentials_cream_trousers-7_c95787a6.png', out: 'public/assets/aistudio/cream_model_isolated.png' },
    { in: 'public/assets/aistudio/Essentials_Latte_against_blue_concrete-1_5dd8b573.png', out: 'public/assets/aistudio/latte_model_isolated.png' },
    { in: 'public/assets/aistudio/Ash_baggy_trousers_campaign_poster-5_9cf0b7e4.png', out: 'public/assets/aistudio/ash_baggy_model_isolated.png' },
    { in: 'public/assets/aistudio/Sage_trousers_on_blue_concrete-7_477eaae0.png', out: 'public/assets/aistudio/sage_model_isolated.png' },
    { in: 'public/assets/aistudio/Stone_Trousers_on_Blue_Concrete-5_f2f3ce3b.png', out: 'public/assets/aistudio/stone_model_isolated.png' },
  ];

  for (const t of tasks) {
    try {
      await processOne(t.in, t.out);
    } catch (err) {
      console.error(`Error processing ${t.in}:`, err);
    }
  }
  console.log('All models processed successfully!');
}

run();
