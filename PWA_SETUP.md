# PWA Setup Guide for Vizzle

Your app is now configured as a Progressive Web App (PWA) that can be installed on mobile devices and published to the Play Store.

## ✅ What's Been Configured

1. **PWA Package**: `next-pwa` installed and configured
2. **Manifest File**: `public/manifest.json` with app metadata
3. **Service Worker**: Automatic service worker generation for offline support
4. **Install Prompt**: Component to prompt users to install the app
5. **Meta Tags**: Proper PWA meta tags in the layout
6. **Caching Strategy**: Configured caching for API calls and images

## 📱 Required Steps Before Publishing

### 1. Generate PWA Icons

**Automated Method (Recommended):**

Simply run this npm command to automatically generate all required icon sizes from your logo:

```bash
npm run generate-icons
```

Or use the full setup command:

```bash
npm run pwa:setup
```

This will automatically:
- Look for `logo.png` in the `public/` folder (falls back to `logo1.png` if not found)
- Generate all required icon sizes (72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512)
- Save them in the `public/` folder with proper naming

**Note:** Make sure you have `logo.png` (or `logo1.png` as fallback) in your `public/` folder before running the command. The app logo used for PWA installation will be generated from `logo.png`.

**Alternative Methods (if automated doesn't work):**

#### Method A: Using Online Tool
1. Go to https://www.pwabuilder.com/imageGenerator
2. Upload your `logo.png` from the `public` folder
3. Generate all sizes
4. Download and place in `public/` folder with these exact names:
   - `icon-72x72.png`
   - `icon-96x96.png`
   - `icon-128x128.png`
   - `icon-144x144.png`
   - `icon-152x152.png`
   - `icon-192x192.png` ⚠️ **Required**
   - `icon-384x384.png`
   - `icon-512x512.png` ⚠️ **Required**

#### Method B: Using ImageMagick
```bash
cd public
magick logo1.png -resize 72x72 icon-72x72.png
magick logo1.png -resize 96x96 icon-96x96.png
# ... repeat for all sizes
```

### 2. Build the App

```bash
npm run build
```

This will generate:
- Service worker files in `public/` folder
- Optimized production build

### 3. Test PWA Installation

1. **On Android Chrome**:
   - Open your deployed app
   - Look for "Add to Home Screen" prompt
   - Or go to menu → "Install app"

2. **On iOS Safari**:
   - Open your app
   - Tap Share button
   - Select "Add to Home Screen"

3. **Test Offline Mode**:
   - Install the app
   - Turn on airplane mode
   - Open the app - it should still work for cached pages

### 4. Publish to Play Store

#### Option A: Using TWA (Trusted Web Activity)
1. Create an Android app wrapper using [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap)
2. Or use [PWABuilder](https://www.pwabuilder.com/) to generate Android package

#### Option B: Using PWABuilder (Recommended)
1. Go to https://www.pwabuilder.com/
2. Enter your app URL
3. Click "Build My PWA"
4. Select "Android" → "Generate Package"
5. Download the `.aab` file
6. Upload to Google Play Console

#### Steps in Play Console:
1. Create a new app in Google Play Console
2. Fill in app details (name, description, screenshots)
3. Upload the `.aab` file from PWABuilder
4. Complete store listing
5. Submit for review

## 📦 Estimated App Size

### Initial Download Size:
- **Base App**: ~2-5 MB (Next.js bundle)
- **Assets**: ~1-3 MB (images, icons)
- **Service Worker**: ~50-100 KB
- **Total**: **~3-8 MB** initial download

### After Installation:
- **Cached Assets**: Can grow to 10-50 MB depending on usage
- **User Data**: Varies (localStorage, images)
- **Total Storage**: **~15-60 MB** typical usage

### Factors Affecting Size:
- Number of product images cached
- User-generated content (try-on images)
- Video content (if cached)
- API response caching

## 🔧 Configuration Details

### Service Worker Caching:
- **API Calls**: Network-first strategy (24h cache)
- **Images**: Cache-first strategy (7-30 days)
- **Static Assets**: Long-term caching

### Offline Support:
- App shell cached for offline access
- Previously visited pages work offline
- API calls require network connection

## 🚀 Deployment Checklist

- [x] Generate all required icon sizes (run `npm run generate-icons`)
- [ ] Test PWA installation on Android
- [ ] Test PWA installation on iOS
- [ ] Test offline functionality
- [ ] Build production version (`npm run build`)
- [ ] Deploy to hosting (Vercel, Netlify, etc.)
- [ ] Test on deployed URL
- [ ] Generate Android package via PWABuilder
- [ ] Create Play Store listing
- [ ] Upload to Play Console
- [ ] Submit for review

## 📝 Important Notes

1. **HTTPS Required**: PWA requires HTTPS (except localhost)
2. **Manifest**: Must be accessible at `/manifest.json`
3. **Service Worker**: Must be accessible at `/sw.js`
4. **Icons**: 192x192 and 512x512 are mandatory
5. **Display Mode**: Set to "standalone" for app-like experience

## 🐛 Troubleshooting

### Service Worker Not Registering:
- Check browser console for errors
- Ensure HTTPS is enabled
- Clear browser cache and try again

### Icons Not Showing:
- Verify all icon files exist in `public/` folder
- Check manifest.json paths are correct
- Clear browser cache

### Install Prompt Not Showing:
- Wait a few seconds after page load
- Check if app is already installed
- Test in Chrome/Edge (best PWA support)

## 📚 Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [PWABuilder](https://www.pwabuilder.com/)
- [Play Store PWA Guide](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)

