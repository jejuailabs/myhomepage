/**
 * 허브 카드를 "탭해서" 개별 홈피로 진입했다는 사실을 세션에 남겨두기 위한 키.
 * 이 값이 현재 slug 와 일치하면 진입 즉시 audio.play() 를 시도하고,
 * 실패하거나 값이 없으면(=URL 직접 접속) "소리 켜고 보기" 폴백 버튼을 노출한다.
 */
export const AUDIO_INTENT_KEY = 'heroes-audio-intent';

export function consumeAudioIntent(slug: string): boolean {
  try {
    const v = sessionStorage.getItem(AUDIO_INTENT_KEY);
    if (v === slug) {
      sessionStorage.removeItem(AUDIO_INTENT_KEY);
      return true;
    }
  } catch {
    /* no-op */
  }
  return false;
}
