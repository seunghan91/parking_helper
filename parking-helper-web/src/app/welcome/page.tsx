export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-xl">
        <div className="text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-500 rounded-full">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎉 파킹 헬퍼에 오신 것을 환영합니다!
          </h1>
          
          <p className="text-lg text-gray-600 mb-8">
            네이버, 카카오, 구글 지도에서 주차 정보를 쉽게 확인하고 공유하세요.
          </p>
          
          <div className="space-y-4 text-left bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              🚗 주요 기능
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <span className="text-blue-500 mr-3">✓</span>
                <div>
                  <h3 className="font-medium text-gray-900">실시간 주차 정보</h3>
                  <p className="text-gray-600 text-sm">지도 서비스에서 주차장 정보를 즉시 확인</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-blue-500 mr-3">✓</span>
                <div>
                  <h3 className="font-medium text-gray-900">리뷰 & 평점</h3>
                  <p className="text-gray-600 text-sm">실제 이용자들의 생생한 후기와 평점</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-blue-500 mr-3">✓</span>
                <div>
                  <h3 className="font-medium text-gray-900">주차 꿀팁</h3>
                  <p className="text-gray-600 text-sm">숨겨진 주차 공간과 유용한 팁 공유</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-blue-500 mr-3">✓</span>
                <div>
                  <h3 className="font-medium text-gray-900">간편한 사용</h3>
                  <p className="text-gray-600 text-sm">크롬 확장 프로그램으로 원클릭 접근</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 space-y-3">
            <h3 className="text-lg font-medium text-gray-800">사용 방법</h3>
            <ol className="text-left text-gray-600 space-y-2">
              <li>1. 네이버, 카카오, 구글 지도를 열어주세요</li>
              <li>2. 확장 프로그램 아이콘을 클릭하세요</li>
              <li>3. 주차 정보를 확인하고 리뷰를 작성해보세요!</li>
            </ol>
          </div>
          
          <div className="mt-8 flex gap-4 justify-center">
            <a
              href="/"
              className="px-6 py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
            >
              시작하기
            </a>
            <a
              href="/settings"
              className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors"
            >
              설정
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}