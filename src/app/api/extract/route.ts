import { NextResponse } from 'next/server';

/**
 * 업로드한 지면 이미지에서 글자 항목을 읽어낸다.
 *
 * 유저는 이미 만들어 둔 "RADIANT ME" 지면 이미지를 올린다.
 * 그 안에 혈액형·MBTI·좋아하는 색·계절 같은 항목이 이미 적혀 있으므로,
 * 다시 타이핑하게 하지 않고 이미지에서 읽어 허브 카드 항목을 채운다.
 */

export const runtime = 'nodejs';
export const maxDuration = 60;

const MODEL = process.env.OPENAI_VISION_MODEL ?? 'gpt-4o-mini';
const MAX_BYTES = 8 * 1024 * 1024;

const INSTRUCTION = `이 이미지는 한 사람을 소개하는 지면입니다.
이미지 안에 적힌 글자를 읽어서 아래 항목의 값을 뽑아 주세요.

- identity: MBTI 또는 혈액형. 둘 다 있으면 "ISFJ / A형" 처럼 합칩니다.
- season: 좋아하는 계절
- color: 좋아하는 색 또는 색깔
- food: 좋아하는 음식
- summary: 인물을 한 문장으로 소개하는 문구. 지면에 인용구나 소개 문장이 있으면 그것을 씁니다.

규칙
- 이미지에 적혀 있는 글자만 씁니다. 없는 항목은 빈 문자열로 둡니다.
- 값은 짧게, 적힌 그대로 옮깁니다. 설명을 덧붙이지 않습니다.
- "-" 나 "없음" 처럼 값이 비어 있음을 뜻하는 표시는 빈 문자열로 처리합니다.
- 반드시 아래 형태의 JSON 하나만 응답합니다.

{"identity":"","season":"","color":"","food":"","summary":""}`;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'OPENAI_API_KEY가 설정되지 않았습니다.' }, { status: 503 });
  }

  let file: File | null = null;
  try {
    const form = await request.formData();
    const value = form.get('file');
    if (value instanceof File) file = value;
  } catch {
    return NextResponse.json({ error: '요청을 읽지 못했습니다.' }, { status: 400 });
  }

  if (!file) return NextResponse.json({ error: '이미지가 없습니다.' }, { status: 400 });
  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: '이미지 파일만 올릴 수 있습니다.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: '이미지가 너무 큽니다.' }, { status: 400 });
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
  const dataUrl = `data:${file.type};base64,${base64}`;

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: INSTRUCTION },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
      error?: { message?: string };
    };

    if (!res.ok) {
      console.error('항목 추출 실패', data);
      return NextResponse.json(
        { error: data.error?.message ?? '이미지에서 항목을 읽지 못했습니다.' },
        { status: res.status },
      );
    }

    const raw = data.choices?.[0]?.message?.content ?? '{}';
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: '읽어온 내용을 해석하지 못했습니다.' }, { status: 502 });
    }

    const clean = (v: unknown) => {
      const s = typeof v === 'string' ? v.trim() : '';
      // "-", "없음" 같은 빈 값 표시는 버린다
      return /^(-+|없음|미상|없다|해당\s*없음)$/.test(s) ? '' : s;
    };

    return NextResponse.json({
      fields: {
        identity: clean(parsed.identity),
        season: clean(parsed.season),
        color: clean(parsed.color),
        food: clean(parsed.food),
      },
      summary: clean(parsed.summary),
    });
  } catch (e) {
    console.error('항목 추출 요청 실패', e);
    return NextResponse.json({ error: '항목 추출 서버에 연결하지 못했습니다.' }, { status: 502 });
  }
}
