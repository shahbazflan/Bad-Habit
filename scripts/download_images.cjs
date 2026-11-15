const https = require('https');
const fs = require('fs');
const path = require('path');

const targets = [
  { id: 'charcoal_balloon_back', page: 'https://imgshare.cc/2u3rap6l' },
  { id: 'charcoal_balloon_model', page: 'https://imgshare.cc/e9qmq1ik' },
  { id: 'midnight_blue_model', page: 'https://imgshare.cc/d542qv8b' },
  { id: 'ivory_model', page: 'https://imgshare.cc/bspvswj9' },
  { id: 'chocolate_balloon_1', page: 'https://imgshare.cc/cz5twlkf' },
  { id: 'chocolate_balloon_2', page: 'https://imgshare.cc/x52i2kop' },
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function downloadBinary(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      // Follow redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          redirectUrl = new URL(redirectUrl, url).href;
        }
        return downloadBinary(redirectUrl, destPath).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function main() {
  const downloadDir = path.join(__dirname, '../downloaded_assets');
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

  for (const t of targets) {
    try {
      console.log(`Fetching HTML for ${t.id} from ${t.page}...`);
      const html = await fetchText(t.page);

      // Find image URL in HTML
      // Look for og:image or <img class="..." src="..." or direct image
      let imgUrl = null;
      const ogMatch = html.match(/<meta property=["']og:image["'] content=["']([^"']+)["']/i);
      if (ogMatch) {
        imgUrl = ogMatch[1];
      } else {
        const imgMatch = html.match(/src=["']([^"']+\.(?:png|jpe?g|webp))["']/i);
        if (imgMatch) imgUrl = imgMatch[1];
      }

      if (!imgUrl) {
        console.warn(`Could not find image link in HTML for ${t.id}. Saving HTML for inspection.`);
        fs.writeFileSync(path.join(downloadDir, `${t.id}.html`), html);
        continue;
      }

      console.log(`Found image for ${t.id}: ${imgUrl}`);
      const ext = path.extname(new URL(imgUrl).pathname) || '.jpg';
      const dest = path.join(downloadDir, `${t.id}${ext}`);
      await downloadBinary(imgUrl, dest);
      console.log(`Downloaded ${t.id} -> ${dest} (${fs.statSync(dest).size} bytes)`);
    } catch (err) {
      console.error(`Failed ${t.id}:`, err.message);
    }
  }
}

main().catch(console.error);
