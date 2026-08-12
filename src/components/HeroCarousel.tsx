'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AUDIO_INTENT_KEY } from '@/lib/audioIntent';
import type { HeroCard } from '@/lib/types';

const SCROLL_KEY = 'heroes-hub-scroll';

/**
 * 세로형 히어로 카드 좌우 스와이프 캐러셀.
 * - 카드 이미지 비중 80%+, 하단에 이름 + 1~2문장 요약
 * - 카드 탭 시 개별 홈피로 이동하면서, 그 탭 제스처를 mp3 자동재생 근거로 남긴다.
 */
export default function HeroCarousel({ cards }: { cards: HeroCard[] }) {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  // 허브로 돌아왔을 때 스크롤 위치 복원
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const saved = Number(sessionStorage.getItem(SCROLL_KEY) ?? '0');
    if (saved > 0) el.scrollLeft = saved;
  }, [cards.length]);

  const onScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    sessionStorage.setItem(SCROLL_KEY, String(el.scrollLeft));
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.max(0, Math.min(cards.length - 1, idx)));
  }, [cards.length]);

  const open = useCallback(
    (card: HeroCard) => {
      // 탭 = 유저 인터랙션. 이 사실을 남겨두면 개별 홈피에서 즉시 재생을 시도할 수 있다.
      try {
        sessionStorage.setItem(AUDIO_INTENT_KEY, card.slug);
      } catch {
        /* 프라이빗 모드 등 – 무시하고 폴백 버튼으로 처리 */
      }
      router.push(`/h/${card.slug}`);
    },
    [router],
  );

  const goTo = (i: number) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  if (cards.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-base font-semibold">아직 등록된 홈피가 없어요</p>
        <p className="text-sm text-hub-muted">
          로그인 후 나만의 미니 홈페이지를 처음으로 만들어 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex flex-1 snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth"
        role="list"
        aria-label="부녀회원 홈피 카드"
      >
        {cards.map((card) => (
          <div key={card.uid} role="listitem" className="w-full shrink-0 snap-center px-5">
            <button
              type="button"
              onClick={() => open(card)}
              className="group relative flex h-full w-full flex-col overflow-hidden rounded-[28px] bg-hub-surface text-left shadow-[0_10px_40px_rgba(0,0,0,0.14)] ring-1 ring-hub-border transition-transform active:scale-[0.985]"
            >
              {/* 이미지 영역: 카드의 80% */}
              <div className="relative h-[80%] w-full overflow-hidden bg-hub-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.heroImageUrl}
                  alt={`${card.displayName} 대표 사진`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/45 to-transparent" />
                <span className="absolute bottom-4 left-5 text-[26px] font-bold tracking-tight text-white drop-shadow">
                  {card.displayName}
                </span>
                {card.visibility === 'private' && (
                  <span className="absolute right-4 top-4 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                    🔒 비공개
                  </span>
                )}
              </div>

              {/* 요약 영역 — 비공개 홈피는 사진만 두고 글은 가린다 */}
              <div className="flex h-[20%] items-center px-5">
                <p
                  className={`line-clamp-3 text-[14px] leading-relaxed text-hub-muted ${
                    card.visibility === 'private' ? 'select-none blur-[5px]' : ''
                  }`}
                  aria-hidden={card.visibility === 'private'}
                >
                  {card.heroSummary}
                </p>
                {card.visibility === 'private' && (
                  <span className="sr-only">비공개 홈피입니다</span>
                )}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* 인디케이터 */}
      <div className="flex items-center justify-center gap-2 py-4">
        {cards.map((c, i) => (
          <button
            key={c.uid}
            type="button"
            aria-label={`${i + 1}번째 카드로 이동`}
            aria-current={i === active}
            onClick={() => goTo(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === active ? 'w-6 bg-hub-text' : 'w-1.5 bg-hub-border'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
