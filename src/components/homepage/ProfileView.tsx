'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getConcept } from '@/lib/concepts';
import type { Profile } from '@/lib/types';
import AudioPlayer from '../AudioPlayer';
import QrModal from '../QrModal';
import { SKINS, type Skin } from './skins';

/**
 * 개별 홈피 렌더러.
 * 섹션 구조(프로필 / 01 취향 / 02 꿈과 도전 / 03 강점 / 04 사랑하는 것 / 05 행복한 순간 / 클로징)는
 * 6종 컨셉 공통이고, 컨셉별로 달라지는 것은 skins.ts 의 시각 스킨뿐이다.
 * 다크/라이트 토글은 이 화면에 적용되지 않는다(컨셉 고유 팔레트 고정).
 *
 * 추가 동작
 * - 비공개(private) 홈피는 사진은 그대로 두고 텍스트만 블러 처리한다. 본인은 원본을 본다.
 * - 본인이 보는 경우 텍스트 항목을 이 화면에서 바로 고칠 수 있다(이미지/음악은 /me 에서).
 * - 상단 QR 버튼으로 QR 코드 + 퍼가기 주소 화면을 띄운다.
 */
export default function ProfileView({
  profile,
  displayName,
  slug,
  preview = false,
  viewerUid,
  onSave,
}: {
  profile: Profile;
  displayName: string;
  slug: string;
  preview?: boolean;
  viewerUid?: string;
  onSave?: (next: Profile) => Promise<void>;
}) {
  const concept = getConcept(profile.conceptId);
  const skin = SKINS[concept.id];
  const v = concept.vars;

  const [qrOpen, setQrOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);
  const [saving, setSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  /**
   * 편집 모드를 드나들 때마다 증가시킨다.
   * contentEditable 은 DOM 을 직접 고치므로, 이 값을 key 로 써서 노드를 새로 마운트해야
   * 취소했을 때 원래 글자가 확실히 돌아온다.
   */
  const [session, setSession] = useState(0);

  useEffect(() => setDraft(profile), [profile]);
  useEffect(() => setShareUrl(`${window.location.origin}/h/${slug}`), [slug]);

  const isOwner = Boolean(viewerUid && viewerUid === profile.uid);
  const canEdit = isOwner && !preview && Boolean(onSave);
  /** 비공개 홈피를 남이 볼 때만 텍스트를 가린다 */
  const masked = profile.visibility === 'private' && !isOwner;

  const p = editing ? draft : profile;
  const set = (part: Partial<Profile>) => setDraft((prev) => ({ ...prev, ...part }));

  const startEdit = () => {
    setDraft(profile);
    setSession((s) => s + 1);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraft(profile);
    setSession((s) => s + 1);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(draft);
      setSession((s) => s + 1);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const t = { editing, masked, session };

  return (
    <div
      className={`relative mx-auto min-h-[100dvh] w-full max-w-frame ${skin.pageClass}`}
      style={{ background: skin.pageBg, color: v['--c-text'] }}
    >
      {!preview && (
        <div className="fixed top-4 z-40 flex w-full max-w-frame items-center justify-between px-4">
          <Link
            href="/"
            className="rounded-full px-3.5 py-2 text-[12px] font-semibold shadow-md backdrop-blur"
            style={{ background: v['--c-surface'], color: v['--c-text'] }}
          >
            ← 허브로
          </Link>

          <div className="flex items-center gap-2">
            {canEdit && !editing && (
              <button
                type="button"
                onClick={startEdit}
                className="rounded-full px-3.5 py-2 text-[12px] font-semibold shadow-md backdrop-blur"
                style={{ background: v['--c-surface'], color: v['--c-text'] }}
              >
                ✏️ 글 고치기
              </button>
            )}
            <button
              type="button"
              onClick={() => setQrOpen(true)}
              aria-label="QR 코드 만들기"
              className="flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold text-white shadow-md"
              style={{ background: v['--c-accent'] }}
            >
              <QrGlyph />
              QR
            </button>
          </div>
        </div>
      )}

      {/* 비공개 안내 */}
      {p.visibility === 'private' && (
        <div className="px-5 pt-[68px]">
          <p
            className="rounded-xl px-3.5 py-2.5 text-[12px] leading-snug"
            style={{ background: v['--c-surface'], color: v['--c-muted'] }}
          >
            {isOwner
              ? '🔒 비공개 홈피예요. 다른 사람에게는 사진만 보이고 글은 흐릿하게 가려집니다.'
              : '🔒 비공개 홈피예요. 글 내용은 본인만 볼 수 있습니다.'}
          </p>
        </div>
      )}

      {/* ── 프로필 헤더 ── */}
      <Hero
        profile={p}
        displayName={displayName}
        skin={skin}
        vars={v}
        t={t}
        onSlogan={(value) => set({ slogan: value })}
        topPad={p.visibility === 'private' ? 'pt-5' : 'pt-16'}
      />

      <div className="space-y-7 px-5 pb-28 pt-8">
        {/* 01 나의 취향 */}
        {(editing || p.tastes.length > 0) && (
          <Section num="01" title="나의 취향" skin={skin}>
            <div className="grid grid-cols-3 gap-2.5">
              {p.tastes.map((item, i) => (
                <div
                  key={i}
                  className={`${skin.card} flex flex-col items-center gap-1.5 px-2 py-4`}
                >
                  <span className="text-[22px] leading-none">{item.icon || '✦'}</span>
                  <Txt
                    {...t}
                    value={item.label}
                    className="text-center text-[12px] leading-tight opacity-80"
                    onChange={(value) => {
                      const next = [...draft.tastes];
                      next[i] = { ...item, label: value };
                      set({ tastes: next });
                    }}
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* 02 나의 꿈과 도전 */}
        {(editing ||
          p.bucketList.some((b) => b.label) ||
          p.dreamTravel.label ||
          p.dreamLearn.label) && (
          <Section num="02" title="나의 꿈과 도전" skin={skin}>
            <ol className={`${skin.card} divide-y px-4`} style={{ borderColor: v['--c-line'] }}>
              {p.bucketList
                .filter((b) => editing || b.label)
                .map((b) => {
                  const idx = p.bucketList.indexOf(b);
                  return (
                    <li key={b.rank} className="flex items-center gap-3 py-3.5">
                      <span
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-bold text-white"
                        style={{ background: v['--c-accent'] }}
                      >
                        {b.rank}
                      </span>
                      <Txt
                        {...t}
                        value={b.label}
                        className="text-[14px] leading-snug"
                        placeholder="이루고 싶은 일"
                        onChange={(value) => {
                          const next = [...draft.bucketList];
                          next[idx] = { ...b, label: value };
                          set({ bucketList: next });
                        }}
                      />
                    </li>
                  );
                })}
            </ol>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <DreamCard
                label="가고 싶은 여행지"
                item={p.dreamTravel}
                skin={skin}
                t={t}
                onChange={(value) => set({ dreamTravel: { ...draft.dreamTravel, label: value } })}
              />
              <DreamCard
                label="배워보고 싶은 것"
                item={p.dreamLearn}
                skin={skin}
                t={t}
                onChange={(value) => set({ dreamLearn: { ...draft.dreamLearn, label: value } })}
              />
            </div>
          </Section>
        )}

        {/* 03 나의 강점 */}
        {p.strengths.length > 0 && (
          <Section num="03" title="나의 강점" skin={skin}>
            <div className="space-y-3">
              {p.strengths.map((s, i) => (
                <figure
                  key={i}
                  className={`${skin.card} overflow-hidden ${
                    skin.tilt ? (i % 2 ? '-rotate-1' : 'rotate-1') : ''
                  }`}
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
                  <figcaption className="px-4 py-3">
                    <Txt
                      {...t}
                      value={s.caption}
                      className="text-[14px] leading-snug"
                      placeholder="짧은 설명"
                      onChange={(value) => {
                        const next = [...draft.strengths];
                        next[i] = { ...s, caption: value };
                        set({ strengths: next });
                      }}
                    />
                  </figcaption>
                </figure>
              ))}
            </div>
          </Section>
        )}

        {/* 04 내가 사랑하는 것 */}
        {p.loved.length > 0 && (
          <Section num="04" title="내가 사랑하는 것" skin={skin}>
            <div className="no-scrollbar -mx-5 flex snap-x gap-3 overflow-x-auto px-5">
              {p.loved.map((l, i) => (
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
                  <figcaption className="mt-2 text-center">
                    <Txt
                      {...t}
                      value={l.label}
                      className="text-[13px] opacity-80"
                      placeholder="라벨"
                      onChange={(value) => {
                        const next = [...draft.loved];
                        next[i] = { ...l, label: value };
                        set({ loved: next });
                      }}
                    />
                  </figcaption>
                </figure>
              ))}
            </div>
          </Section>
        )}

        {/* 05 나를 행복하게 하는 순간 */}
        {p.happyMoments.length > 0 && (
          <Section num="05" title="나를 행복하게 하는 순간" skin={skin}>
            <div className="grid grid-cols-2 gap-2.5">
              {p.happyMoments.map((m, i) => (
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
          <Txt
            {...t}
            value={p.closingText}
            className={skin.slogan}
            placeholder="마무리 문구"
            onChange={(value) => set({ closingText: value })}
          />
          <div className="mt-3">
            <Txt
              {...t}
              value={p.subTagline}
              className="text-[11px] tracking-[0.35em]"
              style={{ color: v['--c-muted'] }}
              placeholder="서브 태그라인"
              onChange={(value) => set({ subTagline: value })}
            />
          </div>
        </footer>
      </div>

      {/* 편집 바 */}
      {editing && (
        <div
          className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-frame gap-2 border-t px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3"
          style={{ background: v['--c-surface'], borderColor: v['--c-line'] }}
        >
          <button
            type="button"
            onClick={cancelEdit}
            className="flex-1 rounded-2xl py-3.5 text-[14px] font-bold"
            style={{ background: v['--c-line'], color: v['--c-text'] }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-[2] rounded-2xl py-3.5 text-[14px] font-bold text-white disabled:opacity-60"
            style={{ background: v['--c-accent'] }}
          >
            {saving ? '저장 중…' : '저장하기'}
          </button>
        </div>
      )}

      {qrOpen && (
        <QrModal
          url={shareUrl}
          title={`${displayName}님의 홈피`}
          accent={v['--c-accent']}
          onClose={() => setQrOpen(false)}
        />
      )}

      {!preview && !editing && p.mp3Url && (
        <AudioPlayer
          src={p.mp3Url}
          slug={slug}
          autoplay={p.mp3Autoplay}
          accent={v['--c-accent']}
        />
      )}
    </div>
  );
}

/* ── 텍스트 한 조각: 블러 마스킹 + 인라인 편집 담당 ── */

interface TxtFlags {
  editing: boolean;
  masked: boolean;
  session: number;
}

function Txt({
  value,
  onChange,
  editing,
  masked,
  session,
  className = '',
  style,
  placeholder,
}: TxtFlags & {
  value: string;
  onChange?: (value: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}) {
  if (masked) {
    return (
      <>
        <span
          aria-hidden="true"
          className={`${className} inline-block select-none blur-[5px]`}
          style={style}
        >
          {value || '비공개'}
        </span>
        <span className="sr-only">비공개 내용입니다</span>
      </>
    );
  }

  if (!editing || !onChange) {
    return (
      <span key={`v${session}`} className={className} style={style}>
        {value}
      </span>
    );
  }

  return (
    <span
      // 편집 세션이 바뀌면 새 노드로 마운트해 DOM 과 상태가 어긋나지 않게 한다
      key={`e${session}`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      tabIndex={0}
      aria-label={placeholder ?? '내용 수정'}
      // 입력할 때마다 즉시 반영한다. 렌더 결과가 DOM 과 같은 문자열이라
      // React 가 DOM 을 다시 쓰지 않으므로 커서 위치도 유지된다.
      onInput={(e) => onChange(e.currentTarget.textContent ?? '')}
      onBlur={(e) => onChange(e.currentTarget.textContent?.trim() ?? '')}
      className={`${className} inline-block min-w-[2.5rem] rounded-md px-1 outline outline-1 outline-dashed outline-current/40 focus:outline-current`}
      style={style}
    >
      {value}
    </span>
  );
}

/* ── 컨셉별 프로필 헤더 ── */

function Hero({
  profile: p,
  displayName: name,
  skin,
  vars: v,
  t,
  onSlogan,
  topPad,
}: {
  profile: Profile;
  displayName: string;
  skin: Skin;
  vars: Record<string, string>;
  t: TxtFlags;
  onSlogan: (value: string) => void;
  topPad: string;
}) {
  const photo = p.profileImageUrl || p.heroImageUrl;
  const slogan = (
    <Txt {...t} value={p.slogan} className={skin.slogan} placeholder="슬로건" onChange={onSlogan} />
  );

  if (skin.hero === 'cover') {
    // 오션 매거진: 풀블리드 커버
    return (
      <header className="relative h-[62vh] w-full overflow-hidden">
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={name} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B2C3C]/70 via-transparent to-[#0B2C3C]/25" />
        <div className="absolute inset-x-0 top-20 text-center">
          <span className="text-[30px] font-black uppercase tracking-[0.18em] text-white">
            Radiant Me
          </span>
        </div>
        <div className="absolute inset-x-0 bottom-6 px-6 text-white">
          <h1 className="text-[30px] font-black tracking-tight">{name}</h1>
          <p className="mt-1.5 opacity-90">{slogan}</p>
        </div>
      </header>
    );
  }

  if (skin.hero === 'polaroid') {
    // 크래프트 빈티지: 종이 위 폴라로이드
    return (
      <header className={`px-6 text-center ${topPad}`}>
        <div className="mx-auto w-[74%] -rotate-2 bg-white p-3 pb-10 shadow-[4px_6px_14px_rgba(70,53,34,0.28)]">
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt={name} className="aspect-[4/5] w-full object-cover" />
          )}
        </div>
        <h1 className="mt-6 font-hand text-[34px] leading-none">{name}</h1>
        <p className="mt-2">{slogan}</p>
      </header>
    );
  }

  if (skin.hero === 'badge') {
    // 다크 포레스트: 넘버 배지 + 이탤릭 세리프
    return (
      <header className={`px-6 ${topPad}`}>
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
            <p className="mt-2">{slogan}</p>
          </div>
        </div>
      </header>
    );
  }

  if (skin.hero === 'framed') {
    // 라벤더: 꽃 프레임
    return (
      <header className={`relative px-6 text-center ${topPad}`}>
        <span className="pointer-events-none absolute left-3 top-8 text-[44px] opacity-70">🌸</span>
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
        <p className="mt-2">{slogan}</p>
      </header>
    );
  }

  if (skin.hero === 'dashboard') {
    // 파스텔 대시보드: 위젯 카드형 헤더
    return (
      <header className={`px-5 ${topPad}`}>
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
            <p className="mt-1.5">{slogan}</p>
          </div>
        </div>
      </header>
    );
  }

  // cream_elegant: 좌측 인물 + 우측 텍스트
  return (
    <header className={`flex items-center gap-4 px-6 ${topPad}`}>
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
        <p className="mt-2">{slogan}</p>
      </div>
    </header>
  );
}

function Section({
  num,
  title,
  skin,
  children,
}: {
  num: string;
  title: string;
  skin: Skin;
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
  t,
  onChange,
}: {
  label: string;
  item: { imageUrl: string; label: string };
  skin: Skin;
  t: TxtFlags;
  onChange: (value: string) => void;
}) {
  if (!t.editing && !item.label && !item.imageUrl) return null;
  return (
    <figure className={`${skin.card} overflow-hidden`}>
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="h-28 w-full object-cover" loading="lazy" />
      )}
      <figcaption className="px-3 py-2.5">
        <span className="block text-[10px] uppercase tracking-[0.2em] opacity-60">{label}</span>
        <span className="mt-1 block">
          <Txt {...t} value={item.label} className="text-[13px] leading-snug" onChange={onChange} />
        </span>
      </figcaption>
    </figure>
  );
}

function QrGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm8-2h3v3h-3v-3zm5 0h3v3h-3v-3zm-5 5h3v3h-3v-3zm5 0h3v3h-3v-3z" />
    </svg>
  );
}
