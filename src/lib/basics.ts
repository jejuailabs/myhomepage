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

/**
 * 저장된 항목 이름은 시기마다 조금씩 다르다
 * (예: 'MBTI · 혈액형 · 별자리' vs 'MBTI · 혈액형').
 * 이름이 정확히 같은지 보지 말고 핵심 낱말로 찾는다.
 */
const MATCHERS: Record<string, RegExp> = {
  identity: /MBTI|혈액형|별자리/i,
  season: /계절(?!\s*간식)/,
  color: /색깔|색상/,
  food: /음식/,
};

const findValue = (tastes: TasteItem[] | undefined, key: string): string => {
  const re = MATCHERS[key];
  if (!re || !tastes) return '';
  return tastes.find((t) => re.test(t.category ?? ''))?.label?.trim() ?? '';
};

const labelOf = (key: string) => BASIC_FIELDS.find((f) => f.key === key)?.label ?? key;

export interface Basic {
  label: string;
  value: string;
}

/** 프로필에서 기본 항목만 뽑는다 (값이 있는 것만) */
export function basicsOf(tastes: TasteItem[] | undefined): Basic[] {
  if (!tastes?.length) return [];
  return BASIC_FIELDS.map((f) => {
    const value = findValue(tastes, f.key);
    return value ? { label: f.label, value } : null;
  }).filter((b): b is Basic => b !== null);
}

/** 편집 화면용 — { identity: 'ISFJ', season: '봄' } 형태로 되돌린다 */
export function basicAnswers(tastes: TasteItem[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of BASIC_FIELDS) {
    const value = findValue(tastes, f.key);
    if (value) out[f.key] = value;
  }
  return out;
}

/** 기본 항목 답변을 프로필의 tastes 로 옮긴다 (다른 항목은 건드리지 않는다) */
export function applyBasics(profile: Profile, answers: Record<string, string>): TasteItem[] {
  // 이름이 조금 달라도 같은 항목이면 지우고 새로 넣는다 (중복 방지)
  const others = profile.tastes.filter(
    (t) => !Object.values(MATCHERS).some((re) => re.test(t.category ?? '')),
  );
  const updated = BASIC_FIELDS.filter((f) => answers[f.key]?.trim()).map((f) => ({
    category: f.label,
    label: answers[f.key].trim(),
  }));
  return [...updated, ...others];
}
