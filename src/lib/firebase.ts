import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { initializeFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * 목업 모드는 **명시적으로 켰을 때만** 동작한다.
 * 환경변수 누락을 목업으로 대신 때우면, Vercel 에 키를 안 넣었을 때
 * 실서비스에 가짜 샘플 데이터가 그대로 노출되기 때문이다.
 * 설정도 없고 목업도 아니면 조용히 넘어가지 않고 명확히 실패시킨다.
 */
export const useMock = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

export const isFirebaseEnabled = !useMock && Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseEnabled) {
    throw new Error(
      'Firebase 환경변수(NEXT_PUBLIC_FIREBASE_*)가 설정되지 않았습니다. ' +
        '로컬은 .env.local, 배포는 Vercel 환경변수를 확인하세요.',
    );
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(config as Record<string, string>);
  }
  return app;
}

export const getFirebaseAuth = (): Auth => getAuth(getFirebaseApp());

let db: Firestore | null = null;

/**
 * Firestore 는 기본적으로 WebChannel 스트리밍으로 통신하는데,
 * 사내망·VPN·방화벽·일부 백신이 이 스트림을 끊으면
 * "Failed to get document because the client is offline" 오류가 난다.
 * long polling 을 자동 감지하도록 켜서 그런 망에서도 붙게 한다.
 * (그래도 안 되면 experimentalForceLongPolling: true 로 바꿔 강제한다.)
 */
export const getDb = (): Firestore => {
  if (!db) {
    db = initializeFirestore(getFirebaseApp(), {
      experimentalAutoDetectLongPolling: true,
    });
  }
  return db;
};

export const getBucket = (): FirebaseStorage => getStorage(getFirebaseApp());
