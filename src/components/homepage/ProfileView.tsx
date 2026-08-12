'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getConcept } from '@/lib/concepts';
import type { Profile } from '@/lib/types';
import AudioPlayer from '../AudioPlayer';
import QrModal from '../QrModal';

/**
 * 개별 홈피 — 사진 한 장이 세로 화면을 꽉 채우고, 배경음악이 깔린다.
 *
 * 상단에 허브로 돌아가기와 QR 버튼만 얹는다.
 */
export default function ProfileView({
  profile,
  displayName,
  slug,
  preview = false,
}: {
  profile: Profile;
  displayName: string;
  slug: string;
  preview?: boolean;
  /** 아래 둘은 더 이상 쓰지 않지만 호출부 호환을 위해 남겨둔다 */
  viewerUid?: string;
  onSave?: (next: Profile) => Promise<void>;
}) {
  const accent = getConcept(profile.conceptId).vars['--c-accent'];
  const [qrOpen, setQrOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => setShareUrl(`${window.location.origin}/h/${slug}`), [slug]);

  const photo = profile.profileImageUrl || profile.heroImageUrl;

  return (
    <div className="relative mx-auto h-[100dvh] w-full max-w-frame overflow-hidden bg-black">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photo}
          alt={displayName}
          className="h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="grid h-full w-full place-items-center px-8 text-center text-[14px] text-white/70">
          아직 사진이 없습니다.
        </div>
      )}

      {!preview && (
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
          <Link
            href="/"
            className="rounded-full bg-black/40 px-3.5 py-2 text-[12px] font-semibold text-white backdrop-blur"
          >
            ← 허브로
          </Link>
          <button
            type="button"
            onClick={() => setQrOpen(true)}
            aria-label="QR 코드 만들기"
            className="rounded-full px-3.5 py-2 text-[12px] font-bold text-white shadow-md"
            style={{ background: accent }}
          >
            QR
          </button>
        </div>
      )}

      {qrOpen && (
        <QrModal
          url={shareUrl}
          title={`${displayName}님의 홈피`}
          accent={accent}
          onClose={() => setQrOpen(false)}
        />
      )}

      {!preview && profile.mp3Url && (
        <AudioPlayer
          src={profile.mp3Url}
          slug={slug}
          autoplay={profile.mp3Autoplay}
          accent={accent}
        />
      )}
    </div>
  );
}
