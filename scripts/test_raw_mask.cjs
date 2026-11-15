const { AutoModel, AutoProcessor, RawImage } = require('@xenova/transformers');
const sharp = require('sharp');

async function testMask() {
  const model = await AutoModel.from_pretrained('Xenova/modnet');
  const processor = await AutoProcessor.from_pretrained('Xenova/modnet');
  const image = await RawImage.read('public/assets/aistudio/Bad_Habit_midnight_blue_trousers-5_4217da07.png');
  const { pixel_values } = await processor(image);

  const result = await model({ input: pixel_values });
  const t = result.output;
  console.log('Tensor dims:', t.dims); // [1, 1, 896, 512]

  const height = t.dims[2];
  const width = t.dims[3];

  const mask = new Uint8Array(width * height);
  for (let i = 0; i < t.data.length; i++) {
    mask[i] = Math.round(Math.min(255, Math.max(0, t.data[i] * 255)));
  }

  await sharp(mask, {
    raw: { width, height, channels: 1 }
  })
    .png()
    .toFile('/tmp/raw_modnet_mask.png');

  console.log('Saved raw mask!');
}
testMask().catch(console.error);
