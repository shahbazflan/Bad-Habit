const sharp = require('sharp');
const fs = require('fs');

async function createTile(inputJpg, outputPng, labelText, cropOptions = {}) {
  const WIDTH = 521;
  const HEIGHT = 321;

  // 1. Resize and crop the photographic background to 521x321
  const resizedPhoto = await sharp(inputJpg)
    .resize(WIDTH, HEIGHT, {
      fit: 'cover',
      position: cropOptions.position || 'entropy'
    })
    .toBuffer();

  // 2. Generate SVG overlay with:
  // - Gentle dark bottom gradient for high contrast readability
  // - Category Label in bold tracking uppercase font
  // - Clean circular right arrow button matching BAD HABIT signature category tiles
  const svgOverlay = `
    <svg width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bottomShadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#000000" stop-opacity="0" />
          <stop offset="40%" stop-color="#000000" stop-opacity="0.1" />
          <stop offset="75%" stop-color="#000000" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.75" />
        </linearGradient>
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.6"/>
        </filter>
      </defs>

      <!-- Bottom contrast gradient -->
      <rect y="${HEIGHT - 120}" width="${WIDTH}" height="120" fill="url(#bottomShadow)" />

      <!-- Category Title (Letter-spaced uppercase sans-serif) -->
      <text 
        x="32" 
        y="272" 
        font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" 
        font-size="21" 
        font-weight="700" 
        letter-spacing="4px" 
        fill="#FFFFFF" 
        filter="url(#softGlow)"
      >${labelText}</text>

      <!-- Signature Circular Arrow Indicator Button -->
      <g transform="translate(440, 235)" filter="url(#softGlow)">
        <circle cx="25" cy="25" r="23" fill="rgba(20, 20, 25, 0.4)" stroke="rgba(255, 255, 255, 0.85)" stroke-width="1.8" />
        <path d="M20 25H30.5M26.5 20.5L31.5 25L26.5 29.5" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </g>
    </svg>
  `;

  await sharp(resizedPhoto)
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
      }
    ])
    .png({ quality: 95 })
    .toFile(outputPng);

  console.log(`Saved tile: ${outputPng}`);
}

async function main() {
  await createTile(
    'src/assets/images/white_shirt_editorial_1793591693054.jpg',
    'public/assets/aistudio/category_tile_shirts.png',
    'SHIRTS',
    { position: 'center' }
  );

  await createTile(
    'src/assets/images/brown_streetwear_editorial_1793591692998.jpg',
    'public/assets/aistudio/category_tile_streetwear.png',
    'STREETWEAR',
    { position: 'center' }
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
