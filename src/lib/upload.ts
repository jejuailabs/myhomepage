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
  maxSide = 720,
  quality = 0.82,
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
