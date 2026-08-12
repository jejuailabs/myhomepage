'use client';

import { useState } from 'react';
import type { Profile } from '@/lib/types';
import { uploadGenerated } from '@/lib/upload';

/**
 * 답변마다 사진 한 장씩 생성해 붙인다.
 *
 * Vercel Hobby 는 함수 실행이 60초까지라 한 요청에 다 몰면 타임아웃이 난다.
 * 그래서 3장씩 끊어 보내고, 받은 즉시 압축해서 Storage 에 올린다.
 */

const CHUNK = 3;

interface Slot {
  key: string;
  category: string;
  value: string;
  /** 생성된 URL 을 프로필의 어디에 넣을지 */
  assign: (profile: Profile, url: string) => Partial<Profile>;
}

function buildSlots(p: Profile): Slot[] {
  const slots: Slot[] = [];

  p.tastes.forEach((t, i) => {
    if (!t.label || t.imageUrl) return;
    slots.push({
      key: `taste-${i}`,
      category: t.category ?? '좋아하는 것',
      value: t.label,
      assign: (profile, url) => {
        const next = [...profile.tastes];
        next[i] = { ...next[i], imageUrl: url };
        return { tastes: next };
      },
    });
  });

  if (p.dreamTravel.label && !p.dreamTravel.imageUrl) {
    slots.push({
      key: 'travel',
      category: '가보고 싶은 여행지',
      value: p.dreamTravel.label,
      assign: (profile, url) => ({ dreamTravel: { ...profile.dreamTravel, imageUrl: url } }),
    });
  }
  if (p.dreamLearn.label && !p.dreamLearn.imageUrl) {
    slots.push({
      key: 'learn',
      category: '배워보고 싶은 것',
      value: p.dreamLearn.label,
      assign: (profile, url) => ({ dreamLearn: { ...profile.dreamLearn, imageUrl: url } }),
    });
  }

  p.loved.forEach((l, i) => {
    if (!l.label || l.imageUrl) return;
    slots.push({
      key: `loved-${i}`,
      category: l.category ?? '내가 사랑하는 것',
      value: l.label,
      assign: (profile, url) => {
        const next = [...profile.loved];
        next[i] = { ...next[i], imageUrl: url };
        return { loved: next };
      },
    });
  });

  p.strengths.forEach((s, i) => {
    if (!s.caption || s.imageUrl) return;
    slots.push({
      key: `strength-${i}`,
      category: '나의 강점',
      value: s.caption,
      assign: (profile, url) => {
        const next = [...profile.strengths];
        next[i] = { ...next[i], imageUrl: url };
        return { strengths: next };
      },
    });
  });

  return slots;
}

export default function GenerateImagery({
  uid,
  profile,
  onPatch,
}: {
  uid: string;
  profile: Profile;
  onPatch: (part: Partial<Profile>) => void;
}) {
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const pending = buildSlots(profile);

  const run = async () => {
    const slots = buildSlots(profile);
    if (slots.length === 0) return;

    setRunning(true);
    setError(null);
    setDone(0);
    setTotal(slots.length);

    // 생성 도중 다른 항목도 채워지므로 최신 프로필을 누적해 들고 간다
    let working = profile;
    let failed = 0;

    for (let i = 0; i < slots.length; i += CHUNK) {
      const chunk = slots.slice(i, i + CHUNK);
      try {
        const res = await fetch('/api/imagery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: chunk.map((s) => ({ key: s.key, category: s.category, value: s.value })),
          }),
        });
        const data = (await res.json()) as {
          results?: { key: string; dataUrl?: string; error?: string }[];
          error?: string;
        };
        if (!res.ok) throw new Error(data.error ?? '생성에 실패했습니다.');

        for (const r of data.results ?? []) {
          const slot = chunk.find((s) => s.key === r.key);
          if (!slot || !r.dataUrl) {
            failed += 1;
            continue;
          }
          try {
            const url = await uploadGenerated(uid, `generated/${slot.key}.jpg`, r.dataUrl);
            const part = slot.assign(working, url);
            working = { ...working, ...part };
            onPatch(part);
          } catch {
            failed += 1;
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '생성에 실패했습니다.');
        break;
      }
      setDone(Math.min(i + CHUNK, slots.length));
    }

    if (failed > 0) setError(`${failed}장은 만들지 못했습니다. 다시 눌러 이어서 만들 수 있습니다.`);
    setRunning(false);
  };

  return (
    <section className="rounded-2xl border border-hub-border bg-hub-surface p-4">
      <h2 className="text-[15px] font-bold">사진 자동 만들기</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-hub-muted">
        적어주신 답변마다 어울리는 사진을 한 장씩 만들어 붙입니다. 모두 같은 톤으로 만들어져
        한 권의 잡지처럼 보입니다.
      </p>

      <button
        type="button"
        onClick={run}
        disabled={running || pending.length === 0}
        className="mt-3 w-full rounded-xl bg-hub-text py-3 text-[14px] font-bold text-hub-bg disabled:opacity-40"
      >
        {running
          ? `만드는 중… ${done}/${total}`
          : pending.length === 0
            ? '모든 항목에 사진이 있습니다'
            : `${pending.length}장 만들기`}
      </button>

      {running && (
        <p className="mt-2 text-[11px] text-hub-muted">
          한 장에 20초쯤 걸립니다. 이 화면을 열어둔 채로 기다려 주세요.
        </p>
      )}
      {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
    </section>
  );
}
