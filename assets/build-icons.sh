#!/usr/bin/env bash
# Regenerate the PWA PNG icons from controller.svg.
#
# ImageMagick's internal SVG renderer ignores `url(#gradient)` fills, so we draw
# the white controller (controller.svg, transparent background) and composite it
# onto a gradient backdrop that ImageMagick generates directly.
#
# Requires ImageMagick (`magick`). Run from the repo's assets/ directory:
#   ./build-icons.sh
set -euo pipefail
cd "$(dirname "$0")"

magick -background none -density 300 controller.svg -resize 512x512 _controller.png
magick -size 512x512 gradient:#6dd5ed-#2193b0 _bg.png
magick -size 512x512 xc:black -fill white -draw "roundrectangle 0,0,511,511,112,112" _mask.png
magick _bg.png _mask.png -alpha off -compose CopyOpacity -composite _bg-rounded.png

# "any" icons: rounded gradient + full-size controller
magick _bg-rounded.png _controller.png -compose over -composite -resize 512x512 icon-512.png
magick icon-512.png -resize 192x192 icon-192.png

# maskable: full-bleed gradient + controller scaled into the ~80% safe zone
magick _controller.png -resize 78% _controller-sm.png
magick _bg.png _controller-sm.png -gravity center -compose over -composite maskable-512.png

# apple-touch-icon: full-bleed square (iOS rounds it), no alpha
magick maskable-512.png -resize 180x180 -background "#2193b0" -flatten apple-touch-icon.png

rm -f _controller.png _bg.png _mask.png _bg-rounded.png _controller-sm.png
echo "Icons regenerated: icon-192 icon-512 maskable-512 apple-touch-icon"
