'use client';

import type { Profile } from '@/lib/types';

/**
 * 매거진 커버형(ocean_magazine) 전용 레이아웃.
 *
 * 첨부 레퍼런스(RADIANT ME 매거진 스프레드)를 모바일 세로 스크롤로 옮긴 것.
 * 사진이 주인공이지만, 사진이 없는 슬롯은 활자 블록으로 대체되어 빈 칸이 보이지 않는다.
 */

const INK = '#0B2C3C';
const ACCENT = '#1B87B8';
const LINE = '#DCE7ED';
const PAPER = '#FBFAF8';

/** 프로필에 있는 모든 사진을 한 줄로 모아 슬롯에 배분한다 */
function imagePool(p: Profile): string[] {
  return [
    ...(p.gallery ?? []),
    p.dreamTravel.imageUrl,
    p.dreamLearn.imageUrl,
    ...p.strengths.map((s) => s.imageUrl),
    ...p.loved.map((l) => l.imageUrl),
    ...p.happyMoments.map((m) => m.imageUrl),
  ].filter(Boolean);
}

export default function MagazineView({
  profile,
  displayName,
}: {
  profile: Profile;
  displayName: string;
}) {
  const pool = imagePool(profile);
  const cover = profile.profileImageUrl || profile.heroImageUrl || pool[0] || '';
  const rest = pool.filter((u) => u !== cover);

  const tasteStrip = rest.slice(0, 4);
  const dreamHero = rest[4] ?? rest[0] ?? '';
  const polaroids = rest.slice(5, 8);
  const strengthShot = profile.strengths[0]?.imageUrl || rest[8] || '';
  const loveShot = profile.loved[0]?.imageUrl || rest[9] || '';
  const happyShots = rest.slice(10, 12);

  const strengths = profile.strengths.map((s) => s.caption).filter(Boolean);
  const bucket = profile.bucketList.filter((b) => b.label);

  return (
    <div className="mx-auto w-full max-w-frame" style={{ background: PAPER, color: INK }}>
      {/* ─────────── 커버 ─────────── */}
      <header className="relative h-[86vh] w-full overflow-hidden" style={{ background: INK }}>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt={displayName} className="h-full w-full object-cover" />
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(11,44,60,.92) 8%, rgba(11,44,60,.15) 45%, rgba(11,44,60,.45) 100%)',
          }}
        />

        <div className="absolute inset-x-0 top-0 px-6 pt-10">
          <h1
            className="font-serif leading-[0.88] text-white"
            style={{ fontSize: 'clamp(44px,13vw,60px)', letterSpacing: '-0.015em' }}
          >
            RADIANT
            <br />
            ME
          </h1>
          <p className="mt-3 font-serif text-[13px] italic leading-snug text-white/80">
            Live my life.
            <br />
            Love myself.
          </p>
        </div>

        <div className="absolute inset-x-0 bottom-0 px-6 pb-9">
          {profile.slogan && (
            <>
              <div className="mb-4 h-px w-8" style={{ background: 'rgba(255,255,255,.55)' }} />
              <p className="font-serif text-[19px] leading-[1.55] text-white">
                “{profile.slogan}”
              </p>
            </>
          )}
          <p className="mt-5 text-[11px] tracking-[0.34em] text-white/70">{displayName}</p>
        </div>
      </header>

      {/* ─────────── 본문 ─────────── */}
      <div className="px-6 pb-24 pt-9">
        {/* ABOUT ME + 취향 사진 스트립 */}
        <Label en="About me" />
        {profile.heroSummary && (
          <p className="mt-3 font-serif text-[16px] leading-[1.7]">{profile.heroSummary}</p>
        )}

        {tasteStrip.length > 0 && (
          <div className="mt-5 grid grid-cols-4 gap-1.5">
            {tasteStrip.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt=""
                loading="lazy"
                className="aspect-square w-full rounded-[3px] object-cover"
              />
            ))}
          </div>
        )}

        {/* 01 나의 취향 — 항목마다 사진 한 장 */}
        {profile.tastes.length > 0 && (
          <>
            <Rule />
            <Label en="Taste board" num="01" ko="나의 취향" />
            <div className="mt-4 grid grid-cols-3 gap-x-2.5 gap-y-4">
              {profile.tastes.map((t, i) => (
                <figure key={i}>
                  {t.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.imageUrl}
                      alt=""
                      loading="lazy"
                      className="aspect-square w-full rounded-[4px] object-cover"
                    />
                  ) : (
                    <span
                      className="flex aspect-square w-full items-center justify-center rounded-[4px] px-1 text-center font-serif text-[15px] leading-tight"
                      style={{ background: '#EEF3F6', color: '#5C7E8F' }}
                    >
                      {t.label}
                    </span>
                  )}
                  <figcaption className="mt-1.5">
                    {t.category && (
                      <span
                        className="block text-[9px] tracking-[0.08em]"
                        style={{ color: '#93A9B4' }}
                      >
                        {t.category.replace(/^좋아하는\s*/, '')}
                      </span>
                    )}
                    <span className="mt-px block truncate font-serif text-[13px]">{t.label}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </>
        )}

        {/* 꿈과 버킷리스트 — 큰 사진 + 폴라로이드 */}
        {(bucket.length > 0 || profile.dreamTravel.label || dreamHero) && (
          <>
            <Rule />
            <Label en="Dream & challenge" num="02" ko="나의 꿈과 도전" />

            {dreamHero && (
              <div className="relative mt-3 overflow-hidden rounded-[4px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={dreamHero} alt="" loading="lazy" className="h-52 w-full object-cover" />
                {profile.dreamTravel.label && (
                  <span
                    className="absolute inset-x-0 bottom-5 text-center font-serif text-[24px] tracking-[0.14em] text-white"
                    style={{ textShadow: '0 2px 14px rgba(0,0,0,.5)' }}
                  >
                    {profile.dreamTravel.label}
                  </span>
                )}
              </div>
            )}

            {polaroids.length > 0 && (
              <div className="-mt-8 flex justify-end gap-2 pr-1">
                {polaroids.map((src, i) => (
                  <span
                    key={i}
                    className="block bg-white p-1.5 pb-4 shadow-[0_4px_14px_rgba(11,44,60,.22)]"
                    style={{ transform: `rotate(${(i - 1) * 4}deg)` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" loading="lazy" className="h-16 w-16 object-cover" />
                  </span>
                ))}
              </div>
            )}

            <ol className="mt-6 space-y-3.5">
              {bucket.map((b) => (
                <li key={b.rank} className="flex items-baseline gap-3.5">
                  <span
                    className="font-serif text-[26px] leading-none"
                    style={{ color: '#CDDBE3' }}
                  >
                    {String(b.rank).padStart(2, '0')}
                  </span>
                  <span className="font-serif text-[16px] leading-snug">{b.label}</span>
                </li>
              ))}
            </ol>

            {(profile.dreamLearn.label || profile.childhoodDream) && (
              <div className="mt-5 space-y-3 border-l-2 pl-3.5" style={{ borderColor: ACCENT }}>
                {profile.dreamLearn.label && (
                  <Note k="배워보고 싶은 것" v={profile.dreamLearn.label} />
                )}
                {profile.childhoodDream && (
                  <Note k="어린 시절의 꿈" v={profile.childhoodDream} />
                )}
              </div>
            )}
          </>
        )}

        {/* 강점 */}
        {strengths.length > 0 && (
          <>
            <Rule />
            <Label en="Strengths" num="03" ko="나의 강점" />
            <div className="mt-3 flex gap-4">
              {strengthShot && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={strengthShot}
                  alt=""
                  loading="lazy"
                  className="h-32 w-24 shrink-0 rounded-[4px] object-cover"
                />
              )}
              <ul className="flex flex-col justify-center gap-2.5">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span
                      className="h-1 w-1 shrink-0 rounded-full"
                      style={{ background: ACCENT }}
                    />
                    <span className="font-serif text-[15px] leading-snug">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}

        {/* 사랑하는 것 */}
        {profile.loved.length > 0 && (
          <>
            <Rule />
            <Label en="Loving things" num="04" ko="내가 사랑하는 것" />
            {loveShot && (
              <div className="relative mt-3 overflow-hidden rounded-[4px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={loveShot} alt="" loading="lazy" className="h-44 w-full object-cover" />
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {profile.loved.map((l, i) => (
                <span key={i} className="font-serif text-[17px]">
                  {l.label}
                  {i < profile.loved.length - 1 && (
                    <span className="ml-5" style={{ color: '#CDDBE3' }}>
                      ·
                    </span>
                  )}
                </span>
              ))}
            </div>
          </>
        )}

        {/* 행복한 순간 */}
        {happyShots.length > 0 && (
          <>
            <Rule />
            <Label en="Happy moments" num="05" ko="나를 행복하게 하는 순간" />
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {happyShots.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={src}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/5] w-full rounded-[3px] object-cover"
                />
              ))}
            </div>
          </>
        )}

        {/* 클로징 */}
        <div className="mt-12 text-center">
          {profile.closingText && (
            <p className="font-serif text-[17px] leading-relaxed">{profile.closingText}</p>
          )}
          <div className="mx-auto my-5 h-px w-10" style={{ background: LINE }} />
          <p className="text-[9px] tracking-[0.3em]" style={{ color: '#7D97A4' }}>
            {profile.subTagline || 'LOVE MYSELF · LIVE MY LIFE'}
          </p>
          <p className="mt-1.5 text-[9px] tracking-[0.3em]" style={{ color: '#B8C9D3' }}>
            RADIANT DAYS
          </p>
        </div>
      </div>
    </div>
  );
}

function Label({ en, num, ko }: { en: string; num?: string; ko?: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      {num && (
        <span className="font-serif text-[20px] leading-none" style={{ color: '#CDDBE3' }}>
          {num}
        </span>
      )}
      {ko && <span className="font-serif text-[17px] leading-none">{ko}</span>}
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.3em]"
        style={{ color: ACCENT }}
      >
        {en}
      </span>
    </div>
  );
}

function Rule() {
  return <div className="my-7 h-px w-full" style={{ background: LINE }} />;
}

function Note({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-[10px] tracking-[0.06em]" style={{ color: '#7D97A4' }}>
        {k}
      </p>
      <p className="mt-0.5 font-serif text-[14px] leading-snug">{v}</p>
    </div>
  );
}
