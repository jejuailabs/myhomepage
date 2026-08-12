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
export const maxDuration = 120;

const MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2';
const QUALITY = process.env.OPENAI_IMAGE_QUALITY ?? 'low';
const SIZE = process.env.OPENAI_IMAGE_SIZE ?? '1024x1536';
const MAX_BYTES = 8 * 1024 * 1024;

const PROMPT = `이 셀카 속 인물을 20년 경력 인물사진 작가가 촬영한 듯한 고급 프로필 사진으로 바꿔주세요.

- 메이크업: 은은한 글램, 촉촉하고 윤기 있는 피부, 정돈된 눈썹, 자연스러운 컨투어링, 은은한 립 컬러
- 헤어: 방금 미용실에서 나온 듯 윤기와 볼륨이 살아있는 스타일링. 원본의 머리 길이와 질감은 유지
- 의상: 아이보리·차콜·딥그린 같은 세련된 뉴트럴 톤의 테일러드 블레이저 또는 정장
- 조명: 부드러운 스튜디오 조명, 따뜻한 골든 키라이트와 은은한 림라이트
- 배경: 단색에 가까운 차분한 스튜디오 배경, 인물이 돋보이도록 얕은 심도
- 표정: 자신감 있고 따뜻한 진짜 미소
- 구도: 세로 방향 상반신, 잡지 표지에 쓸 수 있는 여백

가장 중요한 것: 실제 얼굴 생김새와 비율, 나이대는 그대로 유지할 것.
다른 사람이 되면 안 되고 '더 빛나는 본인'이어야 합니다.`;

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
