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
  viewerUid,
}: {
  profile: Profile;
  displayName: string;
  slug: string;
  preview?: boolean;
  /** 보고 있는 사람의 uid — 본인이면 수정 버튼을 보여준다 */
  viewerUid?: string;
  onSave?: (next: Profile) => Promise<void>;
}) {
  const isOwner = Boolean(viewerUid && viewerUid === profile.uid);
  const accent = getConcept(profile.conceptId).vars['--c-accent'];
  const [qrOpen, setQrOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => setShareUrl(`${window.location.origin}/h/${slug}`), [slug]);

  const photo = profile.profileImageUrl || profile.heroImageUrl;

  return (
    <div className="relative mx-auto min-h-[100dvh] w-full max-w-frame bg-black">
      {photo ? (
        // 올리는 이미지마다 비율이 다르다. 잘라내지 않고 폭에 맞춰 전부 보여주고,
        // 세로로 긴 지면은 스크롤해서 끝까지 읽을 수 있게 한다.
        <div className="flex min-h-[100dvh] items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo}
            alt={displayName}
            className="block h-auto w-full"
            draggable={false}
          />
        </div>
      ) : (
        <div className="grid min-h-[100dvh] w-full place-items-center px-8 text-center text-[14px] text-white/70">
          아직 사진이 없습니다.
        </div>
      )}

      {!preview && (
        <div className="fixed inset-x-0 top-0 z-30 mx-auto flex w-full max-w-frame items-center justify-between px-4 pt-4">
          <Link
            href="/"
            className="rounded-full bg-black/40 px-3.5 py-2 text-[12px] font-semibold text-white backdrop-blur"
          >
            ← 허브로
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              aria-label="QR 코드 만들기"
              className="rounded-full px-3.5 py-2 text-[12px] font-bold text-white shadow-md"
              style={{ background: accent }}
            >
              QR
            </button>
            {isOwner && (
              <Link
                href="/me"
                aria-label="내 홈피 수정하기"
                className="grid h-[30px] w-[30px] place-items-center rounded-full text-white shadow-md"
                style={{ background: accent }}
              >
                <PencilGlyph />
              </Link>
            )}
          </div>
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

function PencilGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
