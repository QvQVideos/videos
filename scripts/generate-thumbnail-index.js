const fs = require('fs');
const https = require('https');
const path = require('path');

const repo = 'QvQVideos/videos';
const branch = 'main';
const outputDir = path.resolve(__dirname, 'output');
const outputPath = path.join(outputDir, 'thumbnail_index.json');

function fetchTree() {
  return new Promise((resolve, reject) => {
    https.get(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`, {
      headers: { 'User-Agent': 'Node.js' }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.tree || []);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

(async () => {
  const tree = await fetchTree();
  const thumbs = tree.filter(item =>
    item.type === 'blob' &&
    item.path.startsWith('thumbnail/') &&
    /\.(png|jpe?g|gif|webp)$/i.test(item.path)
  );
  const list = thumbs.map(item => ({
    name: path.basename(item.path),
    path: item.path,
    url: `https://raw.githubusercontent.com/${repo}/${branch}/${item.path}`
  }));
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(list, null, 2));
  console.log(`✅ Wrote ${list.length} images to ${outputPath}`);
})();
