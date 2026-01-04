'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function ReviewContent() {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const searchParams = useSearchParams();
  
  // URL 파라미터에서 장소 정보 가져오기
  const placeName = searchParams.get('placeName') || '알 수 없는 장소';
  const placeAddress = searchParams.get('placeAddress') || '';
  const placeId = searchParams.get('placeId') || '';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 섹션 - 현재 리뷰 작성 중인 장소 표시 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 px-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📍</span>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{placeName}</h2>
              {placeAddress && (
                <p className="text-sm opacity-90 mt-1">{placeAddress}</p>
              )}
            </div>
          </div>
          <div className="mt-3 bg-white/20 backdrop-blur rounded-lg px-4 py-2">
            <p className="text-sm font-medium">🚗 이 장소의 주차 리뷰를 작성하고 있습니다</p>
          </div>
        </div>
      </div>
      
      <div className="py-8">
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-xl shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            📝 주차장 리뷰 작성
          </h1>
        
          <form className="space-y-6">
            {/* 장소 정보 표시 (읽기 전용) */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-gray-500">리뷰 작성 장소</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{placeName}</p>
              {placeAddress && (
                <p className="text-sm text-gray-600 mt-1">{placeAddress}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                평점
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`text-3xl ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                리뷰 내용
              </label>
              <textarea
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="주차장 이용 경험을 공유해주세요"
                value={review}
                onChange={(e) => setReview(e.target.value)}
              />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">추가 정보</h3>
              
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">주차 공간이 넓어요</span>
              </label>
              
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">요금이 저렴해요</span>
              </label>
              
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">접근성이 좋아요</span>
              </label>
              
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span className="text-gray-600">24시간 이용 가능해요</span>
              </label>
            </div>
            
            <div className="flex gap-4 pt-4 border-t">
              <button
                type="submit"
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
              >
                리뷰 등록
              </button>
              <button
                type="button"
                className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => window.history.back()}
              >
                취소
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReviewContent />
    </Suspense>
  );
}