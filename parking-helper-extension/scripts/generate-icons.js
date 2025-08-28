const fs = require('fs');
const path = require('path');

// SVG 아이콘 (주차 표시 P)
const svgIcon = `
<svg width="128" height="128" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="24" fill="url(#bg)"/>
  <text x="64" y="64" font-family="Arial, sans-serif" font-size="72" font-weight="bold" 
        text-anchor="middle" dominant-baseline="middle" fill="white">P</text>
  <circle cx="64" cy="90" r="6" fill="white" opacity="0.8"/>
  <circle cx="84" cy="90" r="6" fill="white" opacity="0.8"/>
  <circle cx="44" cy="90" r="6" fill="white" opacity="0.8"/>
</svg>`;

// Canvas 생성 함수 (PNG 변환용)
function createCanvas(size) {
  const { createCanvas } = require('canvas');
  return createCanvas(size, size);
}

// SVG를 PNG로 변환하는 함수
async function svgToPng(svgContent, size) {
  const sharp = require('sharp');
  
  // SVG 크기 조정
  const resizedSvg = svgContent.replace('width="128"', `width="${size}"`).replace('height="128"', `height="${size}"`);
  
  // Sharp를 사용하여 PNG 변환
  const buffer = await sharp(Buffer.from(resizedSvg))
    .resize(size, size)
    .png()
    .toBuffer();
  
  return buffer;
}

// 아이콘 생성
async function generateIcons() {
  const sizes = [16, 48, 128];
  const publicDir = path.join(__dirname, '..', 'public');
  
  // public 디렉토리가 없으면 생성
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  try {
    // sharp 설치 확인
    const sharp = require('sharp');
    
    for (const size of sizes) {
      const buffer = await svgToPng(svgIcon, size);
      const fileName = `icon-${size}.png`;
      const filePath = path.join(publicDir, fileName);
      
      fs.writeFileSync(filePath, buffer);
      console.log(`✅ Generated ${fileName}`);
    }
    
    console.log('🎨 All icons generated successfully!');
  } catch (error) {
    // Sharp가 없으면 기본 PNG 파일 생성 (단순 대체)
    console.log('⚠️ Sharp not installed. Creating placeholder icons...');
    
    // 간단한 PNG 헤더와 최소한의 이미지 데이터로 임시 파일 생성
    const simplePng = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x10, // 16x16
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0xF3, 0xFF, // bit depth, color type
      0x61, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
      0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    for (const size of sizes) {
      const fileName = `icon-${size}.png`;
      const filePath = path.join(publicDir, fileName);
      fs.writeFileSync(filePath, simplePng);
      console.log(`⚠️ Created placeholder ${fileName}`);
    }
    
    console.log('\n📝 To generate proper icons, run: npm install sharp');
  }
}

generateIcons();