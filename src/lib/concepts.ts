import type { ConceptId } from './types';

/**
 * 6종 디자인 컨셉 정의.
 * 개별 홈피는 여기 정의된 고정 팔레트를 그대로 사용한다(다크/라이트 토글 비적용).
 * 실제 렌더링은 src/components/concepts/* 의 컨셉별 레이아웃 컴포넌트가 담당한다.
 */
export interface ConceptDef {
  id: ConceptId;
  name: string;
  nameKo: string;
  mood: string;
  /** 컨셉 선택 카드 썸네일용 CSS 그라데이션 */
  swatch: string;
  /** 섹션 넘버 라벨 색 등 대표 컬러 (썸네일 텍스트용) */
  ink: string;
  vars: Record<string, string>;
}

export const CONCEPTS: Record<ConceptId, ConceptDef> = {
  cream_elegant: {
    id: 'cream_elegant',
    name: 'Cream Elegant',
    nameKo: '아이보리 우아함',
    mood: '차분하고 정갈한 라이프스타일 매거진',
    swatch: 'linear-gradient(140deg,#F7F3EC 0%,#EFE6D6 55%,#D8C6A8 100%)',
    ink: '#5A4A3A',
    vars: {
      '--c-bg': '#F7F3EC',
      '--c-surface': '#FFFDF8',
      '--c-text': '#5A4A3A',
      '--c-muted': '#9A8972',
      '--c-accent': '#B99458',
      '--c-line': '#E4D9C6',
    },
  },
  dark_forest: {
    id: 'dark_forest',
    name: 'Dark Forest Luxury',
    nameKo: '다크그린 럭셔리',
    mood: '고급스럽고 무게감 있는 에디토리얼',
    swatch: 'linear-gradient(160deg,#1B2A22 0%,#0E1A14 60%,#000000 100%)',
    ink: '#D9C08B',
    vars: {
      '--c-bg': '#0F1A14',
      '--c-surface': '#17251D',
      '--c-text': '#F2EFE8',
      '--c-muted': '#A9B5AC',
      '--c-accent': '#D9C08B',
      '--c-line': '#2B3B32',
    },
  },
  lavender_soft: {
    id: 'lavender_soft',
    name: 'Lavender Soft',
    nameKo: '라벤더 파스텔',
    mood: '부드러운 파스텔 힐링 무드',
    swatch: 'linear-gradient(150deg,#F3EDFA 0%,#E8DFF0 50%,#CDB8E6 100%)',
    ink: '#5B4776',
    vars: {
      '--c-bg': '#F1EAF9',
      '--c-surface': '#FFFFFF',
      '--c-text': '#4C3B66',
      '--c-muted': '#8D7BA8',
      '--c-accent': '#9A6FD1',
      '--c-line': '#E2D6F2',
    },
  },
  kraft_vintage: {
    id: 'kraft_vintage',
    name: 'Kraft Paper Vintage',
    nameKo: '크래프트 페이퍼 빈티지',
    mood: '아날로그 다이어리 · 스크랩북',
    swatch: 'linear-gradient(145deg,#E4D8C0 0%,#D9CBB4 55%,#B9A585 100%)',
    ink: '#4A3B2A',
    vars: {
      '--c-bg': '#D9CBB4',
      '--c-surface': '#FFFDF7',
      '--c-text': '#463522',
      '--c-muted': '#7A6852',
      '--c-accent': '#8C5B34',
      '--c-line': '#C0AE92',
    },
  },
  ocean_magazine: {
    id: 'ocean_magazine',
    name: 'Ocean Magazine',
    nameKo: '오션 매거진 커버',
    mood: '세련된 매거진 표지',
    swatch: 'linear-gradient(150deg,#0B4F6C 0%,#1B87B8 55%,#EAF6FB 100%)',
    ink: '#0B4F6C',
    vars: {
      '--c-bg': '#FFFFFF',
      '--c-surface': '#F2F9FC',
      '--c-text': '#0B2C3C',
      '--c-muted': '#5C7E8F',
      '--c-accent': '#1B87B8',
      '--c-line': '#D5E7EF',
    },
  },
  pastel_dashboard: {
    id: 'pastel_dashboard',
    name: 'Pastel Dashboard',
    nameKo: '파스텔 대시보드',
    mood: '밝고 친근한 플래너',
    swatch: 'linear-gradient(150deg,#FFF3F0 0%,#FCE4DE 50%,#FBD5CB 100%)',
    ink: '#B4635A',
    vars: {
      '--c-bg': '#FDF2EE',
      '--c-surface': '#FFFFFF',
      '--c-text': '#4A3B38',
      '--c-muted': '#9A8480',
      '--c-accent': '#E88C7D',
      '--c-line': '#F5DED7',
    },
  },
};

export const CONCEPT_LIST = Object.values(CONCEPTS);

export const getConcept = (id: string | undefined): ConceptDef =>
  CONCEPTS[(id as ConceptId) ?? 'cream_elegant'] ?? CONCEPTS.cream_elegant;
