'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import ProfileView from '@/components/homepage/ProfileView';
import ThemeToggle from '@/components/ThemeToggle';
import { applyBasics, basicAnswers, BASIC_FIELDS } from '@/lib/basics';
import { fetchProfile, saveProfile } from '@/lib/repo';
import { emptyProfile, type Profile } from '@/lib/types';
import { uploadFile, uploadGenerated } from '@/lib/upload';

/**
 * 넣는 것은 둘뿐이다 — 사진 한 장, 음악 한 곡.
 * 홈피는 그 사진이 세로 화면을 꽉 채우고 음악이 깔리는 형태다.
 *
 * 질문 20개와 답변별 사진 생성 코드(lib/questions.ts, api/imagery,
 * components/editor/GenerateImagery.tsx)는 저장소에 그대로 두었다.
 */
export default function MyPage() {
  const { appUser, loading, signIn } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** 사진 생성은 화면 맨 위에서 도는데 저장 버튼은 맨 아래라, 진행 상황이 안 보인다 */
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!appUser) return;
    fetchProfile(appUser.uid)
      .then((p) => setProfile(p ?? emptyProfile(appUser.uid)))
      .catch(() => setProfile(emptyProfile(appUser.uid)));
  }, [appUser]);

  const patch = useCallback(
    (part: Partial<Profile>) => setProfile((prev) => (prev ? { ...prev, ...part } : prev)),
    [],
  );

  /**
   * 사진·음악처럼 시간이 걸리는 작업이 끝나면 곧바로 저장한다.
   * 저장을 안 누른 채 허브로 나가면 올린 사진이 통째로 날아갔다.
   */
  const autoSave = useCallback(
    async (next: Partial<Profile>) => {
      if (!appUser) return;
      setProfile((prev) => {
        if (!prev) return prev;
        const merged = { ...prev, ...next };
        void saveProfile(appUser.uid, merged).catch((e) =>
          console.error('자동 저장 실패', e),
        );
        return merged;
      });
    },
    [appUser],
  );

  /** 이미지에서 읽어온 항목을 채운다. 이미 적어 둔 값은 덮어쓰지 않는다. */
  const applyExtracted = useCallback(
    (fields: Record<string, string>, summary: string) => {
      setProfile((prev) => {
        if (!prev) return prev;
        const current = basicAnswers(prev.tastes);
        const merged = { ...current };
        for (const [key, value] of Object.entries(fields)) {
          if (value && !current[key]) merged[key] = value;
        }
        const next = {
          ...prev,
          tastes: applyBasics(prev, merged),
          heroSummary: prev.heroSummary || summary,
        };
        if (appUser) {
          void saveProfile(appUser.uid, next).catch((e) => console.error('자동 저장 실패', e));
        }
        return next;
      });
    },
    [appUser],
  );

  const handleSave = async () => {
    if (!appUser || !profile) return;

    // 아직 사진을 만드는 중이면 그 자리로 올려서 진행 상황을 보여준다
    if (photoBusy) {
      // 부드러운 스크롤 대신 즉시 이동한다. 기다리게 하지 않는 것이 목적이고,
      // 애니메이션 도중에는 진행 상황이 여전히 안 보인다.
      photoRef.current?.scrollIntoView({ block: 'center' });
      setToast('인물 사진을 만드는 중입니다. 끝나면 저장해 주세요.');
      setTimeout(() => setToast(null), 4000);
      return;
    }

    setSaving(true);
    try {
      await saveProfile(appUser.uid, profile);
      setToast('저장했습니다. 허브에 반영됩니다.');
    } catch (e) {
      console.error(e);
      setToast('저장에 실패했습니다.');
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) return <Centered>불러오는 중…</Centered>;

  if (!appUser) {
    return (
      <Centered>
        <p className="mb-4 text-sm">내 홈피를 만들려면 로그인이 필요합니다.</p>
        <button
          type="button"
          onClick={() => void signIn()}
          className="rounded-full bg-hub-text px-5 py-2.5 text-sm font-semibold text-hub-bg"
        >
          Google로 로그인
        </button>
      </Centered>
    );
  }

  if (!profile) return <Centered>불러오는 중…</Centered>;

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-frame pb-28">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-hub-border bg-hub-bg/90 px-5 py-3 backdrop-blur">
        <Link href="/" className="text-[13px] font-semibold">
          ← 허브
        </Link>
        <div className="flex rounded-full border border-hub-border p-0.5 text-[12px]">
          {(['edit', 'preview'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1.5 font-semibold ${
                tab === t ? 'bg-hub-text text-hub-bg' : 'text-hub-muted'
              }`}
            >
              {t === 'edit' ? '만들기' : '미리보기'}
            </button>
          ))}
        </div>
        <ThemeToggle />
      </header>

      {tab === 'preview' ? (
        <ProfileView
          profile={profile}
          displayName={appUser.displayName}
          slug={appUser.slug}
          preview
        />
      ) : (
        <div className="space-y-5 px-5 py-5">
          <div ref={photoRef}>
            <PhotoStep
              uid={appUser.uid}
              profile={profile}
              onPatch={autoSave}
              onBusyChange={setPhotoBusy}
              onExtracted={applyExtracted}
            />
          </div>
          <Mp3Step uid={appUser.uid} profile={profile} onPatch={autoSave} />
          <SummaryStep profile={profile} onPatch={patch} />
          <BasicsStep profile={profile} onPatch={patch} />
          <VisibilityStep profile={profile} onPatch={patch} />
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-frame border-t border-hub-border bg-hub-bg/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        {toast && <p className="mb-2 text-center text-[12px] text-hub-muted">{toast}</p>}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-2xl bg-hub-text py-3.5 text-[15px] font-bold text-hub-bg disabled:opacity-60"
        >
          {saving ? '저장 중…' : photoBusy ? '인물 사진 만드는 중…' : '저장하기'}
        </button>
      </div>
    </main>
  );
}

function PhotoStep({
  uid,
  profile,
  onPatch,
  onBusyChange,
  onExtracted,
}: {
  uid: string;
  profile: Profile;
  onPatch: (p: Partial<Profile>) => void | Promise<void>;
  onBusyChange: (busy: boolean) => void;
  onExtracted: (fields: Record<string, string>, summary: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'upload' | 'extract' | 'portrait' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const photo = profile.profileImageUrl || profile.heroImageUrl;

  useEffect(() => onBusyChange(busy !== null), [busy, onBusyChange]);

  /**
   * 올린 이미지는 두 갈래로 쓰인다.
   *   원본  -> profileImageUrl : 이 사람의 홈피 화면을 꽉 채우는 그림
   *   인물만 -> heroImageUrl    : 메인 허브 카드에 쓰는 세로 인물사진
   * 지면을 통째로 카드에 넣으면 작아서 아무것도 안 보이므로 인물만 따로 뽑는다.
   */
  const handle = async (file: File) => {
    setError(null);
    const problems: string[] = [];

    setBusy('upload');
    try {
      const raw = await uploadFile(uid, 'photo.jpg', file);
      // 원본은 홈피용. 카드용 인물사진이 나오기 전까지는 카드에도 임시로 쓴다.
      onPatch({ profileImageUrl: raw, heroImageUrl: raw });
    } catch (err) {
      setBusy(null);
      setError(err instanceof Error ? err.message : '사진을 올리지 못했습니다.');
      return;
    }

    // 이미지에 적힌 항목 읽기 — 실패해도 사진은 이미 올라가 있다
    setBusy('extract');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/extract', { method: 'POST', body: form });
      const data = (await res.json()) as {
        fields?: Record<string, string>;
        summary?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? '항목을 읽지 못했습니다.');
      onExtracted(data.fields ?? {}, data.summary ?? '');
    } catch (err) {
      problems.push(err instanceof Error ? err.message : '항목을 읽지 못했습니다.');
    }

    // 카드용 인물사진 뽑기
    setBusy('portrait');
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/portrait', { method: 'POST', body: form });
      const data = (await res.json()) as { dataUrl?: string; error?: string };
      if (!res.ok || !data.dataUrl) throw new Error(data.error ?? '인물 사진을 만들지 못했습니다.');
      const url = await uploadGenerated(uid, 'portrait.jpg', data.dataUrl);
      onPatch({ heroImageUrl: url });
    } catch (err) {
      problems.push(
        (err instanceof Error ? err.message : '인물 사진을 만들지 못했습니다.') +
          ' 카드에는 올리신 사진이 그대로 쓰입니다.',
      );
    }

    setBusy(null);
    if (problems.length) setError(problems.join(' '));
  };

  return (
    <Step
      n={1}
      title="사진 한 장"
      desc="올린 이미지는 내 홈피 화면이 되고, 여기서 인물만 뽑아 메인 카드에 씁니다. 올리면 곧바로 저장됩니다."
    >
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy !== null}
        className="relative aspect-[9/16] w-full overflow-hidden rounded-xl border border-dashed border-hub-border bg-hub-bg"
      >
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-[13px] text-hub-muted">
            사진 올리기
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center whitespace-pre-line bg-black/55 px-6 text-center text-[13px] leading-relaxed text-white">
            {busy === 'upload' ? '사진 올리는 중…' : '인물 사진 만드는 중…\n20초쯤 걸려요'}
          </span>
        )}
      </button>

      {photo && !busy && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-2 w-full rounded-xl border border-hub-border py-2.5 text-[13px] font-semibold"
        >
          다른 사진으로 다시 만들기
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void handle(file);
        }}
      />
      {error && <p className="mt-2 text-[12px] leading-snug text-red-500">{error}</p>}
    </Step>
  );
}

function Mp3Step({
  uid,
  profile,
  onPatch,
}: {
  uid: string;
  profile: Profile;
  onPatch: (p: Partial<Profile>) => void | Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Step n={2} title="음악 한 곡" desc="홈피에 들어오면 흘러나옵니다. 없어도 됩니다.">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="w-full rounded-xl border border-hub-border bg-hub-bg px-4 py-3.5 text-[14px] font-semibold"
      >
        {busy ? '올리는 중…' : profile.mp3Url ? '음악 바꾸기' : 'mp3 올리기'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="audio/mpeg,audio/mp3"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setBusy(true);
          setError(null);
          try {
            const url = await uploadFile(uid, 'audio.mp3', file);
            onPatch({ mp3Url: url });
          } catch (err) {
            setError(err instanceof Error ? err.message : '올리지 못했습니다.');
          } finally {
            setBusy(false);
          }
        }}
      />
      {profile.mp3Url && !error && (
        <p className="mt-1.5 text-[12px] text-hub-muted">음악이 등록되어 있습니다.</p>
      )}
      {error && <p className="mt-1.5 text-[12px] text-red-500">{error}</p>}
    </Step>
  );
}

/** 허브 카드에 들어갈 한 줄 소개 — 홈피 화면에는 나오지 않는다 */
function SummaryStep({
  profile,
  onPatch,
}: {
  profile: Profile;
  onPatch: (p: Partial<Profile>) => void;
}) {
  return (
    <Step n={3} title="한 줄 소개" desc="메인 화면 카드 아래에만 나옵니다.">
      <textarea
        rows={2}
        value={profile.heroSummary}
        maxLength={90}
        placeholder="예) 조천리에서 나고 자라 예순 해."
        onChange={(e) => onPatch({ heroSummary: e.target.value })}
        className="w-full resize-none rounded-xl border border-hub-border bg-hub-bg px-3.5 py-3 text-[14px] outline-none placeholder:text-hub-muted/40 focus:border-hub-text"
      />
    </Step>
  );
}

/** 허브 카드에 얹히는 기본 항목 — 비공개여도 노출된다 */
function BasicsStep({
  profile,
  onPatch,
}: {
  profile: Profile;
  onPatch: (p: Partial<Profile>) => void;
}) {
  const answers = basicAnswers(profile.tastes);

  return (
    <Step
      n={4}
      title="기본 항목"
      desc="메인 화면 사진 위에 함께 보입니다. 비공개로 두어도 이 항목은 보입니다."
    >
      <div className="space-y-2">
        {BASIC_FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-[11px] text-hub-muted">{f.label}</span>
            <input
              value={answers[f.key] ?? ''}
              placeholder={`예: ${f.placeholder}`}
              onChange={(e) =>
                onPatch({ tastes: applyBasics(profile, { ...answers, [f.key]: e.target.value }) })
              }
              className="w-full rounded-xl border border-hub-border bg-hub-bg px-3.5 py-2.5 text-[14px] outline-none placeholder:text-hub-muted/40 focus:border-hub-text"
            />
          </label>
        ))}
      </div>
    </Step>
  );
}

function VisibilityStep({
  profile,
  onPatch,
}: {
  profile: Profile;
  onPatch: (p: Partial<Profile>) => void;
}) {
  return (
    <Step n={5} title="공개 여부" desc="비공개로 두어도 메인 화면에는 사진과 기본 항목이 보입니다.">
      <div className="grid grid-cols-2 gap-2.5">
        {(
          [
            { id: 'public', title: '공개', desc: '한 줄 소개까지 모두 보입니다' },
            { id: 'private', title: '비공개', desc: '한 줄 소개는 흐리게 가려집니다' },
          ] as const
        ).map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onPatch({ visibility: opt.id })}
            className={`rounded-xl border p-3 text-left transition ${
              profile.visibility === opt.id ? 'border-hub-text bg-hub-bg' : 'border-hub-border'
            }`}
          >
            <span className="block text-[13px] font-bold">{opt.title}</span>
            <span className="mt-0.5 block text-[11px] leading-tight text-hub-muted">
              {opt.desc}
            </span>
          </button>
        ))}
      </div>
    </Step>
  );
}

function Step({
  n,
  title,
  desc,
  children,
}: {
  n: number;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-hub-border bg-hub-surface p-4">
      <div className="mb-3 flex items-baseline gap-2.5">
        <span className="text-[20px] font-semibold leading-none text-hub-muted">
          {String(n).padStart(2, '0')}
        </span>
        <div>
          <h2 className="text-[15px] font-bold leading-tight">{title}</h2>
          <p className="mt-0.5 text-[12px] leading-snug text-hub-muted">{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto grid min-h-[100dvh] max-w-frame place-items-center px-8 text-center">
      <div>{children}</div>
    </main>
  );
}
