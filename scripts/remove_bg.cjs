const { AutoModel, AutoProcessor, RawImage } = require('@xenova/transformers');
const sharp = require('sharp');
const fs = require('fs');

let modelPromise = null;
let processorPromise = null;

async function getPipeline() {
  if (!modelPromise) {
    modelPromise = AutoModel.from_pretrained('briaai/RMBG-1.4');
    processorPromise = AutoProcessor.from_pretrained('briaai/RMBG-1.4');
  }
  return {
    model: await modelPromise,
    processor: await processorPromise
  };
}

async function removeBackground(inputPath, outputPath) {
  console.log(`Processing: ${inputPath}`);
  const { model, processor } = await getPipeline();

  const image = await RawImage.read(inputPath);
  const { pixel_values } = await processor(image);

  console.log('Running model inference...');
  const result = await model({ input: pixel_values });
  const t = result.output; // [1, 1, 1024, 1024]

  const maskData = new Uint8Array(1024 * 1024);
  for (let i = 0; i < t.data.length; i++) {
    const val = t.data[i];
    // RMBG-1.4: values close to 1 are foreground, close to 0 are background
    maskData[i] = Math.round(Math.min(255, Math.max(0, val * 255)));
  }

  // Resize mask to original image dimensions
  const resizedMaskBuffer = await sharp(maskData, {
    raw: {
      width: 1024,
      height: 1024,
      channels: 1
    }
  })
    .resize(image.width, image.height, { fit: 'fill' })
    .raw()
    .toBuffer();

  // Load original image as raw RGBA
  const { data: origRgba, info } = await sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Direct alpha replacement
  for (let i = 0; i < image.width * image.height; i++) {
    const alpha = resizedMaskBuffer[i];
    // Threshold background noise slightly
    origRgba[i * 4 + 3] = alpha > 15 ? alpha : 0;
  }

  // Save with trim to eliminate excess transparent space
  const cutout = await sharp(origRgba, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  })
    .trim()
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Successfully created: ${outputPath}`, cutout);
}

async function run() {
  await removeBackground(
    'public/assets/aistudio/Bad_Habit_midnight_blue_trousers-5_4217da07.png',
    'public/assets/aistudio/midnight_blue_model_isolated.png'
  );
}

run().catch(console.error);
