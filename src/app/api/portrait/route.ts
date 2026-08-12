import { NextResponse } from 'next/server';

/**
 * 셀카 1장 → 화보급 프로필 사진 1장.
 *
 * 이 홈피에서 생성하는 이미지는 이 커버 한 장뿐이다.
 * 나머지 섹션은 사진 없이 타이포그래피로 완성되도록 디자인되어 있다.
 *
 * 키는 서버에서만 읽는다. NEXT_PUBLIC_ 접두사를 붙이면 브라우저 번들에 박히므로 절대 금지.
 */

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel Hobby 상한

const MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2';
/**
 * 이 사진은 허브 카드에 크게 걸리는 유일한 사진이라 화질이 곧 첫인상이다.
 * low 는 눈에 띄게 뭉개져서 medium 으로 올렸다.
 * high 는 실측 121초가 걸려 Vercel 함수 실행 한도(60초)를 넘기므로 쓸 수 없다.
 * medium 은 실측 50초. 입력 이미지를 미리 줄여 보내 여유를 둔다.
 */
const QUALITY = process.env.OPENAI_PORTRAIT_QUALITY ?? 'medium';
const SIZE = process.env.OPENAI_IMAGE_SIZE ?? '1024x1536';
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * 이전 프롬프트에는 "원본의 머리 길이와 질감은 유지"와 "나이대는 그대로 유지"가 들어 있었다.
 * 헤어스타일을 바꿔달라면서 유지하라고 같이 적어 놓아 스타일링이 반영되지 않았다.
 * 바꿀 것(헤어·메이크업·의상·나이)과 지킬 것(동일 인물 식별성)을 분리해서 적는다.
 */
const PROMPT = `이 사진 속 인물을 20년 경력 인물사진 작가가 촬영한 고급 프로필 사진으로 새로 연출해 주세요.

[먼저 인물만 골라낼 것]
- 입력 이미지가 여러 사진을 모아 붙인 지면이나 콜라주, 문서 형태일 수 있습니다.
  그런 경우 가장 크게 나온 주인공 인물 한 명만 골라서 그 사람의 인물사진을 만듭니다.
- 원본에 있던 글자, 제목, 표, 다른 작은 사진, 테두리, 여백은 전부 버립니다.
- 결과물은 오직 인물 한 명만 담긴 세로 인물사진이어야 합니다. 콜라주가 되면 안 됩니다.
- 인물이 화면을 가득 채우도록 상반신 위주로 크게 잡습니다.

[반드시 바꿀 것]
- 헤어: 미용실에서 방금 손질한 것처럼 완전히 새로 스타일링합니다.
  뿌리부터 볼륨을 살리고 윤기 있게 결을 정돈하며, 잔머리와 헤어라인을 깔끔하게 정리합니다.
  눌리거나 헝클어진 원본 머리 상태는 그대로 두지 말고 반드시 손질된 상태로 바꿉니다.
- 나이: 실제보다 10년쯤 젊어 보이게 합니다.
  피부 결을 매끈하게 하고 잔주름과 그늘, 처진 부분을 자연스럽게 정돈합니다.
  단 성형한 듯 인위적이면 안 되고, 건강하고 생기 있어 보이는 정도까지만 합니다.
- 메이크업: 은은한 글램. 촉촉하고 윤기 있는 피부 표현, 정돈된 눈썹, 자연스러운 컨투어링, 은은한 립 컬러
- 의상: 아이보리·차콜·딥그린 같은 세련된 뉴트럴 톤의 테일러드 블레이저 또는 정장으로 갈아입힙니다.
- 조명: 부드러운 스튜디오 조명, 따뜻한 골든 키라이트와 은은한 림라이트
- 배경: 단색에 가까운 차분한 스튜디오 배경, 얕은 심도
- 표정: 자신감 있고 따뜻한 진짜 미소
- 구도: 세로 방향 상반신, 잡지 표지에 쓸 수 있는 여백

[반드시 지킬 것]
- 눈·코·입의 생김새와 얼굴 비율, 골격은 그대로 두어 같은 사람으로 알아볼 수 있어야 합니다.
- 다른 사람으로 바뀌면 안 됩니다. '10년 젊고 잘 차려입은 본인'이어야 합니다.`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY가 설정되지 않았습니다. 서버 환경변수를 확인해 주세요.' },
      { status: 503 },
    );
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get('file');
    if (value instanceof File) file = value;
  } catch {
    return NextResponse.json({ error: '요청을 읽지 못했습니다.' }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: '셀카 파일이 없습니다.' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: '이미지 파일만 올릴 수 있습니다.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: '사진이 너무 큽니다. 8MB 이하로 올려주세요.' }, { status: 400 });
  }

  const payload = new FormData();
  payload.append('model', MODEL);
  payload.append('prompt', PROMPT);
  payload.append('quality', QUALITY);
  payload.append('size', SIZE);
  payload.append('n', '1');
  payload.append('image', file, file.name || 'selfie.png');

  try {
    const res = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: payload,
    });

    const data = (await res.json()) as {
      data?: { b64_json?: string; url?: string }[];
      error?: { message?: string };
    };

    if (!res.ok) {
      console.error('이미지 생성 실패', data);
      return NextResponse.json(
        { error: data.error?.message ?? '사진을 만들지 못했습니다.' },
        { status: res.status },
      );
    }

    const first = data.data?.[0];
    if (first?.b64_json) {
      return NextResponse.json({ dataUrl: `data:image/png;base64,${first.b64_json}` });
    }
    if (first?.url) {
      return NextResponse.json({ dataUrl: first.url });
    }
    return NextResponse.json({ error: '응답에 이미지가 없습니다.' }, { status: 502 });
  } catch (e) {
    console.error('이미지 생성 요청 실패', e);
    return NextResponse.json({ error: '이미지 생성 서버에 연결하지 못했습니다.' }, { status: 502 });
  }
}
