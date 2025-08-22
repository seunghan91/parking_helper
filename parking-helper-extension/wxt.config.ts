import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: '파킹 헬퍼',
    description: '네이버, 카카오, 구글 지도에서 실시간 주차 정보를 제공하는 크롬 확장 프로그램',
    permissions: ['storage'],
    host_permissions: [
      'https://map.naver.com/*',
      'https://map.kakao.com/*',
      'https://www.google.com/maps/*',
      'https://maps.google.com/*'
    ],
    action: {
      default_popup: 'popup.html',
      default_icon: {
        "16": "icon-16.png",
        "48": "icon-48.png",
        "128": "icon-128.png"
      }
    },
    icons: {
      "16": "icon-16.png",
      "48": "icon-48.png",
      "128": "icon-128.png"
    }
  }
});