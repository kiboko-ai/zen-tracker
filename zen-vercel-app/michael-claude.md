# Zen Tracker 웹사이트 개발 작업 기록

**작업자**: Michael & Claude  
**작업일**: 2025년 8월 26일 화요일  
**작업시간**: 15:53

## 📋 프로젝트 개요
Zen Tracker 모바일 앱의 소개 페이지를 Vercel에 배포하기 위한 Next.js 웹사이트 개발

## 🛠️ 작업 내용

### 1. 프로젝트 초기 설정
- zen-vercel-app 폴더 생성
- Next.js 프로젝트 구성 (v14.2.5)
- 기본 폴더 구조 설정 (pages, public, styles)

### 2. 메인 페이지 구현
- **Hero 섹션**: "A Minimalist Focus Timer for Deep Work" 타이틀
- **온보딩 섹션**: 4단계 튜토리얼 프로세스 소개
- **Features 섹션**: 6가지 주요 기능 카드
- **Reports 섹션**: Timeline/Rings 뷰 스크린샷 표시
- **Download 섹션**: iOS/Android 다운로드 버튼

### 3. 실제 앱 스크린샷 통합
- `/public/screenshots/` 폴더의 9개 스크린샷 활용
- 온보딩 프로세스 시각화 (1-4번 스크린샷)
- 홈 화면 캐러셀 (5-8번 스크린샷)
- 리포트 화면 표시 (8-9번 스크린샷)

### 4. 디자인 시스템
- **컬러 스킴**: 완전한 블랙 앤 화이트 테마
  - 배경: #000 (블랙)
  - 텍스트: #fff (화이트)
  - 서브 텍스트: #aaa (라이트 그레이)
  - Footer: 화이트 배경으로 대비
- **버튼 스타일**:
  - Primary: 화이트 배경 + 블랙 텍스트 (호버 시 반전)
  - Secondary: 투명 배경 + 회색 테두리
  - Disabled: 낮은 투명도로 구분

### 5. 플랫폼별 설정
- **iOS**: App Store 실제 링크 연결 (id: 6749873242)
- **Android**: "Google Play (Coming Soon)" 표시
- **Contact**: dev@kiboko.ai 이메일 연결

### 6. SEO 최적화
- **robots.txt**: 검색 엔진 크롤러 안내
- **sitemap.xml**: 사이트맵 제공
- **메타 태그**:
  - Open Graph (Facebook, LinkedIn)
  - Twitter Card
  - Apple App Store
  - Canonical URL
  - Keywords & Description

### 7. 반응형 디자인
- 모바일, 태블릿, 데스크탑 대응
- 스크린샷 갤러리 반응형 레이아웃
- 버튼 및 네비게이션 모바일 최적화

## 📂 파일 구조
```
zen-vercel-app/
├── pages/
│   ├── index.js          # 메인 페이지
│   ├── _app.js           # Next.js 앱 설정
│   ├── _document.js      # HTML 문서 설정
│   └── api/
│       └── sitemap.js    # 동적 사이트맵
├── public/
│   ├── screenshots/      # 앱 스크린샷 (1-9)
│   ├── robots.txt        # SEO 로봇 파일
│   ├── sitemap.xml       # 정적 사이트맵
│   └── favicon.ico       # 파비콘
├── styles/
│   ├── globals.css       # 전역 스타일
│   └── Home.module.css   # 홈페이지 스타일
├── package.json          # 프로젝트 설정
├── next.config.js        # Next.js 설정
├── vercel.json          # Vercel 배포 설정
└── README.md            # 프로젝트 문서
```

## 🚀 배포 정보
- **배포 플랫폼**: Vercel
- **도메인**: https://zen-tracker.vercel.app
- **빌드 명령**: `npm run build`
- **개발 서버**: `npm run dev` (localhost:3004)

## 🎨 디자인 특징
1. 미니멀리즘 중심의 블랙 앤 화이트 디자인
2. 실제 앱 스크린샷을 활용한 시각적 소개
3. 다크 모드 중심의 UI/UX
4. 명확한 CTA (Call to Action) 버튼
5. 깔끔한 타이포그래피와 여백 활용

## 📝 추가 참고사항
- npm 캐시 권한 문제로 인한 설치 이슈 해결
- 포트 충돌로 인해 3004번 포트 사용
- 실제 앱스토어 링크 적용 완료
- 안드로이드 버전은 현재 개발 중

## 🔗 관련 링크
- iOS 앱: https://apps.apple.com/kr/app/zen/id6749873242
- 문의: dev@kiboko.ai

---

*이 문서는 2025년 8월 26일 15:53분 기준으로 작성되었습니다.*