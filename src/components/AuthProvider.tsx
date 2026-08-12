'use client';

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getFirebaseAuth, useMock } from '@/lib/firebase';
import { ensureUserDoc } from '@/lib/repo';
import type { AppUser } from '@/lib/types';

interface AuthCtx {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  /** Firebase 미설정(목업) 모드 여부 */
  mock: boolean;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  appUser: null,
  loading: true,
  signIn: async () => {},
  logout: async () => {},
  mock: true,
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
        } catch (e) {
          console.error('사용자 문서 준비 실패', e);
          setAppUser(null);
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
    await signInWithPopup(getFirebaseAuth(), provider);
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
    <Ctx.Provider value={{ user, appUser, loading, signIn, logout, mock: useMock }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
