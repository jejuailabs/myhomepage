export const CONCEPT_IDS = [
  'cream_elegant',
  'dark_forest',
  'lavender_soft',
  'kraft_vintage',
  'ocean_magazine',
  'pastel_dashboard',
] as const;

export type ConceptId = (typeof CONCEPT_IDS)[number];

export type UserStatus = 'pending' | 'approved' | 'rejected';
export type UserRole = 'member' | 'admin';

/** Firestore: users/{uid} */
export interface AppUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  slug: string;
  authProvider: 'google';
  role: UserRole;
  status: UserStatus;
  createdAt: number;
  order: number;
}

export interface TasteItem {
  /** 구버전 호환용. 새 디자인에서는 렌더링하지 않는다. */
  icon?: string;
  /** 항목 이름 (예: 좋아하는 음식) */
  category?: string;
  /** 값 (예: 닭갈비) */
  label: string;
  /** 답변에서 생성한 이미지 — 항목마다 한 장 */
  imageUrl?: string;
}
export interface BucketItem {
  rank: number;
  label: string;
  imageUrl?: string;
}
export interface ImageLabel {
  imageUrl: string;
  label: string;
  category?: string;
}
export interface ImageCaption {
  imageUrl: string;
  caption: string;
}

/**
 * 공개 범위.
 * - public:  누구나 전체 내용을 본다
 * - private: 사진(얼굴)은 그대로 보이지만 텍스트 기반 내용은 블러 처리된다. 본인은 원본을 본다.
 */
export type Visibility = 'public' | 'private';

/** Firestore: profiles/{uid} */
export interface Profile {
  uid: string;
  conceptId: ConceptId;
  visibility: Visibility;

  heroImageUrl: string;
  heroSummary: string;
  profileImageUrl: string;
  slogan: string;

  mp3Url: string;
  mp3Autoplay: boolean;

  tastes: TasteItem[];
  bucketList: BucketItem[];
  dreamTravel: ImageLabel;
  dreamLearn: ImageLabel;
  /** 어린 시절 꿈꾸던 직업 */
  childhoodDream?: string;
  strengths: ImageCaption[];
  loved: ImageLabel[];
  happyMoments: { imageUrl: string }[];
  /** 어느 슬롯에도 매이지 않은 여분 이미지 */
  gallery?: string[];

  closingText: string;
  subTagline: string;

  updatedAt: number;
}

/** 메인 허브 카드에 필요한 최소 데이터 (users + profiles 조인 결과) */
export interface HeroCard {
  uid: string;
  slug: string;
  displayName: string;
  heroImageUrl: string;
  heroSummary: string;
  conceptId: ConceptId;
  order: number;
  visibility: Visibility;
}

/** Firestore: settings/hub */
export interface HubSettings {
  heroTitle: string;
  cardOrderMode: 'manual' | 'createdAt';
}

export const emptyProfile = (uid: string, conceptId: ConceptId = 'cream_elegant'): Profile => ({
  uid,
  conceptId,
  visibility: 'public',
  heroImageUrl: '',
  heroSummary: '',
  profileImageUrl: '',
  slogan: '',
  mp3Url: '',
  mp3Autoplay: true,
  tastes: [],
  bucketList: [
    { rank: 1, label: '' },
    { rank: 2, label: '' },
    { rank: 3, label: '' },
  ],
  dreamTravel: { imageUrl: '', label: '' },
  dreamLearn: { imageUrl: '', label: '' },
  strengths: [],
  loved: [],
  happyMoments: [],
  closingText: '',
  subTagline: 'LOVE MYSELF · LIVE MY LIFE',
  updatedAt: Date.now(),
});
