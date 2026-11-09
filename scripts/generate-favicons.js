const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1220"/>
      <stop offset="100%" stop-color="#030712"/>
    </linearGradient>
    <linearGradient id="primary" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f279"/>
      <stop offset="60%" stop-color="#10b981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#d1fae5"/>
    </linearGradient>
    <linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#059669" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#00f279" stop-opacity="0.7"/>
    </linearGradient>
  </defs>

  <!-- Squircle container -->
  <rect x="20" y="20" width="472" height="472" rx="112" fill="url(#bg)"/>
  <rect x="20" y="20" width="472" height="472" rx="112" fill="none" stroke="url(#rim)" stroke-width="12"/>

  <!-- High-Speed "R" Monogram Silhouette -->
  <rect x="130" y="116" width="68" height="280" rx="34" fill="url(#primary)"/>

  <!-- Top loop of R -->
  <path d="M 170 116 L 286 116 C 360 116 404 154 404 218 C 404 280 358 316 286 316 L 170 316 Z" 
        fill="none" 
        stroke="url(#primary)" 
        stroke-width="64" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>

  <!-- Forward-thrust leg / Arrow -->
  <path d="M 264 286 L 368 396" 
        fill="none" 
        stroke="url(#primary)" 
        stroke-width="64" 
        stroke-linecap="round"/>

  <!-- Inner Speed Accent Stripe -->
  <rect x="148" y="140" width="18" height="232" rx="9" fill="url(#accent)" opacity="0.9"/>

  <!-- GPS / Speed Dot at upper right -->
  <circle cx="390" cy="116" r="28" fill="#00f279"/>
  <circle cx="390" cy="116" r="14" fill="#ffffff"/>
</svg>`;

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  const iconsDir = path.join(publicDir, 'icons');
  const appDir = path.join(__dirname, '..', 'src', 'app');

  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

  // Save SVGs
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
    console.log(`Generated ${item.name}`);
  }

  // Create valid .ico file format with 16x16, 32x32, 48x48 PNG frames
  const png16 = await sharp(buffer).resize(16, 16).png().toBuffer();
  const png32 = await sharp(buffer).resize(32, 32).png().toBuffer();
  const png48 = await sharp(buffer).resize(48, 48).png().toBuffer();

  const icoBuffer = createIco([
    { size: 16, buffer: png16 },
    { size: 32, buffer: png32 },
    { size: 48, buffer: png48 },
  ]);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);
  console.log('Generated favicon.ico in public/ and src/app/');
}

function createIco(images) {
  // ICO header: 6 bytes
  // 0-1: Reserved (0)
  // 2-3: Image type (1 = icon)
  // 4-5: Number of images
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  // Each directory entry is 16 bytes
  const dirSize = 16 * images.length;
  let offset = 6 + dirSize;

  const dirEntries = [];
  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // width
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // height
    entry.writeUInt8(0, 2); // color palette (0 = none)
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.buffer.length, 8); // image data size
    entry.writeUInt32LE(offset, 12); // image data offset
    dirEntries.push(entry);
    offset += img.buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...images.map(img => img.buffer)]);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
