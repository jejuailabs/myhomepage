# 03. 데이터 모델 (Firestore)

## Collection: `users`
```
users/{uid}
  - displayName: string
  - slug: string              // URL용 (/h/[slug])
  - authProvider: "google"
  - role: "member" | "admin"
  - status: "pending" | "approved" | "rejected"
  - createdAt: timestamp
  - order: number              // 관리자 수동 정렬용
```

## Collection: `profiles`
```
profiles/{uid}
  - conceptId: "cream_elegant" | "dark_forest" | "lavender_soft"
             | "kraft_vintage" | "ocean_magazine" | "pastel_dashboard"
  - heroImageUrl: string        // 메인 허브 카드용 대표 이미지
  - heroSummary: string         // 카드 하단 1~2문장 요약
  - profileImageUrl: string
  - slogan: string
  - mp3Url: string
  - mp3Autoplay: boolean        // 기본 true

  - tastes: [ { icon: string, label: string } ]           // 01 나의 취향
  - bucketList: [ { rank: number, label: string } ]        // 02 버킷리스트 TOP3
  - dreamTravel: { imageUrl: string, label: string }
  - dreamLearn: { imageUrl: string, label: string }
  - strengths: [ { imageUrl: string, caption: string } ]   // 03 나의 강점
  - loved: [ { imageUrl: string, label: string } ]         // 04 내가 사랑하는 것
  - happyMoments: [ { imageUrl: string } ]                  // 05 행복한 순간 갤러리
  - closingText: string
  - subTagline: string

  - updatedAt: timestamp
```

## Storage 구조
```
/uploads/{uid}/profile.jpg
/uploads/{uid}/hero.jpg
/uploads/{uid}/sections/{sectionId}/{imageId}.jpg
/uploads/{uid}/audio.mp3
```

## Collection: `settings` (관리자 전역 설정)
```
settings/hub
  - heroTitle: "조천리 부녀회 Heroes"
  - cardOrderMode: "manual" | "createdAt"
```

## 참고
- `heroSummary`, `slogan`, `closingText` 등은 유저 자유 입력 텍스트 필드
- 이미지/오디오는 Firebase Storage 업로드 후 URL만 Firestore에 저장
- `status: pending` 유저는 관리자 승인 전까지 메인 허브에 노출되지 않음
