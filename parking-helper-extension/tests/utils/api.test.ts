import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchParkingInfo } from '../../utils/api';
import { PlaceInfo } from '../../utils/types';

// Mock fetch
global.fetch = vi.fn();

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear cache
    (fetchParkingInfo as any).cache?.clear();
  });

  describe('fetchParkingInfo', () => {
    const mockPlace: PlaceInfo = {
      name: '테스트 장소',
      address: '서울특별시 강남구',
      latitude: 37.5,
      longitude: 127.0,
      provider: 'naver',
      externalId: '1234'
    };

    it('should fetch parking info successfully', async () => {
      const mockResponse = {
        data: {
          parkingLots: [
            {
              id: '1',
              name: '테스트 주차장',
              type: 'public' as const,
              distance: '도보 5분'
            }
          ],
          reviews: [],
          tips: []
        }
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await fetchParkingInfo(mockPlace);

      expect(result.parkingLots).toHaveLength(1);
      expect(result.parkingLots?.[0].name).toBe('테스트 주차장');
    });

    it('should return cached data if available', async () => {
      // First call
      const mockData = { parkingLots: [], reviews: [], tips: [] };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockData })
      });

      await fetchParkingInfo(mockPlace);
      
      // Second call - should use cache
      const result = await fetchParkingInfo(mockPlace);
      
      // Fetch should only be called once
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockData);
    });

    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      await expect(fetchParkingInfo(mockPlace)).rejects.toThrow('API error: 500');
    });
  });
});