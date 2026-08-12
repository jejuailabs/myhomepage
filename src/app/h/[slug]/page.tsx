'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import ProfileView from '@/components/homepage/ProfileView';
import { fetchBySlug } from '@/lib/repo';
import type { AppUser, Profile } from '@/lib/types';

export default function HomepagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<{ user: AppUser; profile: Profile } | null | 'loading'>(
    'loading',
  );

  useEffect(() => {
    fetchBySlug(slug)
      .then(setData)
      .catch((e) => {
        console.error(e);
        setData(null);
      });
  }, [slug]);

  if (data === 'loading') {
    return (
      <main className="grid min-h-[100dvh] place-items-center text-sm text-hub-muted">
        불러오는 중…
      </main>
    );
  }

  if (!data) {
    return (
      <main className="mx-auto grid min-h-[100dvh] max-w-frame place-items-center px-8 text-center">
        <div>
          <p className="text-base font-semibold">홈피를 찾을 수 없어요</p>
          <p className="mt-1.5 text-sm text-hub-muted">
            주소가 바뀌었거나 아직 공개되지 않은 홈피입니다.
          </p>
          <Link
            href="/"
            className="mt-5 inline-block rounded-full bg-hub-text px-5 py-2.5 text-sm font-semibold text-hub-bg"
          >
            허브로 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main>
      <ProfileView profile={data.profile} displayName={data.user.displayName} slug={slug} />
    </main>
  );
}
