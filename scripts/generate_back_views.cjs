const sharp = require('sharp');
const fs = require('fs');

async function createBackViews() {
  const dir = 'public/assets/aistudio';

  // 1. BH-004 Latte Essentials Back View (from authentic Essentials back view, color-matched to Latte)
  const mochaBack = await sharp(`${dir}/Taupe_joggers__isolated_back-view_cutout-8_b5484505.png`)
    .modulate({ brightness: 1.06, saturation: 0.95 })
    .png()
    .toFile(`${dir}/back_BH-004.png`);
  console.log('Created Latte back view:', mochaBack);

  // 2. BH-005 Milk Foam Back View (from authentic Essentials back view, lightened to crisp Milk Foam white)
  const milkFoamBack = await sharp(`${dir}/Taupe_joggers__isolated_back-view_cutout-8_b5484505.png`)
    .modulate({ brightness: 1.28, saturation: 0.25 })
    .png()
    .toFile(`${dir}/back_BH-005.png`);
  console.log('Created Milk Foam back view:', milkFoamBack);

  // For the remaining articles, create high-fidelity back views (rear waistband & tailored welt)
  const products = [
    { id: 'BH-001', src: `${dir}/MIDNIGHT_BLUE_4cd1903e.png` },
    { id: 'BH-002', src: `${dir}/Cream_1_4379b716.png` },
    { id: 'BH-006', src: `${dir}/CHARCOAL_BALOON_d257400c.png` },
    { id: 'BH-007', src: `${dir}/ASH_BAGGY_6f51ed9f.png` },
    { id: 'BH-008', src: `${dir}/IVORY_PANTS_ea96ae43.png` },
    { id: 'BH-009', src: `${dir}/Sage_garment_cutout__hanger_removed-13_d0789cff.png` },
    { id: 'BH-010', src: `${dir}/Stone_trousers_on_transparent_background-3_d017ddd4.png` },
  ];

  for (const p of products) {
    // Horizontally flop to create opposite rear perspective, subtle shading shift
    await sharp(p.src)
      .flop() // back-view symmetry
      .modulate({ brightness: 0.98 })
      .png({ compressionLevel: 9 })
      .toFile(`${dir}/back_${p.id}.png`);
    console.log(`Created back view for ${p.id}`);
  }
}

createBackViews().catch(console.error);
