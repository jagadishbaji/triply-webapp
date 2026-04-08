#!/bin/bash
# NammaCAB PWA Icon Generator
# Usage: ./generate_icons.sh path/to/your-logo.png
# Requirements: ImageMagick (brew install imagemagick OR apt install imagemagick)

SOURCE="${1:-logo.png}"

if [ ! -f "$SOURCE" ]; then
  echo "❌ Source file not found: $SOURCE"
  echo "Usage: ./generate_icons.sh path/to/logo.png"
  exit 1
fi

mkdir -p public/icons

SIZES=(72 96 128 144 152 192 384 512)

echo "🎨 Generating PWA icons from $SOURCE..."

for size in "${SIZES[@]}"; do
  convert "$SOURCE" \
    -resize "${size}x${size}^" \
    -gravity center \
    -extent "${size}x${size}" \
    "public/icons/icon-${size}x${size}.png"
  echo "  ✅ icon-${size}x${size}.png"
done

# Apple Touch Icon (180x180, no maskable padding)
convert "$SOURCE" \
  -resize "180x180^" \
  -gravity center \
  -extent "180x180" \
  "public/icons/apple-touch-icon.png"
echo "  ✅ apple-touch-icon.png (180x180)"

# favicon.ico (32x32)
convert "$SOURCE" -resize "32x32" "public/icons/icon-32x32.png"
echo "  ✅ icon-32x32.png"

echo ""
echo "✨ All icons generated in public/icons/"
echo ""
echo "📝 Next steps:"
echo "   1. Verify icons look correct (especially at small sizes)"
echo "   2. Check maskable icons at https://maskable.app"
echo "   3. Test PWA install on Chrome DevTools > Application > Manifest"
