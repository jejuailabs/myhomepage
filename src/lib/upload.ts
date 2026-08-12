'use client';

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getBucket, useMock } from './firebase';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

/**
 * Storage 업로드. 경로 규칙은 docs/03 을 따른다.
 *   /uploads/{uid}/profile.jpg | hero.jpg | audio.mp3 | sections/{sectionId}/{imageId}.jpg
 * Firebase 미설정(목업) 모드에서는 브라우저 로컬 dataURL 로 대체해 미리보기만 가능하게 한다.
 */
export async function uploadFile(uid: string, path: string, file: File): Promise<string> {
  const isAudio = file.type.startsWith('audio/');
  const max = isAudio ? MAX_AUDIO_BYTES : MAX_IMAGE_BYTES;
  if (file.size > max) {
    throw new Error(
      `파일이 너무 큽니다. ${Math.round(max / 1024 / 1024)}MB 이하로 올려주세요.`,
    );
  }

  if (useMock) {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
      reader.readAsDataURL(file);
    });
  }

  const storageRef = ref(getBucket(), `uploads/${uid}/${path}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  return await getDownloadURL(storageRef);
}

export const sectionImagePath = (sectionId: string, imageId: string) =>
  `sections/${sectionId}/${imageId}`;

/**
 * 생성된 이미지를 줄여서 올린다.
 *
 * gpt-image-2 는 1024px PNG 로 장당 2MB 가 넘게 나온다. 한 홈피에 20장이면 40MB 라
 * 그대로 두면 모바일에서 열리지 않는다. 화면에 쓰이는 최대 크기로 줄이고 JPEG 로 바꾼다.
 */
export async function compressDataUrl(
  dataUrl: string,
  // 허브 카드는 고해상도 화면에서 폭 900px 가까이 차지한다.
  // 720px 로 줄였더니 눈에 띄게 뭉개졌다.
  maxSide = 1536,
  quality = 0.92,
): Promise<Blob> {
  const img = document.createElement('img');
  img.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('생성된 이미지를 읽지 못했습니다.'));
    img.src = dataUrl;
  });

  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('이미지를 변환하지 못했습니다.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  if (!blob) throw new Error('이미지를 변환하지 못했습니다.');
  return blob;
}

/** 생성된 이미지(dataURL)를 압축해 Storage 에 올리고 URL 을 돌려준다 */
export async function uploadGenerated(
  uid: string,
  path: string,
  dataUrl: string,
): Promise<string> {
  const blob = await compressDataUrl(dataUrl);
  const file = new File([blob], path.split('/').pop() ?? 'image.jpg', { type: 'image/jpeg' });
  return uploadFile(uid, path, file);
}

/**
 * 서버로 보내기 전에 입력 이미지를 줄인다.
 *
 * 원본이 클수록 생성 요청이 오래 걸리는데, Vercel 함수 실행 한도가 60초라
 * 여유를 벌어야 한다. 인물을 알아보고 글자를 읽는 데는 이 정도면 충분하다.
 */
export async function shrinkForApi(file: File, maxSide = 1024): Promise<File> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });

  try {
    const blob = await compressDataUrl(dataUrl, maxSide, 0.9);
    // 줄인 결과가 더 크면 원본을 그대로 쓴다
    if (blob.size >= file.size) return file;
    return new File([blob], 'input.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
