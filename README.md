# 조천리 부녀회 Heroes

마을 부녀회원 각자의 모바일 전용 미니 홈페이지를 만들고, 메인 허브에서 세로형 히어로 카드로 모아 보여주는 커뮤니티 웹빌더.

## 실행

```bash
npm install
npm run dev
```

`.env.local` 이 없거나 `NEXT_PUBLIC_USE_MOCK=true` 이면 **목업 모드**로 동작합니다.
Firebase 없이도 6명의 샘플 데이터로 전체 화면(허브 / 개별 홈피 6종 / 편집 / 관리자)을 확인할 수 있습니다.

## 화면

| 경로 | 설명 |
| --- | --- |
| `/` | 메인 허브. 히어로 카드 좌우 스와이프 캐러셀. 비로그인 시 하단에 Google 로그인 버튼, 로그인 시 계정 줄로 교체 |
| `/h/[slug]` | 개별 홈피. 컨셉 고정 팔레트 + mp3 자동재생 |
| `/me` | 내 홈피 편집 (컨셉 선택 · 섹션 입력 · 이미지/mp3 업로드 · 미리보기) |
| `/admin` | 관리자. 승인/반려, 허브 카드 노출 순서 정렬 |

## 다크/라이트 모드

- **메인 허브 · 편집 · 관리자 화면에만** 적용됩니다 (헤더 우측 토글 스위치).
- **개별 홈피는 토글의 영향을 받지 않습니다.** 6종 컨셉이 각자 고정 팔레트를 갖기 때문이며,
  이는 `docs/04_tech_and_features.md` 의 "확인 필요" 항목에 대해 기본안대로 구현한 것입니다.
- 선택값은 `localStorage('heroes-theme')` 에 저장되고, `layout.tsx` 의 인라인 스크립트가
  첫 페인트 전에 클래스를 적용해 깜빡임(FOUC)이 없습니다.

## mp3 자동재생

1. 허브 카드를 **탭해서** 진입하면 그 탭이 유저 인터랙션이므로 `sessionStorage` 에 근거를 남기고 즉시 `play()` 시도
2. URL 직접 접속/새로고침이면 브라우저가 차단 → 하단에 **"🔊 소리 켜고 보기"** 폴백 버튼 노출
3. 재생 중에는 우측 하단에 재생/일시정지 아이콘만 상시 노출 (진행바 없음)

## Firebase 연결

1. Firebase 콘솔에서 프로젝트 생성 → 웹앱 추가
2. Authentication → Google 로그인 사용 설정 → 승인된 도메인에 Vercel 도메인 추가
3. Firestore, Storage 활성화
4. `.env.local.example` 을 복사해 `.env.local` 작성, `NEXT_PUBLIC_USE_MOCK` 은 `false` 또는 삭제
5. 규칙 배포:

```bash
npx firebase deploy --only firestore:rules,storage
```

첫 관리자는 Firestore 콘솔에서 해당 `users/{uid}` 문서의 `role` 을 `admin`, `status` 를 `approved` 로 직접 바꿔 지정합니다
(보안 규칙상 본인이 스스로 승격할 수 없습니다).

## Vercel 배포

GitHub 저장소에 push 하면 Vercel이 자동 빌드/배포합니다. Vercel 대시보드에서는
**환경변수(`NEXT_PUBLIC_FIREBASE_*`)만** 등록해 두면 됩니다. 프로덕션에서는
`NEXT_PUBLIC_USE_MOCK` 을 등록하지 마세요(등록 시 목업 데이터가 노출됩니다).

## 구조

```
src/
  app/            허브(/) · 개별 홈피(/h/[slug]) · 편집(/me) · 관리자(/admin)
  components/
    homepage/     개별 홈피 렌더러 + 컨셉별 시각 스킨(skins.ts)
    editor/       편집 폼 필드
  lib/
    concepts.ts   6종 컨셉 정의(팔레트/무드/썸네일)
    repo.ts       데이터 접근 계층 (Firestore ↔ 목업 자동 전환)
    types.ts      Firestore 데이터 모델
```

상세 스펙은 `docs/` 및 `CLAUDE.md` 참조.
