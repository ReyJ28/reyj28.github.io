#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
mkdir -p images/optimized/{brand,projects,team,backgrounds,icons}

opt() {
  local src="$1" dst_base="$2" width="$3" jpg_q="$4" webp_q="$5"
  if [ -n "$width" ]; then
    ffmpeg -y -loglevel error -i "$src" -vf "scale=${width}:-1" -q:v "$jpg_q" "${dst_base}.jpg"
    ffmpeg -y -loglevel error -i "$src" -vf "scale=${width}:-1" -q:v "$webp_q" "${dst_base}.webp"
  else
    ffmpeg -y -loglevel error -i "$src" -q:v "$jpg_q" "${dst_base}.jpg"
    ffmpeg -y -loglevel error -i "$src" -q:v "$webp_q" "${dst_base}.webp"
  fi
}

# Hero (LCP image) — 3 responsive widths
opt images/brand/hero-1.jpg images/optimized/brand/hero-1-1920 1920 4 78
opt images/brand/hero-1.jpg images/optimized/brand/hero-1-1280 1280 4 78
opt images/brand/hero-1.jpg images/optimized/brand/hero-1-640  640  4 78

# Project photos (already small dimensions — compress + webp only)
for n in 1 2 3 4 5 6 7; do
  opt images/projects/work-$n.jpg images/optimized/projects/work-$n "" 5 78
done

# Team
opt images/team/team-1.jpg images/optimized/team/team-1 "" 4 80
opt images/team/team-bg.jpg images/optimized/team/team-bg-1920 1920 5 76
opt images/team/team-bg.jpg images/optimized/team/team-bg-960 960 5 76

# Backgrounds
opt images/backgrounds/callto-bg.jpg images/optimized/backgrounds/callto-bg-1920 1920 5 76
opt images/backgrounds/callto-bg.jpg images/optimized/backgrounds/callto-bg-960 960 5 76
opt images/backgrounds/breadcrumb-bg.jpg images/optimized/backgrounds/breadcrumb-bg-1920 1920 5 76
opt images/backgrounds/breadcrumb-bg.jpg images/optimized/backgrounds/breadcrumb-bg-960 960 5 76

# Service icons (displayed at 40px — downscale to 80px @2x, webp only, keep small png fallback)
ffmpeg -y -loglevel error -i images/icons/si-1.png -vf "scale=80:-1" images/optimized/icons/si-1-80.png
ffmpeg -y -loglevel error -i images/icons/si-1.png -vf "scale=80:-1" -q:v 85 images/optimized/icons/si-1-80.webp
ffmpeg -y -loglevel error -i images/icons/si-3.png -vf "scale=80:-1" images/optimized/icons/si-3-80.png
ffmpeg -y -loglevel error -i images/icons/si-3.png -vf "scale=80:-1" -q:v 85 images/optimized/icons/si-3-80.webp

echo "done"
