const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function getProjectMedias(folderId) {
  const folderUrl = `https://hasssann-ahmedd.wistia.com/folders/${folderId}`;
  const getRes = await fetch(folderUrl);
  const setCookies = getRes.headers.getSetCookie ? getRes.headers.getSetCookie() : [];
  const cookiePairs = setCookies.map(c => c.split(';')[0]).join('; ');
  const html = await getRes.text();
  const tokenMatch = html.match(/window\._auth_token\s*=\s*['"]([^'"]+)['"]/);
  const authToken = tokenMatch ? tokenMatch[1] : '';

  const q = `query {
    anonymousProject(hashedId: "${folderId}") {
      id
      name
      medias {
        nodes {
          id
          hashedId
          name
          thumbnailUrl
        }
      }
    }
  }`;

  const res = await fetch("https://hasssann-ahmedd.wistia.com/graphql?op=AnonymousProject", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-TOKEN": authToken,
      "X-WISTIA-GQL-SCHEMA": "AnonymousSchema",
      "Cookie": cookiePairs
    },
    body: JSON.stringify({ query: q })
  });

  const d = await res.json();
  return d.data.anonymousProject.medias.nodes;
}

async function downloadAndProcess() {
  const trousersDir = path.resolve(__dirname, '../public/assets/trousers_v2');
  const hoodiesDir = path.resolve(__dirname, '../public/assets/hoodies');

  fs.mkdirSync(trousersDir, { recursive: true });
  fs.mkdirSync(hoodiesDir, { recursive: true });

  console.log("=== FETCHING TROUSERS FOLDER bb8tqqfbpe ===");
  const trouserNodes = await getProjectMedias('bb8tqqfbpe');
  console.log(`Found ${trouserNodes.length} trouser nodes.`);

  const trouserList = [];
  for (const node of trouserNodes) {
    const hashMatch = node.thumbnailUrl?.match(/deliveries\/([a-f0-9]+)/);
    if (!hashMatch) {
      console.warn("No hash for node:", node.name);
      continue;
    }
    const hash = hashMatch[1];
    const binUrl = `https://embed-ssl.wistia.com/deliveries/${hash}.bin`;
    const safeName = node.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
    const destPath = path.join(trousersDir, `${safeName}_${hash.slice(0, 8)}.png`);

    console.log(`Downloading: ${node.name} (${hash.slice(0, 8)})...`);
    const res = await fetch(binUrl);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buf);

    const meta = await sharp(destPath).metadata();
    trouserList.push({
      name: node.name,
      hash,
      safeName,
      file: `/assets/trousers_v2/${path.basename(destPath)}`,
      width: meta.width,
      height: meta.height,
      hasAlpha: meta.hasAlpha,
      channels: meta.channels
    });
  }
  fs.writeFileSync(path.join(trousersDir, 'manifest.json'), JSON.stringify(trouserList, null, 2));

  console.log("\n=== FETCHING HOODIES FOLDER 2zkm2572il ===");
  const hoodieNodes = await getProjectMedias('2zkm2572il');
  console.log(`Found ${hoodieNodes.length} hoodie nodes.`);

  const hoodieList = [];
  for (const node of hoodieNodes) {
    const hashMatch = node.thumbnailUrl?.match(/deliveries\/([a-f0-9]+)/);
    if (!hashMatch) {
      console.warn("No hash for node:", node.name);
      continue;
    }
    const hash = hashMatch[1];
    const binUrl = `https://embed-ssl.wistia.com/deliveries/${hash}.bin`;
    const safeName = node.name.replace(/[^a-zA-Z0-9_\-\.]/g, '_').toLowerCase();
    const destPath = path.join(hoodiesDir, `${safeName}_${hash.slice(0, 8)}.png`);

    console.log(`Downloading: ${node.name} (${hash.slice(0, 8)})...`);
    const res = await fetch(binUrl);
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(destPath, buf);

    const meta = await sharp(destPath).metadata();
    hoodieList.push({
      name: node.name,
      hash,
      safeName,
      file: `/assets/hoodies/${path.basename(destPath)}`,
      width: meta.width,
      height: meta.height,
      hasAlpha: meta.hasAlpha,
      channels: meta.channels
    });
  }
  fs.writeFileSync(path.join(hoodiesDir, 'manifest.json'), JSON.stringify(hoodieList, null, 2));

  console.log("\n=== ALL FILES DOWNLOADED SUCCESSFULLY! ===");
}

downloadAndProcess().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
