import type { ConceptId } from '@/lib/types';

/**
 * 컨셉별 시각 스킨.
 * 섹션 구조(01~05 + 클로징)는 6종 모두 동일하고, 아래 스킨만 달라진다.
 */
export interface Skin {
  /** 페이지 배경 (CSS background 속성 값) */
  pageBg: string;
  /** 배경 위에 얹는 질감 유틸 클래스 */
  pageClass: string;
  /** 프로필 헤더 레이아웃 */
  hero: 'side' | 'cover' | 'badge' | 'polaroid' | 'framed' | 'dashboard';
  /** 섹션 카드 */
  card: string;
  /** 섹션 번호 라벨 */
  numberLabel: string;
  /** 섹션 제목 */
  sectionTitle: string;
  /** 슬로건 타이포 */
  slogan: string;
  /** 이미지 프레임 */
  imageFrame: string;
  /** 폴라로이드처럼 기울이기 */
  tilt: boolean;
}

export const SKINS: Record<ConceptId, Skin> = {
  cream_elegant: {
    pageBg: 'linear-gradient(180deg,#F7F3EC 0%,#F1E9DB 100%)',
    pageClass: '',
    hero: 'side',
    card: 'rounded-3xl bg-[#FFFDF8] shadow-[0_6px_24px_rgba(90,74,58,0.10)] ring-1 ring-[#E4D9C6]',
    numberLabel: 'font-serif text-[11px] tracking-[0.3em] text-[#B99458]',
    sectionTitle: 'font-serif text-[20px] font-bold text-[#5A4A3A]',
    slogan: 'font-serif text-[17px] leading-relaxed text-[#5A4A3A]',
    imageFrame: 'rounded-2xl',
    tilt: false,
  },
  dark_forest: {
    pageBg: 'linear-gradient(180deg,#16261D 0%,#0E1A14 45%,#050A07 100%)',
    pageClass: '',
    hero: 'badge',
    card: 'rounded-2xl bg-[#17251D]/80 ring-1 ring-[#2B3B32] backdrop-blur',
    numberLabel:
      'font-serif text-[11px] italic tracking-[0.35em] text-[#D9C08B]',
    sectionTitle: 'font-serif text-[20px] font-normal tracking-wide text-[#F2EFE8]',
    slogan: 'font-serif text-[18px] italic leading-relaxed text-[#D9C08B]',
    imageFrame: 'rounded-xl ring-1 ring-[#2B3B32]',
    tilt: false,
  },
  lavender_soft: {
    pageBg:
      'radial-gradient(120% 60% at 80% 0%, #E3D2F5 0%, transparent 60%), linear-gradient(180deg,#F5F0FC 0%,#E8DFF0 100%)',
    pageClass: '',
    hero: 'framed',
    card: 'rounded-[26px] bg-white/85 shadow-[0_8px_28px_rgba(122,90,170,0.12)] backdrop-blur',
    numberLabel: 'text-[11px] font-semibold tracking-[0.3em] text-[#9A6FD1]',
    sectionTitle: 'text-[19px] font-bold text-[#4C3B66]',
    slogan: 'font-hand text-[26px] leading-snug text-[#6B5291]',
    imageFrame: 'rounded-[22px]',
    tilt: false,
  },
  kraft_vintage: {
    pageBg: 'linear-gradient(180deg,#DFD2BC 0%,#D3C4AA 100%)',
    pageClass: 'paper-grain',
    hero: 'polaroid',
    card: 'rounded-sm bg-[#FFFDF7] shadow-[3px_4px_10px_rgba(70,53,34,0.22)] ring-1 ring-[#C0AE92]',
    numberLabel:
      'font-mono text-[11px] uppercase tracking-[0.35em] text-[#8C5B34]',
    sectionTitle: 'font-hand text-[26px] leading-none text-[#463522]',
    slogan: 'font-hand text-[27px] leading-snug text-[#463522]',
    imageFrame: 'rounded-none border-[10px] border-b-[36px] border-white shadow-md',
    tilt: true,
  },
  ocean_magazine: {
    pageBg: 'linear-gradient(180deg,#FFFFFF 0%,#F2F9FC 100%)',
    pageClass: '',
    hero: 'cover',
    card: 'rounded-lg bg-white shadow-[0_4px_18px_rgba(11,79,108,0.10)] ring-1 ring-[#D5E7EF]',
    numberLabel: 'text-[11px] font-black uppercase tracking-[0.32em] text-[#1B87B8]',
    sectionTitle: 'text-[21px] font-black uppercase tracking-tight text-[#0B2C3C]',
    slogan: 'text-[16px] font-medium leading-relaxed text-[#0B2C3C]',
    imageFrame: 'rounded-md',
    tilt: false,
  },
  pastel_dashboard: {
    pageBg: 'linear-gradient(180deg,#FFF6F2 0%,#FBE7E0 100%)',
    pageClass: '',
    hero: 'dashboard',
    card: 'rounded-[24px] bg-white shadow-[0_6px_20px_rgba(200,140,125,0.16)]',
    numberLabel: 'text-[11px] font-bold tracking-[0.25em] text-[#E88C7D]',
    sectionTitle: 'text-[19px] font-extrabold text-[#4A3B38]',
    slogan: 'text-[16px] font-semibold leading-relaxed text-[#B4635A]',
    imageFrame: 'rounded-[20px]',
    tilt: false,
  },
};
