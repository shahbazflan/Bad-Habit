const { AutoModel, AutoProcessor, env, RawImage } = require('@xenova/transformers');
const sharp = require('sharp');
const fs = require('fs');

async function testRMBG() {
  console.log('Loading RMBG-1.4 model...');
  const model = await AutoModel.from_pretrained('briaai/RMBG-1.4', {
    // quantized: false
  });
  console.log('Model loaded! Loading processor...');
  const processor = await AutoProcessor.from_pretrained('briaai/RMBG-1.4');
  console.log('Processor loaded successfully!');
}

testRMBG().catch(err => {
  console.error('Error:', err);
});
