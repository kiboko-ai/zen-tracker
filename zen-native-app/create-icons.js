const fs = require('fs');
const path = require('path');

// Create a simple SVG icon
const svgIcon = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="white"/>
  <circle cx="512" cy="512" r="400" fill="none" stroke="black" stroke-width="20"/>
  <text x="512" y="580" font-family="Arial" font-size="400" text-anchor="middle" fill="black">Z</text>
</svg>`;

// Create assets directory if it doesn't exist
if (!fs.existsSync('./assets')) {
  fs.mkdirSync('./assets');
}

// Save SVG as placeholder for all required images
const svgBuffer = Buffer.from(svgIcon);

// Create a simple PNG header (this is a minimal 1x1 PNG)
const pngData = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, // IHDR chunk size
  0x49, 0x48, 0x44, 0x52, // IHDR
  0x00, 0x00, 0x00, 0x01, // width: 1
  0x00, 0x00, 0x00, 0x01, // height: 1
  0x08, 0x02, // bit depth: 8, color type: 2 (RGB)
  0x00, 0x00, 0x00, // compression, filter, interlace
  0x90, 0x77, 0x53, 0xDE, // CRC
  0x00, 0x00, 0x00, 0x0C, // IDAT chunk size
  0x49, 0x44, 0x41, 0x54, // IDAT
  0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // compressed data
  0x49, 0xB4, 0xE8, 0xB7, // CRC
  0x00, 0x00, 0x00, 0x00, // IEND chunk size
  0x49, 0x45, 0x4E, 0x44, // IEND
  0xAE, 0x42, 0x60, 0x82  // CRC
]);

// Create all required image files
const files = ['icon.png', 'splash.png', 'adaptive-icon.png', 'favicon.png'];

files.forEach(filename => {
  const filepath = path.join('./assets', filename);
  fs.writeFileSync(filepath, pngData);
  console.log(`Created ${filepath}`);
});

console.log('All icon files created successfully!');