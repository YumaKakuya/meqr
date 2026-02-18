// scripts/generate-icons.js
// 実行: node scripts/generate-icons.js
// 必要: npm install sharp

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [192, 512];
const inputSvg = path.join(__dirname, '../icons/icon-512.svg');
const outputDir = path.join(__dirname, '../icons');

(async () => {
  for (const size of sizes) {
    await sharp(inputSvg)
      .resize(size, size)
      .flatten({ background: { r: 30, g: 41, b: 59 } }) // #1e293b（透過なし）
      .png()
      .toFile(path.join(outputDir, `icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
})();
