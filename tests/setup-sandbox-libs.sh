#!/usr/bin/env bash
# Only needed on a minimal Linux/WSL image where headless Chromium fails with "error while loading shared libraries".
# Downloads the missing system libraries and a font WITHOUT root (apt-get download + dpkg -x) into tests/.deps.
# e2e/helpers.mjs picks tests/.deps up automatically (LD_LIBRARY_PATH + FONTCONFIG_FILE).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p .deps/debs .deps/root && cd .deps/debs
for p in libglib2.0-0t64 libnspr4 libnss3 libatk1.0-0t64 libatk-bridge2.0-0t64 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
         libgbm1 libxkbcommon0 libasound2t64 libatspi2.0-0t64 libwayland-server0 libdrm2 libxrender1 libxi6 fonts-dejavu-core fonts-liberation2; do
  apt-get download "$p" >/dev/null 2>&1 || echo "could not fetch $p (may already be installed or have another name)"
done
for d in *.deb; do dpkg-deb -x "$d" ../root; done
cat > ../fonts.conf <<CONF
<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>$(cd ../root && pwd)/usr/share/fonts</dir><cachedir>$(cd .. && pwd)/fcache</cachedir>
<alias><family>sans-serif</family><prefer><family>Liberation Sans</family><family>DejaVu Sans</family></prefer></alias>
<alias><family>monospace</family><prefer><family>DejaVu Sans Mono</family></prefer></alias></fontconfig>
CONF
echo "done: tests/.deps ready"
