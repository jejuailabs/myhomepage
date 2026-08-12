'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { consumeAudioIntent } from '@/lib/audioIntent';

/**
 * mp3 자동재생 처리 (docs/04 기준)
 * 1) 허브 카드 탭으로 진입 → 인터랙션 근거가 있으므로 즉시 play() 시도
 * 2) URL 직접 접속/새로고침 → 브라우저가 차단하므로 "소리 켜고 보기" 폴백 버튼 노출
 * 3) 재생 중에는 우측 하단에 아이콘만(진행바 없음) 상시 노출
 */
export default function AudioPlayer({
  src,
  slug,
  autoplay,
  accent,
}: {
  src: string;
  slug: string;
  autoplay: boolean;
  accent: string;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [needsPrompt, setNeedsPrompt] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !src || !autoplay) return;

    const cameFromTap = consumeAudioIntent(slug);
    el.play()
      .then(() => setPlaying(true))
      .catch(() => {
        // 자동재생 차단됨 → 폴백 버튼으로 유도
        setPlaying(false);
        setNeedsPrompt(true);
        if (cameFromTap) console.info('자동재생이 브라우저에 의해 차단되었습니다.');
      });
  }, [src, slug, autoplay]);

  const toggle = useCallback(async () => {
    const el = ref.current;
    if (!el) return;
    if (el.paused) {
      try {
        await el.play();
        setPlaying(true);
        setNeedsPrompt(false);
      } catch {
        setNeedsPrompt(true);
      }
    } else {
      el.pause();
      setPlaying(false);
    }
  }, []);

  if (!src) return null;

  return (
    <>
      <audio ref={ref} src={src} loop preload="auto" onEnded={() => setPlaying(false)} />

      {needsPrompt && (
        <button
          type="button"
          onClick={toggle}
          className="fixed bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full px-5 py-3 text-[13px] font-semibold text-white shadow-xl backdrop-blur"
          style={{ backgroundColor: accent }}
        >
          🔊 소리 켜고 보기
        </button>
      )}

      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? '음악 일시정지' : '음악 재생'}
        className="fixed bottom-6 right-5 z-40 grid h-11 w-11 place-items-center rounded-full text-white shadow-lg transition active:scale-95"
        style={{ backgroundColor: accent }}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
            <rect x="0" y="0" width="4" height="14" rx="1" />
            <rect x="8" y="0" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
            <path d="M0 0.8v12.4a.8.8 0 0 0 1.22.68l10-6.2a.8.8 0 0 0 0-1.36l-10-6.2A.8.8 0 0 0 0 .8z" />
          </svg>
        )}
      </button>
    </>
  );
}
