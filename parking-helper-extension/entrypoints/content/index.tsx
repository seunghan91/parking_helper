import React from 'react';
import ReactDOM from 'react-dom/client';
import { defineContentScript } from 'wxt/sandbox';
import ParkingHelperPanel from './ParkingHelperPanel';
import './style.css';

export default defineContentScript({
  matches: [
    'https://map.naver.com/*',
    'https://map.kakao.com/*',
    'https://www.google.com/maps/*',
    'https://maps.google.com/*'
  ],
  cssInjectionMode: 'ui',
  
  async main(ctx) {
    // UI 컨테이너 생성
    const ui = await createIntegratedUi(ctx, {
      name: 'parking-helper-panel',
      position: 'inline',
      anchor: 'body',
      onMount: (container) => {
        // React 컴포넌트 마운트
        const app = document.createElement('div');
        app.id = 'parking-helper-root';
        container.appendChild(app);
        
        const root = ReactDOM.createRoot(app);
        root.render(<ParkingHelperPanel />);
        
        return root;
      },
      onRemove: (root) => {
        // React 컴포넌트 언마운트
        root?.unmount();
      }
    });

    // UI 마운트
    ui.mount();
  }
});

// UI 생성 헬퍼 함수
const createIntegratedUi = async (ctx: any, options: any) => {
  const { name, position, anchor, onMount, onRemove } = options;
  
  const container = document.createElement('div');
  container.className = name;
  
  let root: any = null;
  
  return {
    mount() {
      if (position === 'inline') {
        const anchorEl = typeof anchor === 'string' 
          ? document.querySelector(anchor) 
          : anchor;
        anchorEl?.appendChild(container);
      }
      
      root = onMount(container);
    },
    
    remove() {
      onRemove?.(root);
      container.remove();
    }
  };
};