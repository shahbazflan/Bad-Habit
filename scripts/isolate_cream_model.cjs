const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');
const fs = require('fs');

async function processCreamModel() {
  const inputPath = 'public/assets/aistudio/Gritty_Skyline_Passage_Portrait_b5002721.jpg';
  const outputPath = 'public/assets/aistudio/cream_model_isolated.png';

  console.log(`Removing background from ${inputPath}...`);
  const blob = await removeBackground(inputPath, {
    output: {
      format: 'image/png',
      quality: 0.95
    }
  });

  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Trim transparent borders so model is tight and centerable
  const result = await sharp(buffer)
    .trim()
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Saved clean cream model to ${outputPath} (${result.width}x${result.height})`);
}

processCreamModel().catch(console.error);
