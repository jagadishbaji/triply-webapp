RIDEVO - Round 8 export
=======================
Folders: pin/, route/, chevrons/, monogram/ (one per icon concept) and wordmark/.

Each icon folder has:
  ridevo-icon-<name>.svg            rounded icon, for web and in-app use
  ridevo-icon-<name>-square.svg     full-bleed square, for app store uploads
  png/                              rounded PNGs: 16, 32, 48, 64, 180, 192, 512, 1024
                                    square PNGs: 512, 1024
  favicon.ico                       16 / 32 / 48
  ridevo-logo-<name>-on-light/dark  icon + RIDEVO lockup (SVG + PNG, transparent)

Where to use them
  Website favicon   favicon.ico, png/...-32.png (and the SVG)
  Apple touch icon  png/...-180.png
  PWA manifest      png/...-192.png and png/...-512.png
  Play Store        png/...-square-512.png  (512x512)
  App Store         png/...-square-1024.png (1024x1024, no transparency)
  Website header    ridevo-logo-<name>-on-dark.svg (or on-light)

HTML:
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/ridevo-icon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">

The wordmark is converted to outlines (Inter Bold), so no font is needed.
Colours: Ridevo Green #22C55E, Mint #4ADE80, Forest Black #08140F, Signal Green #16A34A.
