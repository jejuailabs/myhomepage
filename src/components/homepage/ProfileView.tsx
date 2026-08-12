'use client';

import Link from 'next/link';
import { getConcept } from '@/lib/concepts';
import type { Profile } from '@/lib/types';
import AudioPlayer from '../AudioPlayer';
import { SKINS } from './skins';

/**
 * 개별 홈피 렌더러.
 * 섹션 구조(프로필 / 01 취향 / 02 꿈과 도전 / 03 강점 / 04 사랑하는 것 / 05 행복한 순간 / 클로징)는
 * 6종 컨셉 공통이고, 컨셉별로 달라지는 것은 skins.ts 의 시각 스킨뿐이다.
 * 다크/라이트 토글은 이 화면에 적용되지 않는다(컨셉 고유 팔레트 고정).
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
}) {
  const concept = getConcept(profile.conceptId);
  const skin = SKINS[concept.id];
  const v = concept.vars;

  return (
    <div
      className={`relative mx-auto min-h-[100dvh] w-full max-w-frame ${skin.pageClass}`}
      style={{ background: skin.pageBg, color: v['--c-text'] }}
    >
      {!preview && (
        <Link
          href="/"
          className="fixed left-1/2 top-4 z-40 -ml-[240px] max-[520px]:left-4 max-[520px]:ml-0 rounded-full px-3.5 py-2 text-[12px] font-semibold shadow-md backdrop-blur"
          style={{ background: v['--c-surface'], color: v['--c-text'] }}
        >
          ← 허브로
        </Link>
      )}

      {/* ── 프로필 헤더 ── */}
      <Hero profile={profile} displayName={displayName} />

      <div className="space-y-7 px-5 pb-28 pt-8">
        {/* 01 나의 취향 */}
        {profile.tastes.length > 0 && (
          <Section num="01" title="나의 취향" skin={skin}>
            <div className="grid grid-cols-3 gap-2.5">
              {profile.tastes.map((t, i) => (
                <div
                  key={`${t.label}-${i}`}
                  className={`${skin.card} flex flex-col items-center gap-1.5 px-2 py-4`}
                >
                  <span className="text-[22px] leading-none">{t.icon || '✦'}</span>
                  <span className="text-center text-[12px] leading-tight opacity-80">
                    {t.label}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 02 나의 꿈과 도전 */}
        {(profile.bucketList.some((b) => b.label) ||
          profile.dreamTravel.label ||
          profile.dreamLearn.label) && (
          <Section num="02" title="나의 꿈과 도전" skin={skin}>
            <ol className={`${skin.card} divide-y px-4`} style={{ borderColor: v['--c-line'] }}>
              {profile.bucketList
                .filter((b) => b.label)
                .map((b) => (
                  <li key={b.rank} className="flex items-center gap-3 py-3.5">
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white"
                      style={{ background: v['--c-accent'] }}
                    >
                      {b.rank}
                    </span>
                    <span className="text-[14px] leading-snug">{b.label}</span>
                  </li>
                ))}
            </ol>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <DreamCard label="가고 싶은 여행지" item={profile.dreamTravel} skin={skin} />
              <DreamCard label="배워보고 싶은 것" item={profile.dreamLearn} skin={skin} />
            </div>
          </Section>
        )}

        {/* 03 나의 강점 */}
        {profile.strengths.length > 0 && (
          <Section num="03" title="나의 강점" skin={skin}>
            <div className="space-y-3">
              {profile.strengths.map((s, i) => (
                <figure
                  key={i}
                  className={`${skin.card} overflow-hidden ${skin.tilt ? (i % 2 ? '-rotate-1' : 'rotate-1') : ''}`}
                >
                  {s.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.imageUrl}
                      alt=""
                      className="h-44 w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <figcaption className="px-4 py-3 text-[14px] leading-snug">
                    {s.caption}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Section>
        )}

        {/* 04 내가 사랑하는 것 */}
        {profile.loved.length > 0 && (
          <Section num="04" title="내가 사랑하는 것" skin={skin}>
            <div className="no-scrollbar -mx-5 flex snap-x gap-3 overflow-x-auto px-5">
              {profile.loved.map((l, i) => (
                <figure key={i} className="w-[46%] shrink-0 snap-start">
                  {l.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={l.imageUrl}
                      alt=""
                      className={`h-40 w-full object-cover ${skin.imageFrame}`}
                      loading="lazy"
                    />
                  )}
                  <figcaption className="mt-2 text-center text-[13px] opacity-80">
                    {l.label}
                  </figcaption>
                </figure>
              ))}
            </div>
          </Section>
        )}

        {/* 05 나를 행복하게 하는 순간 */}
        {profile.happyMoments.length > 0 && (
          <Section num="05" title="나를 행복하게 하는 순간" skin={skin}>
            <div className="grid grid-cols-2 gap-2.5">
              {profile.happyMoments.map((m, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={m.imageUrl}
                  alt=""
                  loading="lazy"
                  className={`aspect-square w-full object-cover ${skin.imageFrame} ${
                    skin.tilt ? (i % 2 ? 'rotate-2' : '-rotate-2') : ''
                  }`}
                />
              ))}
            </div>
          </Section>
        )}

        {/* 클로징 */}
        <footer className="pt-6 text-center">
          <p className={skin.slogan}>{profile.closingText}</p>
          <p
            className="mt-3 text-[11px] tracking-[0.35em]"
            style={{ color: v['--c-muted'] }}
          >
            {profile.subTagline}
          </p>
        </footer>
      </div>

      {!preview && profile.mp3Url && (
        <AudioPlayer
          src={profile.mp3Url}
          slug={slug}
          autoplay={profile.mp3Autoplay}
          accent={v['--c-accent']}
        />
      )}
    </div>
  );

  /* ── 컨셉별 프로필 헤더 ── */
  function Hero({ profile: p, displayName: name }: { profile: Profile; displayName: string }) {
    const photo = p.profileImageUrl || p.heroImageUrl;

    if (skin.hero === 'cover') {
      // 오션 매거진: 풀블리드 커버
      return (
        <header className="relative h-[62vh] w-full overflow-hidden">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={name} className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B2C3C]/70 via-transparent to-[#0B2C3C]/25" />
          <div className="absolute inset-x-0 top-6 text-center">
            <span className="text-[30px] font-black uppercase tracking-[0.18em] text-white">
              Radiant Me
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-6 px-6 text-white">
            <h1 className="text-[30px] font-black tracking-tight">{name}</h1>
            <p className="mt-1.5 text-[15px] leading-relaxed opacity-90">{p.slogan}</p>
          </div>
        </header>
      );
    }

    if (skin.hero === 'polaroid') {
      // 크래프트 빈티지: 종이 위 폴라로이드
      return (
        <header className="px-6 pt-16 text-center">
          <div className="mx-auto w-[74%] -rotate-2 bg-white p-3 pb-10 shadow-[4px_6px_14px_rgba(70,53,34,0.28)]">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt={name} className="aspect-[4/5] w-full object-cover" />
            )}
          </div>
          <h1 className="mt-6 font-hand text-[34px] leading-none">{name}</h1>
          <p className={`mt-2 ${skin.slogan}`}>{p.slogan}</p>
        </header>
      );
    }

    if (skin.hero === 'badge') {
      // 다크 포레스트: 넘버 배지 + 이탤릭 세리프
      return (
        <header className="px-6 pt-16">
          <span
            className="inline-block rounded-full px-3 py-1 font-serif text-[11px] italic tracking-[0.3em]"
            style={{ border: `1px solid ${v['--c-accent']}`, color: v['--c-accent'] }}
          >
            RADIANT ME
          </span>
          <div className="mt-5 flex items-end gap-4">
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={name}
                className={`h-40 w-32 shrink-0 object-cover ${skin.imageFrame}`}
              />
            )}
            <div className="pb-1">
              <h1 className="font-serif text-[26px] leading-tight">{name}</h1>
              <p className={`mt-2 ${skin.slogan}`}>{p.slogan}</p>
            </div>
          </div>
        </header>
      );
    }

    if (skin.hero === 'framed') {
      // 라벤더: 꽃 프레임
      return (
        <header className="relative px-6 pt-16 text-center">
          <span className="pointer-events-none absolute left-3 top-8 text-[44px] opacity-70">
            🌸
          </span>
          <span className="pointer-events-none absolute right-4 top-24 text-[30px] opacity-60">
            💜
          </span>
          <span className="pointer-events-none absolute bottom-2 left-8 text-[26px] opacity-50">
            🌷
          </span>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={name}
              className="mx-auto aspect-[4/5] w-[62%] rounded-[120px_120px_28px_28px] object-cover shadow-[0_10px_30px_rgba(122,90,170,0.25)]"
            />
          )}
          <h1 className="mt-5 text-[24px] font-bold">{name}</h1>
          <p className={`mt-2 ${skin.slogan}`}>{p.slogan}</p>
        </header>
      );
    }

    if (skin.hero === 'dashboard') {
      // 파스텔 대시보드: 위젯 카드형 헤더
      return (
        <header className="px-5 pt-16">
          <div className={`${skin.card} flex items-center gap-4 p-4`}>
            {photo && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt={name}
                className="h-24 w-20 shrink-0 rounded-[18px] object-cover"
              />
            )}
            <div>
              <h1 className="text-[22px] font-extrabold">{name}</h1>
              <p className={`mt-1.5 ${skin.slogan}`}>{p.slogan}</p>
            </div>
          </div>
        </header>
      );
    }

    // cream_elegant: 좌측 인물 + 우측 텍스트
    return (
      <header className="flex items-center gap-4 px-6 pt-16">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={name}
            className="h-44 w-32 shrink-0 rounded-2xl object-cover shadow-[0_8px_24px_rgba(90,74,58,0.2)]"
          />
        )}
        <div>
          <span className="font-serif text-[11px] tracking-[0.35em]" style={{ color: v['--c-accent'] }}>
            RADIANT ME
          </span>
          <h1 className="mt-1.5 font-serif text-[25px] leading-tight">{name}</h1>
          <p className={`mt-2 ${skin.slogan}`}>{p.slogan}</p>
        </div>
      </header>
    );
  }
}

function Section({
  num,
  title,
  skin,
  children,
}: {
  num: string;
  title: string;
  skin: (typeof SKINS)[keyof typeof SKINS];
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <span className={skin.numberLabel}>{num}</span>
        <h2 className={skin.sectionTitle}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function DreamCard({
  label,
  item,
  skin,
}: {
  label: string;
  item: { imageUrl: string; label: string };
  skin: (typeof SKINS)[keyof typeof SKINS];
}) {
  if (!item.label && !item.imageUrl) return null;
  return (
    <figure className={`${skin.card} overflow-hidden`}>
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="h-28 w-full object-cover" loading="lazy" />
      )}
      <figcaption className="px-3 py-2.5">
        <span className="block text-[10px] uppercase tracking-[0.2em] opacity-60">{label}</span>
        <span className="mt-1 block text-[13px] leading-snug">{item.label}</span>
      </figcaption>
    </figure>
  );
}
