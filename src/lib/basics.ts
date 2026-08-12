import type { Profile, TasteItem } from './types';

/**
 * 허브 카드에 얹는 기본 항목.
 *
 * 비공개 홈피라도 이 정도는 드러나도 무리가 없는 것만 고른다.
 * 사랑하는 대상·습관처럼 사적인 항목은 여기 넣지 않는다.
 */
export interface BasicField {
  key: string;
  label: string;
  placeholder: string;
}

export const BASIC_FIELDS: BasicField[] = [
  { key: 'identity', label: 'MBTI · 혈액형', placeholder: 'ISFJ / A형' },
  { key: 'season', label: '좋아하는 계절', placeholder: '봄' },
  { key: 'color', label: '좋아하는 색깔', placeholder: '노란색' },
  { key: 'food', label: '좋아하는 음식', placeholder: '닭갈비' },
];

const labelOf = (key: string) => BASIC_FIELDS.find((f) => f.key === key)?.label ?? key;

export interface Basic {
  label: string;
  value: string;
}

/** 프로필에서 기본 항목만 뽑는다 (값이 있는 것만) */
export function basicsOf(tastes: TasteItem[] | undefined): Basic[] {
  if (!tastes?.length) return [];
  return BASIC_FIELDS.map((f) => {
    const hit = tastes.find((t) => t.category === f.label);
    return hit?.label ? { label: f.label, value: hit.label } : null;
  }).filter((b): b is Basic => b !== null);
}

/** 편집 화면용 — { identity: 'ISFJ', season: '봄' } 형태로 되돌린다 */
export function basicAnswers(tastes: TasteItem[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of BASIC_FIELDS) {
    const hit = tastes?.find((t) => t.category === f.label);
    if (hit?.label) out[f.key] = hit.label;
  }
  return out;
}

/** 기본 항목 답변을 프로필의 tastes 로 옮긴다 (다른 항목은 건드리지 않는다) */
export function applyBasics(profile: Profile, answers: Record<string, string>): TasteItem[] {
  const basicLabels = BASIC_FIELDS.map((f) => f.label);
  const others = profile.tastes.filter((t) => !basicLabels.includes(t.category ?? ''));
  const updated = BASIC_FIELDS.filter((f) => answers[f.key]?.trim()).map((f) => ({
    category: f.label,
    label: answers[f.key].trim(),
  }));
  return [...updated, ...others];
}
