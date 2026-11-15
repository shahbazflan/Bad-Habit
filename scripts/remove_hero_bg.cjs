const { removeBackground } = require('@imgly/background-removal-node');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function run() {
  const inputPath = path.resolve('public/assets/aistudio/AFFA091F-1653-4729-A3D3-76DD21B6860E_d4435e39.PNG');
  const outputPath = path.resolve('public/assets/aistudio/hero_mobile_model_cutout.png');
  
  console.log('Starting background removal for mobile hero model photograph...');
  console.log('Input:', inputPath);

  const blob = await removeBackground(inputPath, {
    output: {
      format: 'image/png',
      quality: 1.0,
    },
  });

  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Read metadata of isolated buffer
  const meta = await sharp(buffer).metadata();
  console.log(`Raw cutout dimensions: ${meta.width}x${meta.height}, channels: ${meta.channels}, hasAlpha: ${meta.hasAlpha}`);

  // Save trimmed version
  const trimmed = await sharp(buffer)
    .trim({ threshold: 5 })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log('Saved trimmed cutout to:', outputPath);
  console.log(`Trimmed size: ${trimmed.width}x${trimmed.height}`);
}

run().catch((err) => {
  console.error('Error during background removal:', err);
  process.exit(1);
});
