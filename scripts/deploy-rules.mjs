/**
 * 보안 규칙(Firestore/Storage) 자동 배포.
 *
 * firebase CLI 는 배포 전에 serviceusage API 로 "API 활성화 확인"을 하는데,
 * Firebase Admin SDK 서비스 계정에는 그 권한이 없어 403 이 난다.
 * 그래서 Firebase Rules API 를 직접 호출한다(권한 요구사항이 더 좁다).
 *
 * 사용법:
 *   npm run deploy:rules
 *
 * 키 위치: serviceAccount.json (또는 GOOGLE_APPLICATION_CREDENTIALS 환경변수)
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GoogleAuth } from 'google-auth-library';

const KEY_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ?? resolve(process.cwd(), 'serviceAccount.json');

let key;
try {
  key = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
} catch {
  console.error(`서비스 계정 키를 찾지 못했습니다: ${KEY_PATH}`);
  process.exit(1);
}

const projectId = key.project_id;
const auth = new GoogleAuth({
  keyFile: KEY_PATH,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});
const client = await auth.getClient();
const API = 'https://firebaserules.googleapis.com/v1';

/** 규칙 소스를 올려 ruleset 을 만들고, 그 ruleset 을 release 에 연결한다. */
async function deployRules(releaseId, fileName, localPath) {
  const content = readFileSync(resolve(process.cwd(), localPath), 'utf8');

  const ruleset = await client.request({
    url: `${API}/projects/${projectId}/rulesets`,
    method: 'POST',
    data: { source: { files: [{ name: fileName, content }] } },
  });
  const rulesetName = ruleset.data.name;

  const releaseName = `projects/${projectId}/releases/${releaseId}`;
  try {
    // 이미 release 가 있으면 갱신
    await client.request({
      url: `${API}/${releaseName}`,
      method: 'PATCH',
      data: { release: { name: releaseName, rulesetName } },
    });
  } catch (e) {
    if (e.response?.status !== 404) throw e;
    // 없으면 새로 생성
    await client.request({
      url: `${API}/projects/${projectId}/releases`,
      method: 'POST',
      data: { name: releaseName, rulesetName },
    });
  }

  console.log(`✅ ${releaseId} ← ${localPath}`);
  console.log(`   ruleset: ${rulesetName}`);
}

const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? `${projectId}.firebasestorage.app`;

const targets = [
  { releaseId: 'cloud.firestore', fileName: 'firestore.rules', path: 'firestore.rules' },
  { releaseId: `firebase.storage/${bucket}`, fileName: 'storage.rules', path: 'storage.rules' },
];

let failed = false;
for (const t of targets) {
  try {
    await deployRules(t.releaseId, t.fileName, t.path);
  } catch (e) {
    failed = true;
    const detail = e.response?.data?.error?.message ?? e.message;
    console.error(`❌ ${t.releaseId} 배포 실패: ${detail}`);
  }
}
process.exit(failed ? 1 : 0);
