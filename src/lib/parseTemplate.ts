/**
 * 사용자가 쓰던 "이미지 생성 프롬프트 양식"을 그대로 붙여넣으면
 * 홈피 섹션 데이터로 뽑아낸다.
 *
 * 주의: 양식 안에는 사용자의 답변이 아닌 AI 지시문에도 콜론이 들어 있다.
 *   - 메이크업: 은은한 글램 메이크업 ...
 *   - 조명: 부드러운 스튜디오 조명 ...
 * 그래서 "라벨: 값" 을 무작정 긁으면 지시문이 섞인다.
 * 아래 두 조건 중 하나를 만족하는 줄만 데이터로 인정한다.
 *   1) 줄이 이모지/기호로 시작한다 (양식의 답변 항목은 전부 이모지로 시작)
 *   2) 라벨이 알려진 항목 키워드와 일치한다 (이모지 없이 붙여넣은 경우 대비)
 */

export interface ParsedItem {
  /** 항목 이름 (예: 좋아하는 음식) */
  category: string;
  /** 사용자가 적은 값 (예: 닭갈비) */
  value: string;
}

export interface ParsedTemplate {
  tastes: ParsedItem[];
  loved: ParsedItem[];
  strengths: string[];
  bucketList: string[];
  dreamTravel: string;
  dreamLearn: string;
  childhoodDream: string;
  /** 제목 줄에서 뽑은 문구 */
  slogan: string;
  /** 인식된 항목 총 개수 */
  count: number;
}

/** 지시문에 자주 쓰이는 라벨 — 데이터로 오인하면 안 되는 것들 */
const INSTRUCTION_LABELS =
  /^(메이크업|헤어|의상|조명|표정|배경|역할|작업|스타일|구성|단계|톤|레이아웃|폰트|서체|컬러|색상 팔레트)$/;

/** 줄 맨 앞의 이모지·불릿·번호를 떼어낸다 */
const LEAD_SYMBOLS =
  /^[\s\-–—•*·>]*[\p{Extended_Pictographic}←-⇿⌀-➿️‍]*[\s\-–—•*·]*/u;

interface Rule {
  test: RegExp;
  apply: (out: ParsedTemplate, item: ParsedItem) => void;
}

/** 값이 여러 개 적혀 있으면 나눈다 (쉼표·가운뎃점·슬래시·줄바꿈) */
function splitValues(value: string): string[] {
  return value
    .split(/[,、·/|]+|\s+그리고\s+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/** 순서 중요 — 먼저 걸리는 규칙이 이긴다 ("계절 간식" 이 "계절" 보다 앞) */
const RULES: Rule[] = [
  { test: /간식/, apply: (o, i) => o.tastes.push(i) },
  {
    test: /버킷\s*리스트|버킷리스트/,
    apply: (o, i) => o.bucketList.push(...splitValues(i.value)),
  },
  { test: /여행지|가보고\s*싶은|가고\s*싶은/, apply: (o, i) => (o.dreamTravel = i.value) },
  { test: /배워|배우고|배움/, apply: (o, i) => (o.dreamLearn = i.value) },
  { test: /어린\s*시절|꿈꾸던\s*직업/, apply: (o, i) => (o.childhoodDream = i.value) },
  { test: /잘하는|특기/, apply: (o, i) => o.strengths.push(i.value) },
  { test: /장점|인정/, apply: (o, i) => o.strengths.push(i.value) },
  { test: /사랑하는/, apply: (o, i) => o.loved.push(i) },
  { test: /동물/, apply: (o, i) => o.loved.push(i) },
  { test: /날씨|풍경/, apply: (o, i) => o.loved.push(i) },
  { test: /습관/, apply: (o, i) => o.tastes.push(i) },
];

/** 알려진 취향 항목 — 이모지 없이 붙여넣어도 인식되도록 */
const TASTE_KEYWORDS =
  /음식|색깔|색상|영화|책|계절|MBTI|혈액형|별자리|취미|노래|아티스트|음악|스트레스|루틴|간식|습관|동물|날씨|풍경/i;

const KNOWN_LABEL =
  /음식|색깔|색상|영화|책|계절|MBTI|혈액형|별자리|취미|노래|아티스트|음악|스트레스|루틴|간식|습관|동물|날씨|풍경|버킷|여행|배워|배우고|배움|어린|직업|잘하는|특기|장점|인정|사랑하는/i;

export function parseTemplate(text: string): ParsedTemplate {
  const out: ParsedTemplate = {
    tastes: [],
    loved: [],
    strengths: [],
    bucketList: [],
    dreamTravel: '',
    dreamLearn: '',
    childhoodDream: '',
    slogan: '',
    count: 0,
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    // 제목 줄: "RADIANT ME — 나를 사랑하는 대시보드"
    const titleMatch = line.match(/"([^"]*RADIANT[^"]*)"/i);
    if (titleMatch && !out.slogan) {
      const after = titleMatch[1].split(/[—–-]/).slice(1).join('-').trim();
      if (after) out.slogan = after;
      continue;
    }

    const hadSymbol = LEAD_SYMBOLS.test(line) && LEAD_SYMBOLS.exec(line)?.[0].trim() !== '';
    const stripped = line.replace(LEAD_SYMBOLS, '');

    const m = stripped.match(/^(.{1,40}?)\s*[:：]\s*(.+)$/);
    if (!m) continue;

    const category = m[1].trim();
    const value = m[2].trim();
    if (!value || INSTRUCTION_LABELS.test(category)) continue;

    // 이모지로 시작했거나, 알려진 항목일 때만 데이터로 본다
    if (!hadSymbol && !KNOWN_LABEL.test(category)) continue;

    const item: ParsedItem = { category, value };
    const rule = RULES.find((r) => r.test.test(category));
    if (rule) rule.apply(out, item);
    else if (TASTE_KEYWORDS.test(category) || hadSymbol) out.tastes.push(item);
    else continue;

    out.count += 1;
  }

  return out;
}
