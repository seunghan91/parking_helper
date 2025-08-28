import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">파킹 헬퍼</h1>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <form action="/auth/logout" method="post">
                  <button className="text-sm text-gray-500 hover:text-gray-700">
                    로그아웃
                  </button>
                </form>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                로그인
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            실사용자 기반 주차 정보 플랫폼
          </h2>
          <p className="text-xl text-gray-600">
            네이버, 카카오, 구글 지도와 함께 사용하는 주차 정보 서비스
          </p>
        </div>

        {/* 더미 데이터 섹션 */}
        <div className="mb-12">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-700">
              <strong>🎪 더미 데이터:</strong> 아래는 예시 데이터입니다. 실제 사용자 리뷰가 쌓이면 교체될 예정입니다.
            </p>
          </div>

          {/* 인기 주차장 */}
          <section className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">🏆 인기 주차장</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <h4 className="font-semibold text-lg mb-2">강남역 공영주차장</h4>
                <div className="flex items-center mb-2">
                  <span className="text-yellow-400">★★★★☆</span>
                  <span className="text-gray-600 ml-2">4.2 (127개 리뷰)</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">시간당 3,000원 / 일주차 20,000원</p>
                <p className="text-gray-700 text-sm">넓은 공간, 접근성 좋음, 주말 혼잡</p>
                <div className="mt-3">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">24시간</span>
                  <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded ml-1">실내</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <h4 className="font-semibold text-lg mb-2">판교 테크노밸리 주차타워</h4>
                <div className="flex items-center mb-2">
                  <span className="text-yellow-400">★★★★★</span>
                  <span className="text-gray-600 ml-2">4.8 (89개 리뷰)</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">시간당 2,000원 / 일주차 15,000원</p>
                <p className="text-gray-700 text-sm">최신 시설, 전기차 충전소, 깨끗함</p>
                <div className="mt-3">
                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">24시간</span>
                  <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded ml-1">EV충전</span>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
                <h4 className="font-semibold text-lg mb-2">홍대입구역 제1주차장</h4>
                <div className="flex items-center mb-2">
                  <span className="text-yellow-400">★★★☆☆</span>
                  <span className="text-gray-600 ml-2">3.5 (203개 리뷰)</span>
                </div>
                <p className="text-gray-600 text-sm mb-3">시간당 4,000원 / 일주차 30,000원</p>
                <p className="text-gray-700 text-sm">주말 만차 빈번, 좁은 공간, 위치 좋음</p>
                <div className="mt-3">
                  <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded">혼잡</span>
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded ml-1">지하</span>
                </div>
              </div>
            </div>
          </section>

          {/* 최신 리뷰 */}
          <section className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">💬 최신 리뷰</h3>
            <div className="space-y-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">코엑스 주차장</h4>
                    <span className="text-yellow-400 text-sm">★★★★☆</span>
                  </div>
                  <span className="text-gray-500 text-sm">2시간 전</span>
                </div>
                <p className="text-gray-700">넓고 깨끗해서 좋았어요. 다만 요금이 좀 비싼 편입니다. 행사 있는 날은 자리 찾기 힘들어요.</p>
                <p className="text-gray-600 text-sm mt-2">- 김민수 (더미)</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">명동 밀리오레 주차장</h4>
                    <span className="text-yellow-400 text-sm">★★☆☆☆</span>
                  </div>
                  <span className="text-gray-500 text-sm">5시간 전</span>
                </div>
                <p className="text-gray-700">주차 공간이 너무 좁아요. 대형차는 주차하기 정말 힘듭니다. 위치는 좋지만 다시 가고 싶지 않네요.</p>
                <p className="text-gray-600 text-sm mt-2">- 박지영 (더미)</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">서울역 주차장</h4>
                    <span className="text-yellow-400 text-sm">★★★★★</span>
                  </div>
                  <span className="text-gray-500 text-sm">1일 전</span>
                </div>
                <p className="text-gray-700">KTX 이용객은 50% 할인 받을 수 있어서 좋아요! 시설도 깨끗하고 안내 직원분들도 친절했습니다.</p>
                <p className="text-gray-600 text-sm mt-2">- 이준호 (더미)</p>
              </div>
            </div>
          </section>

          {/* 꿀팁 모음 */}
          <section className="mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">💡 주차 꿀팁</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <h4 className="font-semibold text-lg mb-2">🆓 강남 무료주차 꿀팁</h4>
                <p className="text-gray-700 text-sm mb-2">강남구청 주차장은 주말과 공휴일에 무료로 개방됩니다!</p>
                <p className="text-gray-600 text-xs">토요일 오후 1시 이후, 일요일 전일 무료</p>
                <div className="mt-3">
                  <span className="text-blue-600 text-sm font-medium">👍 247명이 도움됨</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                <h4 className="font-semibold text-lg mb-2">💰 이마트 주차 할인</h4>
                <p className="text-gray-700 text-sm mb-2">이마트에서 3만원 이상 구매 시 3시간 무료!</p>
                <p className="text-gray-600 text-xs">영수증 꼭 챙기세요. 앱 회원은 추가 1시간</p>
                <div className="mt-3">
                  <span className="text-green-600 text-sm font-medium">👍 189명이 도움됨</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                <h4 className="font-semibold text-lg mb-2">🕐 시간대별 꿀팁</h4>
                <p className="text-gray-700 text-sm mb-2">평일 오후 2-5시는 대부분 주차장이 한산해요</p>
                <p className="text-gray-600 text-xs">특히 오피스 지역은 점심시간 이후가 최고!</p>
                <div className="mt-3">
                  <span className="text-purple-600 text-sm font-medium">👍 156명이 도움됨</span>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6">
                <h4 className="font-semibold text-lg mb-2">📱 앱 활용 팁</h4>
                <p className="text-gray-700 text-sm mb-2">아이파킹, 파크히어 앱으로 미리 예약하면 20% 할인!</p>
                <p className="text-gray-600 text-xs">주말 번화가는 미리 예약 필수</p>
                <div className="mt-3">
                  <span className="text-orange-600 text-sm font-medium">👍 203명이 도움됨</span>
                </div>
              </div>
            </div>
          </section>
        </div>
          
        {user ? (
          <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">환영합니다!</h3>
            <p className="text-gray-600">
              로그인되었습니다. 이제 리뷰를 작성하고 꿀팁을 공유할 수 있어요!
            </p>
            <div className="mt-4 space-x-3">
              <Link 
                href="/review" 
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                리뷰 작성
              </Link>
              <Link 
                href="/tip" 
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                꿀팁 공유
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 max-w-md mx-auto">
            <p className="text-gray-600 mb-4">
              로그인하여 주차 정보를 확인하고 리뷰를 남겨보세요
            </p>
            <Link 
              href="/login" 
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium"
            >
              시작하기
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}
