const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PRODUCTS = [
  { id: 'BH-001', image: 'public/assets/aistudio/MIDNIGHT_BLUE_4cd1903e.png' },
  { id: 'BH-002', image: 'public/assets/aistudio/Cream_1_4379b716.png' },
  { id: 'BH-003', image: 'public/assets/aistudio/MOCHA_ESSTENTIALS_7aedc5cb.png' },
  { id: 'BH-004', image: 'public/assets/aistudio/ESSENTIALS_LATTE_edbb57ae.png' },
  { id: 'BH-005', image: 'public/assets/aistudio/ESSENTIALS_MILK_FOAM_8c79548d.png' },
  { id: 'BH-006', image: 'public/assets/aistudio/CHARCOAL_BALOON_d257400c.png' },
  { id: 'BH-007', image: 'public/assets/aistudio/ASH_BAGGY_6f51ed9f.png' },
  { id: 'BH-008', image: 'public/assets/aistudio/IVORY_PANTS_ea96ae43.png' },
  { id: 'BH-009', image: 'public/assets/aistudio/Sage_garment_cutout__hanger_removed-13_d0789cff.png' },
  { id: 'BH-010', image: 'public/assets/aistudio/Stone_trousers_on_transparent_background-3_d017ddd4.png' },
];

async function trimProducts() {
  const dir = 'public/assets/aistudio/trimmed';
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  for (const p of PRODUCTS) {
    if (fs.existsSync(p.image)) {
      const out = path.join(dir, `${p.id}_trimmed.png`);
      await sharp(p.image)
        .trim()
        .png({ compressionLevel: 9 })
        .toFile(out);
      console.log(`Trimmed ${p.id} -> ${out}`);
    } else {
      console.log(`Missing file for ${p.id}: ${p.image}`);
    }
  }
}

trimProducts().catch(console.error);
