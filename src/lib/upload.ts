'use client';

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { getBucket, isFirebaseEnabled } from './firebase';

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

  if (!isFirebaseEnabled) {
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
