import { defineConfig } from 'wxt'

export default defineConfig({
  manifest: {
    name: '파킹 헬퍼',
    description: '네이버, 카카오, 구글 지도에서 주차 리뷰와 꿀팁을 제공하는 크롬 확장 프로그램',
    version: '1.0.0',
    host_permissions: [
      'https://map.naver.com/*',
      'https://map.kakao.com/*',
      'https://www.google.com/maps/*',
      'https://maps.google.com/*'
    ],
    permissions: ['storage'],
    icons: {
      16: 'icon-16.png',
      48: 'icon-48.png',
      128: 'icon-128.png'
    }
  },
  outDir: '.output'
})