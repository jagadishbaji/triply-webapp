const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Ultra-clean, minimal corporate R favicon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <circle cx="64" cy="64" r="58" fill="#0b1329"/>
  <circle cx="64" cy="64" r="57" fill="none" stroke="#10b981" stroke-width="5"/>
  <text x="64" y="90" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" font-size="78" font-weight="900" fill="#10b981" text-anchor="middle">R</text>
</svg>`;

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  const iconsDir = path.join(publicDir, 'icons');
  const appDir = path.join(__dirname, '..', 'src', 'app');

  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  fs.writeFileSync(path.join(publicDir, 'ridevo-icon.svg'), svgContent);
  fs.writeFileSync(path.join(appDir, 'icon.svg'), svgContent);
  fs.writeFileSync(path.join(appDir, 'apple-icon.svg'), svgContent);

  const buffer = Buffer.from(svgContent);

  const sizes = [
    { name: 'icon-32x32.png', size: 32, dir: iconsDir },
    { name: 'icon-72x72.png', size: 72, dir: iconsDir },
    { name: 'icon-96x96.png', size: 96, dir: iconsDir },
    { name: 'icon-128x128.png', size: 128, dir: iconsDir },
    { name: 'icon-144x144.png', size: 144, dir: iconsDir },
    { name: 'icon-152x152.png', size: 152, dir: iconsDir },
    { name: 'icon-192x192.png', size: 192, dir: iconsDir },
    { name: 'icon-384x384.png', size: 384, dir: iconsDir },
    { name: 'icon-512x512.png', size: 512, dir: iconsDir },
    { name: 'apple-touch-icon.png', size: 180, dir: iconsDir },
    { name: 'icon-32.png', size: 32, dir: publicDir },
    { name: 'icon-16.png', size: 16, dir: publicDir },
  ];

  for (const item of sizes) {
    await sharp(buffer)
      .resize(item.size, item.size)
      .png()
      .toFile(path.join(item.dir, item.name));
  }

  const png16 = await sharp(buffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(buffer).resize(32, 32).png().toBuffer();
  const png48 = await sharp(buffer).resize(48, 48).png().toBuffer();

  const icoBuffer = createIco([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
    { size: 48, buffer: png48 },
  ]);

  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log('Clean minimalist favicon.ico and icons generated successfully.');
}

function createIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const dirSize = 16 * images.length;
  let offset = 6 + dirSize;

  const dirEntries = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.buffer.length, 8);
    entry.writeUInt32LE(offset, 12);
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...images.map(img => img.buffer)]);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
