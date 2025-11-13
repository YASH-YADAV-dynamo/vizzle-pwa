// Script to generate PWA icons from logo.png
// Run with: node scripts/generate-icons.js

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = path.join(__dirname, '../public/logo.png');
const outputDir = path.join(__dirname, '../public');

// Check if logo.png exists, otherwise try logo1.png as fallback
let sourceFile = inputFile;
if (!fs.existsSync(sourceFile)) {
  sourceFile = path.join(__dirname, '../public/logo1.png');
  if (!fs.existsSync(sourceFile)) {
    console.error('Error: Neither logo.png nor logo1.png found in public folder');
    process.exit(1);
  }
}

console.log(`Generating icons from: ${path.basename(sourceFile)}`);

async function generateIcons() {
  try {
    for (const size of sizes) {
      const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);
      await sharp(sourceFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputFile);
      console.log(`✓ Generated icon-${size}x${size}.png`);
    }
    console.log('\n✅ All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();

