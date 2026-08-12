/**
 * 유저에게 받는 것은 딱 셋 — 셀카 1장, 아래 질문 20개의 답, mp3 1개.
 * 사진은 커버 한 장뿐이므로 나머지 섹션은 전부 타이포그래피로 완성한다.
 *
 * key 는 저장·파싱의 기준이 되므로 바꾸지 말 것.
 */

export type QuestionSection = 'taste' | 'dream' | 'strength' | 'love';

export interface Question {
  key: string;
  /** 화면에 보이는 항목명 */
  label: string;
  /** 입력 도움말 */
  placeholder: string;
  section: QuestionSection;
  /** 양식 붙여넣기에서 이 질문을 찾아낼 키워드 */
  match: RegExp;
}

export const QUESTIONS: Question[] = [
  // 나의 취향
  { key: 'food', label: '좋아하는 음식', placeholder: '닭갈비', section: 'taste', match: /음식/ },
  { key: 'color', label: '좋아하는 색깔', placeholder: '노란색', section: 'taste', match: /색깔|색상/ },
  { key: 'movie', label: '좋아하는 영화', placeholder: '액션영화', section: 'taste', match: /영화/ },
  { key: 'book', label: '좋아하는 책', placeholder: '다큐', section: 'taste', match: /책/ },
  { key: 'season', label: '좋아하는 계절', placeholder: '봄', section: 'taste', match: /계절(?!\s*간식)/ },
  {
    key: 'identity',
    label: 'MBTI · 혈액형 · 별자리',
    placeholder: 'ISFJ / A형',
    section: 'taste',
    match: /MBTI|혈액형|별자리/i,
  },
  { key: 'hobby', label: '요즘 빠져있는 취미', placeholder: '책보기', section: 'taste', match: /취미/ },
  {
    key: 'music',
    label: '좋아하는 노래 · 아티스트',
    placeholder: '트로트',
    section: 'taste',
    match: /노래|아티스트|음악/,
  },
  {
    key: 'stress',
    label: '스트레스 해소 루틴',
    placeholder: '신나게 춤추기',
    section: 'taste',
    match: /스트레스|루틴/,
  },
  {
    key: 'snack',
    label: '좋아하는 계절 간식',
    placeholder: '커피 마시기',
    section: 'taste',
    match: /간식/,
  },
  {
    key: 'habit',
    label: '나를 나답게 만드는 습관',
    placeholder: '아침 산책',
    section: 'taste',
    match: /습관/,
  },

  // 나의 꿈과 도전
  {
    key: 'childhoodDream',
    label: '어린 시절 꿈꾸던 직업',
    placeholder: '인테리어',
    section: 'dream',
    match: /어린\s*시절|꿈꾸던\s*직업/,
  },
  {
    key: 'bucket',
    label: '버킷리스트 TOP 3',
    placeholder: '여행, 책 내기, 한라산 오르기',
    section: 'dream',
    match: /버킷/,
  },
  {
    key: 'travel',
    label: '꼭 가보고 싶은 여행지',
    placeholder: '여러 곳 돌아보기',
    section: 'dream',
    match: /여행지|가보고\s*싶은|가고\s*싶은/,
  },
  {
    key: 'learn',
    label: '배워보고 싶은 것',
    placeholder: '배움의 길',
    section: 'dream',
    match: /배워|배우고|배움/,
  },

  // 나의 강점
  {
    key: 'bestAt',
    label: '내가 가장 잘하는 것',
    placeholder: '춤추는 것',
    section: 'strength',
    match: /잘하는|특기/,
  },
  {
    key: 'praised',
    label: '남들이 인정해주는 나의 장점',
    placeholder: '잘 들어주는 것',
    section: 'strength',
    match: /장점|인정/,
  },

  // 내가 사랑하는 것
  {
    key: 'lovedOne',
    label: '가장 사랑하는 대상',
    placeholder: '사람',
    section: 'love',
    match: /사랑하는/,
  },
  { key: 'animal', label: '좋아하는 동물', placeholder: '강아지', section: 'love', match: /동물/ },
  {
    key: 'scenery',
    label: '좋아하는 날씨 · 풍경',
    placeholder: '봄에 꽃이 핀 모습',
    section: 'love',
    match: /날씨|풍경/,
  },
];

export const SECTION_TITLES: Record<QuestionSection, { ko: string; en: string }> = {
  taste: { ko: '나의 취향', en: 'My Taste' },
  dream: { ko: '나의 꿈과 도전', en: 'My Dream & Bucket List' },
  strength: { ko: '나의 강점', en: 'My Strength' },
  love: { ko: '내가 사랑하는 것', en: 'What I Love' },
};

export const questionsOf = (section: QuestionSection) =>
  QUESTIONS.filter((q) => q.section === section);

/** 답변 맵 — { food: '닭갈비', ... } */
export type Answers = Record<string, string>;

/** 붙여넣은 양식에서 20문항에 해당하는 답을 뽑아 맵으로 만든다 */
export function answersFromText(text: string): Answers {
  const answers: Answers = {};
  const lead = /^[\s\-–—•*·>]*[\p{Extended_Pictographic}️‍←-⇿⌀-➿]*[\s\-–—•*·]*/u;
  const skip = /^(메이크업|헤어|의상|조명|표정|배경|역할|작업|스타일|구성|단계|톤|레이아웃|서체)$/;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(lead, '');
    const m = line.match(/^(.{1,40}?)\s*[:：]\s*(.+)$/);
    if (!m) continue;
    const label = m[1].trim();
    const value = m[2].trim();
    if (!value || skip.test(label)) continue;

    const q = QUESTIONS.find((x) => x.match.test(label));
    if (q && !answers[q.key]) answers[q.key] = value;
  }
  return answers;
}
