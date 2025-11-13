# PWA Icon Generation Guide

To generate PWA icons for your app, you need to create icons in the following sizes:

## Required Icon Sizes:
- 72x72px
- 96x96px
- 128x128px
- 144x144px
- 152x152px
- 192x192px (Required)
- 384x384px
- 512x512px (Required)

## Steps to Generate Icons:

### Option 1: Using Online Tools
1. Go to https://www.pwabuilder.com/imageGenerator or https://realfavicongenerator.net/
2. Upload your logo (logo1.png or logo.png from the public folder)
3. Generate all required sizes
4. Download and place them in the `public` folder with these names:
   - icon-72x72.png
   - icon-96x96.png
   - icon-128x128.png
   - icon-144x144.png
   - icon-152x152.png
   - icon-192x192.png
   - icon-384x384.png
   - icon-512x512.png

### Option 2: Using ImageMagick (Command Line)
If you have ImageMagick installed:
```bash
# Navigate to public folder
cd public

# Generate all sizes from logo1.png
magick logo1.png -resize 72x72 icon-72x72.png
magick logo1.png -resize 96x96 icon-96x96.png
magick logo1.png -resize 128x128 icon-128x128.png
magick logo1.png -resize 144x144 icon-144x144.png
magick logo1.png -resize 152x152 icon-152x152.png
magick logo1.png -resize 192x192 icon-192x192.png
magick logo1.png -resize 384x384 icon-384x384.png
magick logo1.png -resize 512x512 icon-512x512.png
```

### Option 3: Using Sharp (Node.js)
Create a script to generate icons programmatically.

## Important Notes:
- Icons should be square (1:1 aspect ratio)
- Use PNG format with transparency if needed
- Icons should look good at all sizes
- The 192x192 and 512x512 sizes are mandatory for PWA

