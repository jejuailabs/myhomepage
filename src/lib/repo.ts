'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { getDb, useMock } from './firebase';
import { mockBySlug, mockHeroCards, MOCK_ENTRIES } from './mockData';
import type { AppUser, HeroCard, Profile, UserStatus } from './types';
import { emptyProfile } from './types';

/**
 * 데이터 접근 계층. 화면 컴포넌트는 이 모듈만 바라보면 된다.
 * NEXT_PUBLIC_USE_MOCK=true 일 때만 목업으로 동작하고, 그 외에는 항상 Firestore 를 쓴다
 * (환경변수 누락 시 가짜 데이터가 실서비스에 노출되는 것을 막기 위함).
 */

/**
 * Firestore 가 붙지 못하면(데이터베이스 미생성, 방화벽 등) SDK 는 오류 없이 무한 재시도한다.
 * 그러면 화면이 "불러오는 중…" 에서 영원히 멈추므로, 일정 시간이 지나면 명확히 실패시킨다.
 */
const CONNECT_TIMEOUT_MS = 12_000;

function withTimeout<T>(work: Promise<T>): Promise<T> {
  return Promise.race([
    work,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              'Firestore에 연결하지 못했습니다. Firebase 콘솔에서 Firestore 데이터베이스가 ' +
                '생성되어 있는지, 네트워크(사내망/VPN/방화벽)가 막고 있지 않은지 확인해 주세요.',
            ),
          ),
        CONNECT_TIMEOUT_MS,
      ),
    ),
  ]);
}

export async function fetchHeroCards(): Promise<HeroCard[]> {
  if (useMock) return mockHeroCards();
  return withTimeout(loadHeroCards());
}

async function loadHeroCards(): Promise<HeroCard[]> {
  const db = getDb();
  const usersSnap = await getDocs(
    query(collection(db, 'users'), where('status', '==', 'approved')),
  );
  const users = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }) as AppUser);
  if (users.length === 0) return [];

  const profiles = await Promise.all(
    users.map(async (u) => {
      const p = await getDoc(doc(db, 'profiles', u.uid));
      return p.exists() ? ({ uid: u.uid, ...p.data() } as Profile) : null;
    }),
  );

  return users
    .map((u, i) => {
      const p = profiles[i];
      if (!p || !p.heroImageUrl) return null;
      return {
        uid: u.uid,
        slug: u.slug,
        displayName: u.displayName,
        heroImageUrl: p.heroImageUrl,
        heroSummary: p.heroSummary,
        conceptId: p.conceptId,
        order: u.order ?? 0,
        visibility: p.visibility ?? 'public',
      } satisfies HeroCard;
    })
    .filter((c): c is HeroCard => c !== null)
    .sort((a, b) => a.order - b.order);
}

export async function fetchBySlug(
  slug: string,
): Promise<{ user: AppUser; profile: Profile } | null> {
  if (useMock) return mockBySlug(slug);
  return withTimeout(loadBySlug(slug));
}

async function loadBySlug(
  slug: string,
): Promise<{ user: AppUser; profile: Profile } | null> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, 'users'), where('slug', '==', slug), limit(1)),
  );
  if (snap.empty) return null;
  const userDoc = snap.docs[0];
  const user = { uid: userDoc.id, ...userDoc.data() } as AppUser;

  const p = await getDoc(doc(db, 'profiles', user.uid));
  if (!p.exists()) return null;
  return { user, profile: { uid: user.uid, ...p.data() } as Profile };
}

export async function fetchUser(uid: string): Promise<AppUser | null> {
  if (useMock) {
    return MOCK_ENTRIES.find((e) => e.user.uid === uid)?.user ?? null;
  }
  const snap = await getDoc(doc(getDb(), 'users', uid));
  return snap.exists() ? ({ uid, ...snap.data() } as AppUser) : null;
}

export async function fetchProfile(uid: string): Promise<Profile | null> {
  if (useMock) {
    return MOCK_ENTRIES.find((e) => e.user.uid === uid)?.profile ?? null;
  }
  const snap = await getDoc(doc(getDb(), 'profiles', uid));
  return snap.exists() ? ({ uid, ...snap.data() } as Profile) : null;
}

/** 최초 로그인 시 users/{uid} 문서를 만들어 둔다(승인 대기 상태). */
export async function ensureUserDoc(params: {
  uid: string;
  displayName: string;
  photoURL?: string;
}): Promise<AppUser> {
  const base: AppUser = {
    uid: params.uid,
    displayName: params.displayName || '이름없음',
    photoURL: params.photoURL,
    slug: makeSlug(params.uid),
    authProvider: 'google',
    role: 'member',
    status: 'pending',
    createdAt: Date.now(),
    order: 999,
  };
  if (useMock) return base;
  return withTimeout(createUserDoc(params, base));
}

async function createUserDoc(
  params: { uid: string; displayName: string; photoURL?: string },
  base: AppUser,
): Promise<AppUser> {
  const db = getDb();
  const ref = doc(db, 'users', params.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return { uid: params.uid, ...snap.data() } as AppUser;

  await setDoc(ref, { ...base, createdAt: serverTimestamp() });
  await setDoc(doc(db, 'profiles', params.uid), emptyProfile(params.uid));
  return base;
}

export async function saveProfile(uid: string, profile: Profile): Promise<void> {
  if (useMock) {
    // 목업 모드에서는 로컬 스토리지에만 저장한다(배포 전 UI 확인용).
    localStorage.setItem(`mock-profile-${uid}`, JSON.stringify(profile));
    return;
  }
  await setDoc(
    doc(getDb(), 'profiles', uid),
    { ...profile, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function updateSlug(uid: string, slug: string): Promise<void> {
  if (useMock) return;
  await updateDoc(doc(getDb(), 'users', uid), { slug });
}

/* ---------- 관리자 ---------- */

export async function fetchAllUsers(): Promise<AppUser[]> {
  if (useMock) return MOCK_ENTRIES.map((e) => e.user);
  const snap = await getDocs(collection(getDb(), 'users'));
  return snap.docs
    .map((d) => ({ uid: d.id, ...d.data() }) as AppUser)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function setUserStatus(uid: string, status: UserStatus): Promise<void> {
  if (useMock) return;
  await updateDoc(doc(getDb(), 'users', uid), { status });
}

export async function saveUserOrder(orders: { uid: string; order: number }[]): Promise<void> {
  if (useMock) return;
  const db = getDb();
  const batch = writeBatch(db);
  orders.forEach(({ uid, order }) => batch.update(doc(db, 'users', uid), { order }));
  await batch.commit();
}

/* ---------- 유틸 ---------- */

export function makeSlug(seed: string): string {
  return `m${seed.slice(0, 6).toLowerCase().replace(/[^a-z0-9]/g, '')}`;
}
