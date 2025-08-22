import { describe, it, expect, beforeEach } from 'vitest';
import { detectPlaceInfo } from '../../utils/placeDetector';

describe('placeDetector', () => {
  beforeEach(() => {
    // Reset window.location
    delete (window as any).location;
    (window as any).location = { hostname: '', href: '' };
  });

  describe('detectPlaceInfo', () => {
    it('should detect Naver place', async () => {
      // Mock Naver map URL
      window.location.hostname = 'map.naver.com';
      window.location.href = 'https://map.naver.com/v5/entry/place/1234567890';
      
      // Mock DOM elements
      document.body.innerHTML = `
        <div class="place_bluelink">테스트 장소</div>
        <div class="YouOG">
          <span>테스트 장소</span>
        </div>
        <div>
          <span>서울특별시 강남구 테스트로 123</span>
        </div>
      `;

      const result = await detectPlaceInfo();
      
      expect(result).toEqual({
        name: '테스트 장소',
        address: '서울특별시 강남구 테스트로 123',
        provider: 'naver',
        externalId: '1234567890'
      });
    });

    it('should return null for unsupported domains', async () => {
      window.location.hostname = 'example.com';
      
      const result = await detectPlaceInfo();
      
      expect(result).toBeNull();
    });
  });
});