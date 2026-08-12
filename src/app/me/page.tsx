'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Card, FileButton, ImageField, TextField } from '@/components/editor/Fields';
import ProfileView from '@/components/homepage/ProfileView';
import ThemeToggle from '@/components/ThemeToggle';
import { CONCEPT_LIST } from '@/lib/concepts';
import { fetchProfile, saveProfile } from '@/lib/repo';
import { emptyProfile, type ConceptId, type Profile } from '@/lib/types';
import { uploadFile } from '@/lib/upload';

export default function MyPage() {
  const { appUser, loading, signIn } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

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

  const pick = useCallback(
    async (path: string, file: File, apply: (url: string) => void) => {
      if (!appUser) return;
      const url = await uploadFile(appUser.uid, path, file);
      apply(url);
    },
    [appUser],
  );

  const handleSave = async () => {
    if (!appUser || !profile) return;
    setSaving(true);
    try {
      await saveProfile(appUser.uid, profile);
      setToast(
        appUser.status === 'rejected'
          ? '저장했습니다. 다만 관리자가 비공개 처리한 상태라 허브에는 보이지 않습니다.'
          : '저장했습니다. 허브에 반영됩니다.',
      );
    } catch (e) {
      console.error(e);
      setToast('저장에 실패했습니다.');
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (loading) {
    return <Centered>불러오는 중…</Centered>;
  }

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
              {t === 'edit' ? '편집' : '미리보기'}
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
        <div className="space-y-4 px-5 py-5">
          {/* 컨셉 선택 */}
          <Card title="디자인 컨셉">
            <div className="grid grid-cols-3 gap-2.5">
              {CONCEPT_LIST.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => patch({ conceptId: c.id as ConceptId })}
                  className={`overflow-hidden rounded-xl text-left ring-2 transition ${
                    profile.conceptId === c.id ? 'ring-hub-text' : 'ring-transparent'
                  }`}
                >
                  <span className="block h-16 w-full" style={{ background: c.swatch }} />
                  <span className="block bg-hub-bg px-2 py-1.5 text-[11px] font-semibold leading-tight">
                    {c.nameKo}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* 공개 범위 */}
          <Card title="공개 범위">
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { id: 'public', icon: '🌏', title: '공개', desc: '누구나 전체 내용을 봅니다' },
                  {
                    id: 'private',
                    icon: '🔒',
                    title: '비공개',
                    desc: '사진만 보이고 글은 흐리게 가려집니다',
                  },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => patch({ visibility: opt.id })}
                  className={`rounded-xl border p-3 text-left transition ${
                    profile.visibility === opt.id
                      ? 'border-hub-text bg-hub-bg'
                      : 'border-hub-border'
                  }`}
                >
                  <span className="text-[16px]">{opt.icon}</span>
                  <span className="mt-1 block text-[13px] font-bold">{opt.title}</span>
                  <span className="mt-0.5 block text-[11px] leading-tight text-hub-muted">
                    {opt.desc}
                  </span>
                </button>
              ))}
            </div>
          </Card>

          {/* 허브 카드 */}
          <Card title="허브 카드 (메인 화면 노출)">
            <ImageField
              label="대표 사진"
              value={profile.heroImageUrl}
              aspect="aspect-[3/4]"
              onPick={(f) => pick('hero.jpg', f, (url) => patch({ heroImageUrl: url }))}
            />
            <TextField
              label="한 줄 소개 (1~2문장)"
              value={profile.heroSummary}
              maxLength={90}
              multiline
              placeholder="예) 조천리에서 나고 자라 예순 해. 아직도 매일 새로운 걸 배웁니다."
              onChange={(v) => patch({ heroSummary: v })}
            />
          </Card>

          {/* 프로필 헤더 */}
          <Card title="프로필">
            <ImageField
              label="프로필 사진"
              value={profile.profileImageUrl}
              onPick={(f) => pick('profile.jpg', f, (url) => patch({ profileImageUrl: url }))}
            />
            <TextField
              label="슬로건"
              value={profile.slogan}
              maxLength={60}
              placeholder="예) 나는 나의 속도로 아름답게 피어나고 있습니다"
              onChange={(v) => patch({ slogan: v })}
            />
          </Card>

          {/* 01 취향 */}
          <Card title="01 나의 취향">
            {profile.tastes.map((t, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={t.icon}
                  onChange={(e) => {
                    const next = [...profile.tastes];
                    next[i] = { ...t, icon: e.target.value };
                    patch({ tastes: next });
                  }}
                  className="w-14 rounded-xl border border-hub-border bg-hub-surface px-2 py-2.5 text-center text-[16px]"
                  placeholder="🍲"
                />
                <input
                  value={t.label}
                  onChange={(e) => {
                    const next = [...profile.tastes];
                    next[i] = { ...t, label: e.target.value };
                    patch({ tastes: next });
                  }}
                  className="flex-1 rounded-xl border border-hub-border bg-hub-surface px-3 py-2.5 text-[14px]"
                  placeholder="좋아하는 것"
                />
                <button
                  type="button"
                  onClick={() => patch({ tastes: profile.tastes.filter((_, j) => j !== i) })}
                  className="px-2 text-hub-muted"
                  aria-label="삭제"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => patch({ tastes: [...profile.tastes, { icon: '', label: '' }] })}
              className="w-full rounded-xl border border-dashed border-hub-border py-2.5 text-[13px] text-hub-muted"
            >
              + 취향 추가
            </button>
          </Card>

          {/* 02 꿈과 도전 */}
          <Card title="02 나의 꿈과 도전">
            {profile.bucketList.map((b, i) => (
              <TextField
                key={b.rank}
                label={`버킷리스트 ${b.rank}순위`}
                value={b.label}
                onChange={(v) => {
                  const next = [...profile.bucketList];
                  next[i] = { ...b, label: v };
                  patch({ bucketList: next });
                }}
              />
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <ImageField
                  label="가고 싶은 여행지"
                  value={profile.dreamTravel.imageUrl}
                  aspect="aspect-square"
                  onPick={(f) =>
                    pick('sections/dream/travel.jpg', f, (url) =>
                      patch({ dreamTravel: { ...profile.dreamTravel, imageUrl: url } }),
                    )
                  }
                />
                <input
                  value={profile.dreamTravel.label}
                  onChange={(e) =>
                    patch({ dreamTravel: { ...profile.dreamTravel, label: e.target.value } })
                  }
                  placeholder="어디로 가고 싶나요?"
                  className="w-full rounded-xl border border-hub-border bg-hub-surface px-3 py-2.5 text-[13px]"
                />
              </div>
              <div className="space-y-2">
                <ImageField
                  label="배워보고 싶은 것"
                  value={profile.dreamLearn.imageUrl}
                  aspect="aspect-square"
                  onPick={(f) =>
                    pick('sections/dream/learn.jpg', f, (url) =>
                      patch({ dreamLearn: { ...profile.dreamLearn, imageUrl: url } }),
                    )
                  }
                />
                <input
                  value={profile.dreamLearn.label}
                  onChange={(e) =>
                    patch({ dreamLearn: { ...profile.dreamLearn, label: e.target.value } })
                  }
                  placeholder="무엇을 배우고 싶나요?"
                  className="w-full rounded-xl border border-hub-border bg-hub-surface px-3 py-2.5 text-[13px]"
                />
              </div>
            </div>
          </Card>

          {/* 03 강점 */}
          <Card title="03 나의 강점">
            {[0, 1].map((i) => {
              const s = profile.strengths[i] ?? { imageUrl: '', caption: '' };
              const setS = (part: Partial<typeof s>) => {
                const next = [...profile.strengths];
                next[i] = { ...s, ...part };
                patch({ strengths: next });
              };
              return (
                <div key={i} className="space-y-2">
                  <ImageField
                    label={`강점 사진 ${i + 1}`}
                    value={s.imageUrl}
                    aspect="aspect-[16/10]"
                    onPick={(f) =>
                      pick(`sections/strengths/${i}.jpg`, f, (url) => setS({ imageUrl: url }))
                    }
                  />
                  <input
                    value={s.caption}
                    onChange={(e) => setS({ caption: e.target.value })}
                    placeholder="짧은 설명"
                    className="w-full rounded-xl border border-hub-border bg-hub-surface px-3 py-2.5 text-[13px]"
                  />
                </div>
              );
            })}
          </Card>

          {/* 04 사랑하는 것 */}
          <Card title="04 내가 사랑하는 것">
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => {
                const l = profile.loved[i] ?? { imageUrl: '', label: '' };
                const setL = (part: Partial<typeof l>) => {
                  const next = [...profile.loved];
                  next[i] = { ...l, ...part };
                  patch({ loved: next });
                };
                return (
                  <div key={i} className="space-y-2">
                    <ImageField
                      label={`사진 ${i + 1}`}
                      value={l.imageUrl}
                      aspect="aspect-square"
                      onPick={(f) =>
                        pick(`sections/loved/${i}.jpg`, f, (url) => setL({ imageUrl: url }))
                      }
                    />
                    <input
                      value={l.label}
                      onChange={(e) => setL({ label: e.target.value })}
                      placeholder="라벨"
                      className="w-full rounded-xl border border-hub-border bg-hub-surface px-3 py-2 text-[13px]"
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 05 행복한 순간 */}
          <Card title="05 나를 행복하게 하는 순간">
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <ImageField
                  key={i}
                  label={`사진 ${i + 1}`}
                  value={profile.happyMoments[i]?.imageUrl ?? ''}
                  aspect="aspect-square"
                  onPick={(f) =>
                    pick(`sections/happy/${i}.jpg`, f, (url) => {
                      const next = [...profile.happyMoments];
                      next[i] = { imageUrl: url };
                      patch({ happyMoments: next });
                    })
                  }
                />
              ))}
            </div>
          </Card>

          {/* 음악 */}
          <Card title="배경 음악 (mp3)">
            <FileButton
              label={profile.mp3Url ? '음악 교체하기' : 'mp3 올리기'}
              hint="15MB 이하. 홈피 진입 시 자동재생을 시도합니다."
              accept="audio/mpeg,audio/mp3"
              onPick={(f) => pick('audio.mp3', f, (url) => patch({ mp3Url: url }))}
            />
            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={profile.mp3Autoplay}
                onChange={(e) => patch({ mp3Autoplay: e.target.checked })}
              />
              진입 시 자동재생 시도
            </label>
          </Card>

          {/* 클로징 */}
          <Card title="마무리 문구">
            <TextField
              label="클로징 문구"
              value={profile.closingText}
              placeholder="예) 오늘의 나를 응원해요"
              onChange={(v) => patch({ closingText: v })}
            />
            <TextField
              label="서브 태그라인"
              value={profile.subTagline}
              onChange={(v) => patch({ subTagline: v })}
            />
          </Card>
        </div>
      )}

      {/* 저장 바 */}
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

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto grid min-h-[100dvh] max-w-frame place-items-center px-8 text-center">
      <div>{children}</div>
    </main>
  );
}
