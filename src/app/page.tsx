'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import HeroCarousel from '@/components/HeroCarousel';
import ThemeToggle from '@/components/ThemeToggle';
import { fetchHeroCards, fetchProfile, isProfileEmpty } from '@/lib/repo';
import type { HeroCard } from '@/lib/types';

export default function HubPage() {
  const { appUser, loading, signIn, logout, syncError } = useAuth();
  const [cards, setCards] = useState<HeroCard[] | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectChecked = useRef(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  /**
   * 홈피가 비어 있는지만 확인해 안내 버튼을 띄운다.
   *
   * 예전에는 여기서 빌더로 자동 이동시켰는데, 저장 전에는 Firestore 가 비어 있어
   * 허브로 나올 때마다 빌더로 되돌아가 빠져나갈 수 없었다.
   * 이동은 사용자가 직접 누를 때만 한다.
   */
  useEffect(() => {
    if (!appUser || redirectChecked.current) return;
    redirectChecked.current = true;
    fetchProfile(appUser.uid)
      .then((profile) => setNeedsSetup(isProfileEmpty(profile)))
      .catch((e) => console.error('프로필 확인 실패', e));
  }, [appUser]);

  useEffect(() => {
    fetchHeroCards()
      .then(setCards)
      .catch((e) => {
        console.error(e);
        setError(
          e instanceof Error && e.message ? e.message : '홈피 목록을 불러오지 못했습니다.',
        );
        setCards([]);
      });
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await signIn();
    } catch (e) {
      console.error(e);
      setError('로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSigningIn(false);
    }
  };

  const signedIn = Boolean(appUser);

  return (
    <main className="mx-auto flex h-[100dvh] w-full max-w-frame flex-col bg-hub-bg">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-5 pb-3 pt-5">
        <h1 className="text-[22px] font-bold leading-tight tracking-tight">Jocheon Heroes</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {signedIn && (
            <Link
              href="/me"
              className="rounded-full border border-hub-border bg-hub-surface px-3 py-1.5 text-[12px] font-semibold"
            >
              내 홈피
            </Link>
          )}
        </div>
      </header>

      {/* 카드 캐러셀 */}
      {cards === null ? (
        <div className="flex flex-1 items-center justify-center text-sm text-hub-muted">
          불러오는 중…
        </div>
      ) : (
        // 본인 카드를 맨 앞에 둔다. 저장하고 돌아왔을 때 바로 확인되도록.
        <HeroCarousel
          cards={
            appUser
              ? [...cards].sort(
                  (a, b) => Number(b.uid === appUser.uid) - Number(a.uid === appUser.uid),
                )
              : cards
          }
        />
      )}

      {(error || syncError) && (
        <p className="px-5 pb-2 text-center text-xs text-red-500" role="alert">
          {error ?? syncError}
        </p>
      )}

      {/* 하단 바: 로그인 전에만 로그인 버튼 노출 */}
      <div className="px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        {signedIn && needsSetup && (
          <Link
            href="/me"
            className="mb-3 block w-full rounded-2xl bg-hub-text py-3.5 text-center text-[15px] font-bold text-hub-bg"
          >
            내 홈피 만들기
          </Link>
        )}
        {loading ? null : signedIn ? (
          <div className="flex items-center justify-between text-xs text-hub-muted">
            <span>
              <b className="text-hub-text">{appUser?.displayName}</b> 님으로 로그인됨
              {appUser?.status === 'rejected' && ' · 관리자가 비공개 처리함'}
            </span>
            <div className="flex items-center gap-3">
              {appUser?.role === 'admin' && (
                <Link href="/admin" className="underline underline-offset-2">
                  관리자
                </Link>
              )}
              <button type="button" onClick={logout} className="underline underline-offset-2">
                로그아웃
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSignIn}
            disabled={signingIn}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-hub-text px-4 py-4 text-[15px] font-semibold text-hub-bg shadow-lg transition active:scale-[0.99] disabled:opacity-60"
          >
            <GoogleMark />
            {signingIn ? '로그인 중…' : 'Google로 로그인하고 내 홈피 만들기'}
          </button>
        )}
      </div>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 7.9-21l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A11.9 11.9 0 0 1 12.7 28l-6.6 5A20 20 0 0 0 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2C36.9 40.2 44 35 44 24c0-1.2-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
