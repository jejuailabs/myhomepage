'use client';

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth, useMock } from '@/lib/firebase';
import { ensureUserDoc, makeSlug } from '@/lib/repo';
import type { AppUser } from '@/lib/types';

interface AuthCtx {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  /** Firebase 미설정(목업) 모드 여부 */
  mock: boolean;
  /** 로그인은 됐지만 Firestore 동기화가 실패했을 때의 안내 문구 */
  syncError: string | null;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  appUser: null,
  loading: true,
  signIn: async () => {},
  logout: async () => {},
  mock: true,
  syncError: null,
});

const MOCK_KEY = 'heroes-mock-signed-in';

const MOCK_APP_USER: AppUser = {
  uid: 'mock-soonja',
  displayName: '김순자',
  slug: 'soonja',
  authProvider: 'google',
  role: 'admin',
  status: 'approved',
  createdAt: Date.now(),
  order: 0,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    if (useMock) {
      // 목업 모드: 로그인 상태만 localStorage 로 흉내내어 UI 흐름을 확인한다.
      const signedIn = localStorage.getItem(MOCK_KEY) === '1';
      setAppUser(signedIn ? MOCK_APP_USER : null);
      setUser(signedIn ? ({ uid: MOCK_APP_USER.uid, displayName: MOCK_APP_USER.displayName } as User) : null);
      setLoading(false);
      return;
    }

    return onAuthStateChanged(getFirebaseAuth(), async (u) => {
      setUser(u);
      if (u) {
        try {
          setAppUser(
            await ensureUserDoc({
              uid: u.uid,
              displayName: u.displayName ?? '',
              photoURL: u.photoURL ?? undefined,
            }),
          );
          setSyncError(null);
        } catch (e) {
          // Firestore 연결 실패로 로그인 자체를 무효화하면 안 된다.
          // 인증은 이미 끝났으므로 화면은 로그인 상태로 두고, 프로필 동기화만 실패로 알린다.
          console.error('사용자 문서 준비 실패', e);
          setAppUser({
            uid: u.uid,
            displayName: u.displayName ?? '이름없음',
            photoURL: u.photoURL ?? undefined,
            slug: makeSlug(u.uid),
            authProvider: 'google',
            role: 'member',
            status: 'pending',
            createdAt: Date.now(),
            order: 999,
          });
          setSyncError(
            e instanceof Error && e.message.includes('offline')
              ? 'Firestore에 연결하지 못했습니다. 네트워크(사내망/VPN/방화벽)를 확인해 주세요.'
              : '프로필 정보를 불러오지 못했습니다.',
          );
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async () => {
    if (useMock) {
      localStorage.setItem(MOCK_KEY, '1');
      setAppUser(MOCK_APP_USER);
      setUser({ uid: MOCK_APP_USER.uid, displayName: MOCK_APP_USER.displayName } as User);
      return;
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(getFirebaseAuth(), provider);
    } catch (e) {
      // 팝업 차단·COOP·인앱 브라우저 등으로 팝업이 막히면 리다이렉트 방식으로 넘어간다.
      const code = (e as { code?: string }).code ?? '';
      const popupBlocked =
        code.includes('popup-blocked') ||
        code.includes('popup-closed-by-user') ||
        code.includes('cancelled-popup-request') ||
        code.includes('operation-not-supported');
      if (!popupBlocked) throw e;
      await signInWithRedirect(getFirebaseAuth(), provider);
    }
  }, []);

  const logout = useCallback(async () => {
    if (useMock) {
      localStorage.removeItem(MOCK_KEY);
      setAppUser(null);
      setUser(null);
      return;
    }
    await signOut(getFirebaseAuth());
  }, []);

  return (
    <Ctx.Provider value={{ user, appUser, loading, signIn, logout, mock: useMock, syncError }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
