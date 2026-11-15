const sharp = require('sharp');
const fs = require('fs');

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
];

async function measure() {
  for (const p of PRODUCTS) {
    const { data, info } = await sharp(p.file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    // Find tight bbox
    let minX = info.width, maxX = 0, minY = info.height, maxY = 0;
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        if (data[(y * info.width + x) * 4 + 3] > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    console.log(`${p.id}: tight bbox width=${w}, height=${h}, ratio=${(h/w).toFixed(2)}`);
  }
}
measure();
