const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function removeBgToBuffer(filePath) {
  const blob = await removeBackground(filePath, {
    output: { format: 'image/png', quality: 0.95 }
  });
  const ab = await blob.arrayBuffer();
  return Buffer.from(ab);
}

// Remove solid white background from garment photos
async function isolateWhiteBgGarment(inputPath, outputPath) {
  console.log(`Isolating white background garment: ${inputPath}...`);
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  
  // Flood-fill or threshold near-white background pixels (r > 245, g > 245, b > 245)
  // Or run background removal
  // Since background removal is robust and handles shadows/folds, let's use removeBackground:
  const buf = await removeBgToBuffer(inputPath);
  const result = await sharp(buf).trim().png({ compressionLevel: 9 }).toFile(outputPath);
  console.log(`Saved garment ${outputPath} (${result.width}x${result.height})`);
}

async function isolateModel(inputPath, outputPath) {
  console.log(`Isolating model: ${inputPath}...`);
  const buf = await removeBgToBuffer(inputPath);
  const result = await sharp(buf).trim().png({ compressionLevel: 9 }).toFile(outputPath);
  console.log(`Saved model ${outputPath} (${result.width}x${result.height})`);
}

async function run() {
  try {
    // 1. Midnight Blue model (from d542qv8b)
    await isolateModel(
      'downloaded_assets/midnight_blue_model.jpg',
      'public/assets/aistudio/midnight_blue_model_isolated.png'
    );

    // 2. Ivory model (from bspvswj9)
    await isolateModel(
      'downloaded_assets/ivory_model.jpg',
      'public/assets/aistudio/ivory_model_isolated.png'
    );

    // 3. Charcoal Balloon model (from e9qmq1ik)
    await isolateModel(
      'downloaded_assets/charcoal_balloon_model.jpg',
      'public/assets/aistudio/charcoal_balloon_model_isolated.png'
    );

    // 4. Charcoal Balloon back view (from 2u3rap6l)
    await isolateWhiteBgGarment(
      'downloaded_assets/charcoal_balloon_back.jpg',
      'public/assets/aistudio/back_BH-006.png'
    );

    // 5. Chocolate Balloon front view (from cz5twlkf)
    await isolateWhiteBgGarment(
      'downloaded_assets/chocolate_balloon_1.jpg',
      'public/assets/aistudio/CHOCOLATE_BALLOON.png'
    );

    // 6. Chocolate Balloon back view (from x52i2kop)
    await isolateWhiteBgGarment(
      'downloaded_assets/chocolate_balloon_2.jpg',
      'public/assets/aistudio/back_BH-011.png'
    );

    console.log('All 6 images processed successfully!');
  } catch (err) {
    console.error('Error in processing:', err);
    process.exit(1);
  }
}

run();
