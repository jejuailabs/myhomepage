'use client';

import { useState } from 'react';
import { parseTemplate } from '@/lib/parseTemplate';
import type { Profile } from '@/lib/types';

/**
 * 쓰던 양식(이미지 생성 프롬프트)을 통째로 붙여넣으면 섹션 데이터로 채워준다.
 * 사진·음악은 건드리지 않고 글 항목만 덮어쓴다.
 */
export default function TemplateImport({
  profile,
  onApply,
}: {
  profile: Profile;
  onApply: (next: Partial<Profile>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const apply = () => {
    const p = parseTemplate(text);
    if (p.count === 0) {
      setResult('인식된 항목이 없습니다. "항목: 내용" 형태의 줄이 포함되어 있는지 확인해 주세요.');
      return;
    }

    const patch: Partial<Profile> = {};

    if (p.tastes.length) {
      patch.tastes = p.tastes.map((t) => ({ category: t.category, label: t.value }));
    }
    if (p.loved.length) {
      patch.loved = p.loved.map((t, i) => ({
        imageUrl: profile.loved[i]?.imageUrl ?? '',
        category: t.category,
        label: t.value,
      }));
    }
    if (p.strengths.length) {
      patch.strengths = p.strengths.map((caption, i) => ({
        imageUrl: profile.strengths[i]?.imageUrl ?? '',
        caption,
      }));
    }
    if (p.bucketList.length) {
      patch.bucketList = p.bucketList.slice(0, 3).map((label, i) => ({ rank: i + 1, label }));
    }
    if (p.dreamTravel) {
      patch.dreamTravel = { ...profile.dreamTravel, label: p.dreamTravel };
    }
    if (p.dreamLearn) {
      patch.dreamLearn = { ...profile.dreamLearn, label: p.dreamLearn };
    }
    if (p.childhoodDream) patch.childhoodDream = p.childhoodDream;
    if (p.slogan && !profile.slogan) patch.slogan = p.slogan;

    // 한 줄 소개가 비어 있으면 뽑은 값으로 자연스럽게 만들어 준다
    if (!profile.heroSummary) {
      const love = p.loved[0]?.value;
      const hobby = p.tastes.find((t) => /취미|루틴/.test(t.category))?.value;
      const bits = [love && `${love}을(를) 아끼고`, hobby && `${hobby}(으)로 하루를 채웁니다`]
        .filter(Boolean)
        .join(' ');
      if (bits) patch.heroSummary = bits;
    }

    onApply(patch);
    setResult(
      `${p.count}개 항목을 채웠습니다. ` +
        `취향 ${p.tastes.length} · 사랑하는 것 ${p.loved.length} · 강점 ${p.strengths.length} · ` +
        `버킷리스트 ${p.bucketList.length}`,
    );
  };

  return (
    <section className="rounded-2xl border border-hub-border bg-hub-surface p-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <span>
          <span className="block text-[15px] font-bold">양식 붙여넣기</span>
          <span className="mt-0.5 block text-[12px] text-hub-muted">
            쓰시던 질문 양식을 통째로 붙여넣으면 알아서 항목을 채웁니다
          </span>
        </span>
        <span className="ml-3 shrink-0 text-[12px] text-hub-muted">{open ? '닫기' : '열기'}</span>
      </button>

      {open && (
        <div className="mt-3 space-y-2.5">
          <textarea
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'예)\n좋아하는 음식: 닭갈비\n좋아하는 색깔: 노란색\n버킷리스트 top3: 여행'}
            className="w-full resize-none rounded-xl border border-hub-border bg-hub-bg px-3.5 py-3 text-[13px] leading-relaxed outline-none placeholder:text-hub-muted/60 focus:border-hub-text"
          />
          <button
            type="button"
            onClick={apply}
            disabled={!text.trim()}
            className="w-full rounded-xl bg-hub-text py-3 text-[14px] font-bold text-hub-bg disabled:opacity-40"
          >
            내용 자동으로 채우기
          </button>
          {result && <p className="text-[12px] leading-snug text-hub-muted">{result}</p>}
          <p className="text-[11px] leading-relaxed text-hub-muted">
            사진과 음악은 그대로 두고 글 항목만 채웁니다. 채운 뒤 각 항목을 직접 고칠 수 있습니다.
          </p>
        </div>
      )}
    </section>
  );
}
