import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
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
 * Firebase 환경변수가 채워져 있고 USE_MOCK 이 켜져 있지 않을 때만 실제 Firebase 를 사용한다.
 * 미설정 상태에서는 목업 데이터로 UI 전체를 확인할 수 있다.
 */
export const isFirebaseEnabled =
  process.env.NEXT_PUBLIC_USE_MOCK !== 'true' && Boolean(config.apiKey && config.projectId);

let app: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseEnabled) {
    throw new Error('Firebase가 설정되지 않았습니다. .env.local 을 확인하세요.');
  }
  if (!app) {
    app = getApps().length ? getApp() : initializeApp(config as Record<string, string>);
  }
  return app;
}

export const getFirebaseAuth = (): Auth => getAuth(getFirebaseApp());
export const getDb = (): Firestore => getFirestore(getFirebaseApp());
export const getBucket = (): FirebaseStorage => getStorage(getFirebaseApp());
