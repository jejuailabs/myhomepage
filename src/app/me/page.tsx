'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import GenerateImagery from '@/components/editor/GenerateImagery';
import ProfileView from '@/components/homepage/ProfileView';
import ThemeToggle from '@/components/ThemeToggle';
import { CONCEPT_LIST } from '@/lib/concepts';
import {
  answersFromText,
  answersToProfile,
  profileToAnswers,
  QUESTIONS,
  SECTION_TITLES,
  type Answers,
  type QuestionSection,
} from '@/lib/questions';
import { fetchProfile, saveProfile } from '@/lib/repo';
import { emptyProfile, type ConceptId, type Profile } from '@/lib/types';
import { uploadFile, uploadGenerated } from '@/lib/upload';

/**
 * 유저가 넣는 것은 셋뿐이다 — 셀카 1장, 질문 20개의 답, mp3 1개.
 * 나머지 사진은 답변에서 만들어 붙이고, 레이아웃은 컨셉이 알아서 잡는다.
 */

const SECTION_ORDER: QuestionSection[] = ['taste', 'dream', 'strength', 'love'];

export default function MyPage() {
  const { appUser, loading, signIn } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!appUser) return;
    fetchProfile(appUser.uid)
      .then((p) => {
        const loaded = p ?? emptyProfile(appUser.uid);
        setProfile(loaded);
        setAnswers(profileToAnswers(loaded));
      })
      .catch(() => setProfile(emptyProfile(appUser.uid)));
  }, [appUser]);

  const patch = useCallback(
    (part: Partial<Profile>) => setProfile((prev) => (prev ? { ...prev, ...part } : prev)),
    [],
  );

  /** 답변이 바뀌면 곧바로 홈피 데이터에 반영한다 */
  const setAnswer = useCallback((key: string, value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: value };
      setProfile((p) => (p ? { ...p, ...answersToProfile(next, p) } : p));
      return next;
    });
  }, []);

  const applyAll = useCallback((next: Answers) => {
    setAnswers(next);
    setProfile((p) => (p ? { ...p, ...answersToProfile(next, p) } : p));
  }, []);

  const handleSave = async () => {
    if (!appUser || !profile) return;
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

  const answered = QUESTIONS.filter((q) => answers[q.key]?.trim()).length;

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
          <Step n={1} title="셀카 한 장" desc="올려주시면 화보 느낌의 프로필 사진으로 바꿔 드립니다.">
            <SelfieStep uid={appUser.uid} profile={profile} onPatch={patch} />
          </Step>

          <Step
            n={2}
            title="답변 붙여넣기"
            desc="쓰시던 질문지를 통째로 붙여넣으세요. 항목은 알아서 나눠 담습니다."
          >
            <PasteBox
              answered={answered}
              total={QUESTIONS.length}
              onExtract={(text) => applyAll({ ...answers, ...answersFromText(text) })}
            />

            {answered > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-[12px] font-semibold text-hub-muted">
                  하나씩 고치기 ({answered}/{QUESTIONS.length})
                </summary>
                {SECTION_ORDER.map((section) => (
                  <div key={section} className="mt-4">
                    <p className="mb-2 text-[12px] font-bold text-hub-muted">
                      {SECTION_TITLES[section].ko}
                    </p>
                    <div className="space-y-2">
                      {QUESTIONS.filter((q) => q.section === section).map((q) => (
                        <label key={q.key} className="block">
                          <span className="mb-1 block text-[11px] text-hub-muted">{q.label}</span>
                          <input
                            value={answers[q.key] ?? ''}
                            placeholder={`예: ${q.placeholder}`}
                            onChange={(e) => setAnswer(q.key, e.target.value)}
                            className="w-full rounded-xl border border-hub-border bg-hub-surface px-3.5 py-2.5 text-[14px] outline-none placeholder:text-hub-muted/40 focus:border-hub-text"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </details>
            )}
          </Step>

          <Step n={3} title="음악 한 곡" desc="홈피에 들어오면 흘러나옵니다. 없어도 됩니다.">
            <Mp3Step uid={appUser.uid} profile={profile} onPatch={patch} />
          </Step>

          <GenerateImagery uid={appUser.uid} profile={profile} onPatch={patch} />

          <details className="rounded-2xl border border-hub-border bg-hub-surface p-4">
            <summary className="cursor-pointer text-[14px] font-bold">디자인 고르기</summary>
            <div className="mt-3 grid grid-cols-3 gap-2.5">
              {CONCEPT_LIST.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => patch({ conceptId: c.id as ConceptId })}
                  className={`overflow-hidden rounded-xl text-left ring-2 transition ${
                    profile.conceptId === c.id ? 'ring-hub-text' : 'ring-transparent'
                  }`}
                >
                  <span className="block h-14 w-full" style={{ background: c.swatch }} />
                  <span className="block bg-hub-bg px-2 py-1.5 text-[11px] font-semibold leading-tight">
                    {c.nameKo}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              {(
                [
                  { id: 'public', title: '공개', desc: '누구나 볼 수 있어요' },
                  { id: 'private', title: '비공개', desc: '사진만 보이고 글은 가려집니다' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => patch({ visibility: opt.id })}
                  className={`rounded-xl border p-3 text-left ${
                    profile.visibility === opt.id ? 'border-hub-text' : 'border-hub-border'
                  }`}
                >
                  <span className="block text-[13px] font-bold">{opt.title}</span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-hub-muted">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </details>
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
          {saving ? '저장 중…' : '저장하기'}
        </button>
      </div>
    </main>
  );
}

/* ── 1단계: 셀카 ── */

function SelfieStep({
  uid,
  profile,
  onPatch,
}: {
  uid: string;
  profile: Profile;
  onPatch: (p: Partial<Profile>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'upload' | 'generate' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shot = profile.profileImageUrl || profile.heroImageUrl;

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setBusy('upload');
    try {
      // 원본을 먼저 올려 두고(생성 실패해도 사진은 남는다), 이어서 변환한다
      const raw = await uploadFile(uid, 'selfie.jpg', file);
      onPatch({ profileImageUrl: raw, heroImageUrl: raw });

      setBusy('generate');
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/portrait', { method: 'POST', body: form });
      const data = (await res.json()) as { dataUrl?: string; error?: string };
      if (!res.ok || !data.dataUrl) {
        throw new Error(data.error ?? '사진을 만들지 못했습니다.');
      }
      const url = await uploadGenerated(uid, 'portrait.jpg', data.dataUrl);
      onPatch({ profileImageUrl: url, heroImageUrl: url });
    } catch (e) {
      setError(
        e instanceof Error
          ? `${e.message} 올려주신 사진은 그대로 쓰입니다.`
          : '사진을 만들지 못했습니다.',
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy !== null}
        className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-dashed border-hub-border bg-hub-bg"
      >
        {shot ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shot} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-[13px] text-hub-muted">
            셀카 올리기
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/50 px-6 text-center text-[13px] leading-relaxed text-white">
            {busy === 'upload' ? '사진 올리는 중…' : '화보 사진으로 바꾸는 중…\n20초쯤 걸려요'}
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void handle(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {error && <p className="mt-2 text-[12px] leading-snug text-red-500">{error}</p>}
    </div>
  );
}

/* ── 2단계: 양식 붙여넣기 ── */

function PasteBox({
  answered,
  total,
  onExtract,
}: {
  answered: number;
  total: number;
  onExtract: (text: string) => void;
}) {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);

  return (
    <div>
      <textarea
        rows={7}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setDone(false);
        }}
        placeholder={
          '질문지를 그대로 붙여넣으세요.\n\n좋아하는 음식: …\n좋아하는 색깔: …\n버킷리스트 TOP 3: …'
        }
        className="w-full resize-none rounded-xl border border-hub-border bg-hub-bg px-3.5 py-3 text-[13px] leading-relaxed outline-none placeholder:text-hub-muted/40 focus:border-hub-text"
      />
      <button
        type="button"
        onClick={() => {
          onExtract(text);
          setDone(true);
        }}
        disabled={!text.trim()}
        className="mt-2 w-full rounded-xl bg-hub-text py-3.5 text-[15px] font-bold text-hub-bg disabled:opacity-40"
      >
        붙여넣은 내용으로 채우기
      </button>

      {done && (
        <p className="mt-2 text-center text-[12px] font-semibold text-hub-muted">
          {answered > 0
            ? `${answered}개 항목을 읽었습니다.`
            : '인식된 항목이 없습니다. "항목: 내용" 형태인지 확인해 주세요.'}
        </p>
      )}
      {!done && answered > 0 && (
        <p className="mt-2 text-center text-[12px] text-hub-muted">
          {answered}/{total}개 채워져 있습니다.
        </p>
      )}
    </div>
  );
}

/* ── 3단계: mp3 ── */

function Mp3Step({
  uid,
  profile,
  onPatch,
}: {
  uid: string;
  profile: Profile;
  onPatch: (p: Partial<Profile>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
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
    </div>
  );
}

/* ── 공통 ── */

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
        <span className="font-serif text-[20px] leading-none text-hub-muted">
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
