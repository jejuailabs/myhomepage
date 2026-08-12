import { NextResponse } from 'next/server';

/**
 * 답변 한 줄 → 사진 한 장.
 *
 * 취향 11개, 버킷리스트, 여행지, 강점, 사랑하는 것까지 항목마다 이미지를 붙여야
 * 레퍼런스 같은 화보 지면이 나온다. 장당 저해상도로 뽑아 비용을 눌렀다.
 *
 * 전체를 한 장의 큰 이미지로 생성하지 않고 항목별로 따로 뽑는 이유:
 * 웹페이지라 반응형으로 재배치해야 하고, 나중에 한 항목만 다시 뽑을 수 있어야 하기 때문.
 */

export const runtime = 'nodejs';
export const maxDuration = 300;

const MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-2';
const QUALITY = process.env.OPENAI_IMAGE_QUALITY ?? 'low';
/** 동시 생성 수 — 너무 올리면 rate limit 에 걸린다 */
const CONCURRENCY = 4;
const MAX_ITEMS = 24;

/** 지면 전체가 한 벌처럼 보이도록 모든 컷에 같은 아트디렉션을 건다 */
const ART_DIRECTION = [
  '따뜻한 크림·베이지 톤의 편집 사진',
  '부드러운 자연광, 얕은 심도, 필름 같은 질감',
  '차분하고 고급스러운 라이프스타일 매거진 화보',
  '정사각 구도, 여백이 있는 정돈된 프레이밍',
  '글자·로고·워터마크 없음, 사람 얼굴 클로즈업 없음',
].join(', ');

interface ItemRequest {
  key: string;
  /** 항목명 (예: 좋아하는 음식) */
  category?: string;
  /** 답변 (예: 닭갈비) */
  value: string;
}

function buildPrompt(item: ItemRequest): string {
  const subject = item.category ? `${item.category}: ${item.value}` : item.value;
  return `"${subject}"를 상징하는 사진 한 장. ${ART_DIRECTION}.`;
}

async function generateOne(apiKey: string, item: ItemRequest) {
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      prompt: buildPrompt(item),
      quality: QUALITY,
      size: '1024x1024',
      n: 1,
    }),
  });

  const data = (await res.json()) as {
    data?: { b64_json?: string; url?: string }[];
    error?: { message?: string };
  };

  if (!res.ok) {
    return { key: item.key, error: data.error?.message ?? '생성 실패' };
  }
  const first = data.data?.[0];
  if (first?.b64_json) {
    return { key: item.key, dataUrl: `data:image/png;base64,${first.b64_json}` };
  }
  if (first?.url) return { key: item.key, dataUrl: first.url };
  return { key: item.key, error: '응답에 이미지가 없습니다.' };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY가 설정되지 않았습니다.' },
      { status: 503 },
    );
  }

  let items: ItemRequest[];
  try {
    const body = (await request.json()) as { items?: ItemRequest[] };
    items = (body.items ?? []).filter((i) => i?.key && i?.value?.trim());
  } catch {
    return NextResponse.json({ error: '요청을 읽지 못했습니다.' }, { status: 400 });
  }

  if (items.length === 0) {
    return NextResponse.json({ error: '생성할 항목이 없습니다.' }, { status: 400 });
  }
  if (items.length > MAX_ITEMS) {
    return NextResponse.json(
      { error: `한 번에 ${MAX_ITEMS}개까지만 생성할 수 있습니다.` },
      { status: 400 },
    );
  }

  const results: { key: string; dataUrl?: string; error?: string }[] = [];
  for (let i = 0; i < items.length; i += CONCURRENCY) {
    const batch = items.slice(i, i + CONCURRENCY);
    const settled = await Promise.all(
      batch.map((item) =>
        generateOne(apiKey, item).catch(() => ({ key: item.key, error: '요청 실패' })),
      ),
    );
    results.push(...settled);
  }

  return NextResponse.json({ results });
}
