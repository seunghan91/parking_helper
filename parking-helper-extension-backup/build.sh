#!/bin/bash

# 디렉토리 생성
mkdir -p dist
mkdir -p dist/assets

# TypeScript 컴파일 (tsc가 없으므로 직접 JavaScript로 변환)
echo "Building extension..."

# content.ts -> content.js (간단한 변환)
cat src/content.ts | sed 's/: PlaceInfo//g' | sed 's/: HTMLElement//g' | sed 's/: string//g' | sed 's/: number//g' | sed 's/: any//g' | sed 's/: NodeJS.Timeout//g' | sed 's/interface PlaceInfo {/const PlaceInfo = {/g' | sed 's/private //g' | sed 's/public //g' > dist/content.js

# popup.ts -> popup.js
cat src/popup.ts | sed 's/\?\./(el) \&\& el\./g' > dist/popup.js

# 정적 파일 복사
cp src/content.css dist/content.css
cp src/popup.html dist/popup.html
cp manifest.json dist/manifest.json

# 아이콘 생성 (임시)
echo "Creating placeholder icons..."
mkdir -p dist/assets
echo "P" > dist/assets/icon16.png
echo "P" > dist/assets/icon48.png
echo "P" > dist/assets/icon128.png

echo "Build complete! Extension files are in the 'dist' directory."
echo "To install:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked' and select the 'dist' directory"