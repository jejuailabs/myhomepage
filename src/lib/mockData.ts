import type { AppUser, HeroCard, Profile } from './types';

const img = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;

interface MockEntry {
  user: AppUser;
  profile: Profile;
}

const make = (
  i: number,
  displayName: string,
  slug: string,
  conceptId: Profile['conceptId'],
  heroSummary: string,
  slogan: string,
  photo: string,
): MockEntry => ({
  user: {
    uid: `mock-${slug}`,
    displayName,
    slug,
    authProvider: 'google',
    role: i === 0 ? 'admin' : 'member',
    status: 'approved',
    createdAt: Date.now() - i * 86400000,
    order: i,
  },
  profile: {
    uid: `mock-${slug}`,
    conceptId,
    heroImageUrl: img(photo),
    heroSummary,
    profileImageUrl: img(photo, 600),
    slogan,
    mp3Url: '',
    mp3Autoplay: true,
    tastes: [
      { icon: '🍲', label: '몸국' },
      { icon: '🎬', label: '리틀 포레스트' },
      { icon: '📖', label: '아침의 피아노' },
      { icon: '🌿', label: '텃밭 가꾸기' },
      { icon: '🧭', label: 'ISFJ' },
      { icon: '☕', label: '한라봉차' },
    ],
    bucketList: [
      { rank: 1, label: '한라산 백록담까지 걸어 오르기' },
      { rank: 2, label: '내 이름으로 된 작은 책 한 권 내기' },
      { rank: 3, label: '손주와 둘이서 제주 한 바퀴' },
    ],
    dreamTravel: { imageUrl: img('photo-1506905925346-21bda4d32df4', 700), label: '스위스 알프스 마을에서 한 달 살기' },
    dreamLearn: { imageUrl: img('photo-1507838153414-b4b713384a76', 700), label: '피아노로 「아리랑」 완주하기' },
    strengths: [
      { imageUrl: img('photo-1521737604893-d14cc237f11d', 700), caption: '누구와도 십 분이면 친해지는 사람' },
      { imageUrl: img('photo-1470071459604-3b5ec3a7fe05', 700), caption: '한 번 시작하면 끝을 보는 뚝심' },
    ],
    loved: [
      { imageUrl: img('photo-1518791841217-8f162f1e1131', 600), label: '우리집 삼색이' },
      { imageUrl: img('photo-1441974231531-c6227db76b6e', 600), label: '비 온 뒤의 곶자왈' },
      { imageUrl: img('photo-1499028344343-cd173ffc68a9', 600), label: '부녀회 언니들' },
    ],
    happyMoments: [
      { imageUrl: img('photo-1504674900247-0877df9cc836', 600) },
      { imageUrl: img('photo-1470137237906-d8a4f71e1966', 600) },
      { imageUrl: img('photo-1519681393784-d120267933ba', 600) },
      { imageUrl: img('photo-1500534314209-a25ddb2bd429', 600) },
    ],
    closingText: '오늘의 나를 응원해요',
    subTagline: 'LOVE MYSELF · LIVE MY LIFE',
    updatedAt: Date.now(),
  },
});

export const MOCK_ENTRIES: MockEntry[] = [
  make(
    0,
    '김순자',
    'soonja',
    'cream_elegant',
    '조천리에서 나고 자라 예순 해. 아직도 매일 새로운 걸 배우는 중입니다.',
    '나는 나의 속도로 아름답게 피어나고 있습니다',
    'photo-1544005313-94ddf0286df2',
  ),
  make(
    1,
    '고영희',
    'younghee',
    'dark_forest',
    '삼십 년 물질하고 이제는 카메라를 듭니다. 바다는 여전히 제 스승이에요.',
    'Love myself. Live my life.',
    'photo-1494790108377-be9c29b29330',
  ),
  make(
    2,
    '부미경',
    'mikyung',
    'lavender_soft',
    '동네 아이들 이름을 다 외우는 사람. 꽃 심는 일이 제일 즐겁습니다.',
    '작은 것에도 오래 웃을 줄 아는 사람',
    'photo-1534528741775-53994a69daeb',
  ),
  make(
    3,
    '양정순',
    'jungsoon',
    'kraft_vintage',
    '사십 년 치 일기장이 제 재산입니다. 기록하는 손을 아직 멈추지 않았어요.',
    '기록하는 사람은 두 번 삽니다',
    'photo-1487412720507-e7ab37603c6f',
  ),
  make(
    4,
    '현애숙',
    'aesook',
    'ocean_magazine',
    '함덕 앞바다가 제 앞마당. 매일 아침 수영으로 하루를 엽니다.',
    '바다처럼 넓게, 파도처럼 꾸준하게',
    'photo-1524504388940-b1c1722653e1',
  ),
  make(
    5,
    '오복녀',
    'boknyeo',
    'pastel_dashboard',
    '부녀회 총무 8년차. 계획표 짜는 게 취미이자 특기입니다.',
    '오늘도 한 칸씩, 즐겁게',
    'photo-1517841905240-472988babdf9',
  ),
];

export const mockHeroCards = (): HeroCard[] =>
  MOCK_ENTRIES.map(({ user, profile }) => ({
    uid: user.uid,
    slug: user.slug,
    displayName: user.displayName,
    heroImageUrl: profile.heroImageUrl,
    heroSummary: profile.heroSummary,
    conceptId: profile.conceptId,
    order: user.order,
  })).sort((a, b) => a.order - b.order);

export const mockBySlug = (slug: string): MockEntry | null =>
  MOCK_ENTRIES.find((e) => e.user.slug === slug) ?? null;
