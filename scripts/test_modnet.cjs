const { AutoModel, AutoProcessor, RawImage } = require('@xenova/transformers');
const sharp = require('sharp');
const fs = require('fs');

async function testModnet() {
  console.log('Loading MODNet...');
  const model = await AutoModel.from_pretrained('Xenova/modnet');
  const processor = await AutoProcessor.from_pretrained('Xenova/modnet');

  const image = await RawImage.read('public/assets/aistudio/Bad_Habit_midnight_blue_trousers-5_4217da07.png');
  const { pixel_values } = await processor(image);

  console.log('Inference...');
  const result = await model({ input: pixel_values });
  const t = result.output;
  console.log('Output dims:', t.dims);

  const [_, channels, height, width] = t.dims;
  const maskData = new Uint8Array(width * height);
  for (let i = 0; i < t.data.length; i++) {
    maskData[i] = Math.round(Math.min(255, Math.max(0, t.data[i] * 255)));
  }

  const resizedMask = await sharp(maskData, {
    raw: { width, height, channels: 1 }
  })
    .resize(image.width, image.height, { fit: 'fill' })
    .raw()
    .toBuffer();

  const { data: origRgba, info } = await sharp('public/assets/aistudio/Bad_Habit_midnight_blue_trousers-5_4217da07.png')
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < info.width * info.height; i++) {
    const a = resizedMask[i];
    origRgba[i * 4 + 3] = a > 15 ? a : 0;
  }

  const cutout = await sharp(origRgba, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .trim()
    .png()
    .toFile('/tmp/modnet_cutout.png');

  console.log('Saved /tmp/modnet_cutout.png', cutout);
}

testModnet().catch(console.error);
