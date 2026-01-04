import { defineConfig } from 'wxt'
import { resolve } from 'path'

export default defineConfig({
  dev: {
    server: {
      port: 3002,  // WXT 개발 서버 포트 명시적 설정
    }
  },
  alias: {
    '@': resolve(__dirname, './'),
    '@/utils': resolve(__dirname, './utils'),
    '@/components': resolve(__dirname, './components'),
    '@/entrypoints': resolve(__dirname, './entrypoints'),
  },
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
    permissions: ['storage', 'tabs', 'scripting'],
    web_accessible_resources: [
      {
        resources: ['assets/*'],
        matches: ['<all_urls>']
      }
    ],
    action: {
      default_popup: 'popup.html',
      default_title: '파킹 헬퍼 - 주차 정보 확인'
    },
    icons: {
      16: 'icon-16.png',
      48: 'icon-48.png',
      128: 'icon-128.png'
    },
    content_scripts: [
      {
        matches: [
          'https://map.naver.com/*',
          'https://map.kakao.com/*',
          'https://www.google.com/maps/*',
          'https://maps.google.com/*'
        ],
        js: ['content-scripts/content.js'],
        run_at: 'document_idle'
      }
    ]
  },
  outDir: '.output'
})