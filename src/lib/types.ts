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
  icon: string;
  label: string;
}
export interface BucketItem {
  rank: number;
  label: string;
}
export interface ImageLabel {
  imageUrl: string;
  label: string;
}
export interface ImageCaption {
  imageUrl: string;
  caption: string;
}

/** Firestore: profiles/{uid} */
export interface Profile {
  uid: string;
  conceptId: ConceptId;

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
  strengths: ImageCaption[];
  loved: ImageLabel[];
  happyMoments: { imageUrl: string }[];

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
}

/** Firestore: settings/hub */
export interface HubSettings {
  heroTitle: string;
  cardOrderMode: 'manual' | 'createdAt';
}

export const emptyProfile = (uid: string, conceptId: ConceptId = 'cream_elegant'): Profile => ({
  uid,
  conceptId,
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
