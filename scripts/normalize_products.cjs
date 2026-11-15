const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PRODUCTS = [
  { id: 'BH-001', file: 'public/assets/aistudio/MIDNIGHT_BLUE_4cd1903e.png' },
  { id: 'BH-002', file: 'public/assets/aistudio/Cream_1_4379b716.png' },
  { id: 'BH-003', file: 'public/assets/aistudio/MOCHA_ESSTENTIALS_7aedc5cb.png' },
  { id: 'BH-004', file: 'public/assets/aistudio/ESSENTIALS_LATTE_edbb57ae.png' },
  { id: 'BH-005', file: 'public/assets/aistudio/ESSENTIALS_MILK_FOAM_8c79548d.png' },
  { id: 'BH-006', file: 'public/assets/aistudio/CHARCOAL_BALOON_d257400c.png' },
  { id: 'BH-007', file: 'public/assets/aistudio/ASH_BAGGY_6f51ed9f.png' },
  { id: 'BH-008', file: 'public/assets/aistudio/IVORY_PANTS_ea96ae43.png' },
  { id: 'BH-009', file: 'public/assets/aistudio/Sage_garment_cutout__hanger_removed-13_d0789cff.png' },
  { id: 'BH-010', file: 'public/assets/aistudio/Stone_trousers_on_transparent_background-3_d017ddd4.png' },
  { id: 'BH-011', file: 'public/assets/aistudio/CHOCOLATE_BALLOON.png' },
];

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1400;
const TARGET_GARMENT_HEIGHT = 1250;
const TOP_OFFSET = 50;

async function normalizeAll() {
  const outDir = 'public/assets/aistudio/normalized';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const p of PRODUCTS) {
    // 1. Trim the source image tightly first
    const trimmedBuffer = await sharp(p.file).trim().png().toBuffer();
    const meta = await sharp(trimmedBuffer).metadata();

    // 2. Resize to exact target garment height preserving aspect ratio
    const scaledWidth = Math.round(meta.width * (TARGET_GARMENT_HEIGHT / meta.height));
    const resizedBuffer = await sharp(trimmedBuffer)
      .resize(scaledWidth, TARGET_GARMENT_HEIGHT, { fit: 'fill' })
      .png()
      .toBuffer();

    // 3. Composite onto standardized 1000x1400 transparent canvas
    const leftOffset = Math.round((CANVAS_WIDTH - scaledWidth) / 2);

    const finalImage = await sharp({
      create: {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{
        input: resizedBuffer,
        left: leftOffset,
        top: TOP_OFFSET
      }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(outDir, `${p.id}_normalized.png`));

    console.log(`Created normalized ${p.id}: width=${scaledWidth}, left=${leftOffset}`);
  }
  console.log('All products successfully normalized to identical dimensions and formation!');
}

normalizeAll().catch(console.error);
