const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Create assets directory if it doesn't exist
if (!fs.existsSync('./assets')) {
  fs.mkdirSync('./assets');
}

function createIcon(size, filename) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // White background
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, size, size);
  
  // Black circle
  ctx.strokeStyle = 'black';
  ctx.lineWidth = size * 0.02;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size * 0.4, 0, Math.PI * 2);
  ctx.stroke();
  
  // Letter Z
  ctx.fillStyle = 'black';
  ctx.font = `${size * 0.4}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Z', size/2, size/2);
  
  // Save as PNG
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join('./assets', filename), buffer);
  console.log(`Created ${filename} (${size}x${size})`);
}

// Create different sizes
createIcon(1024, 'icon.png');
createIcon(1024, 'splash.png');
createIcon(512, 'adaptive-icon.png');
createIcon(64, 'favicon.png');

console.log('All icons created successfully!');