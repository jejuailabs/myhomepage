/**
 * 서비스 계정(관리자 권한)으로 도는 운영 스크립트.
 *
 * 이 파일은 내 PC(또는 CI)에서만 실행되고 브라우저로는 절대 나가지 않는다.
 * 그래서 서비스 계정 키를 여기서는 쓸 수 있다. (.env.local 에 넣으면 안 되는 이유는 README 참조)
 *
 * 키 위치: 프로젝트 루트의 serviceAccount.json  (git 에 올라가지 않도록 .gitignore 처리됨)
 *          또는 환경변수 GOOGLE_APPLICATION_CREDENTIALS 에 파일 경로 지정
 *
 * 사용법:
 *   npm run admin -- list                     회원 목록 보기
 *   npm run admin -- make-admin <이메일>       관리자로 승격 + 승인
 *   npm run admin -- approve <이메일>          승인(허브에 공개)
 *   npm run admin -- reject <이메일>           비공개 처리
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const KEY_PATH =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ?? resolve(process.cwd(), 'serviceAccount.json');

let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(KEY_PATH, 'utf8'));
} catch {
  console.error(`
서비스 계정 키 파일을 찾지 못했습니다: ${KEY_PATH}

  1) Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 > "새 비공개 키 생성"
  2) 받은 JSON 파일을 프로젝트 루트에 serviceAccount.json 이름으로 저장
     (이 파일은 .gitignore 에 있어 저장소에 올라가지 않습니다)
`);
  process.exit(1);
}

initializeApp({ cert: cert(serviceAccount), projectId: serviceAccount.project_id });
const db = getFirestore();
const auth = getAuth();

/** 이메일로 users 문서를 찾는다 (Auth 의 uid 를 거쳐서 조회) */
async function findByEmail(email) {
  const record = await auth.getUserByEmail(email).catch(() => null);
  if (!record) {
    throw new Error(`${email} 로 로그인한 기록이 없습니다. 먼저 사이트에서 한 번 로그인해 주세요.`);
  }
  const snap = await db.collection('users').doc(record.uid).get();
  if (!snap.exists) {
    throw new Error(`${email} 의 users 문서가 없습니다. 사이트에서 로그인하면 자동 생성됩니다.`);
  }
  return { uid: record.uid, email, data: snap.data() };
}

async function list() {
  const snap = await db.collection('users').orderBy('order').get();
  if (snap.empty) {
    console.log('등록된 회원이 없습니다.');
    return;
  }
  console.log('uid'.padEnd(30), 'role'.padEnd(8), 'status'.padEnd(10), 'name');
  snap.forEach((d) => {
    const u = d.data();
    console.log(
      d.id.padEnd(30),
      String(u.role).padEnd(8),
      String(u.status).padEnd(10),
      u.displayName ?? '',
    );
  });
}

async function setFields(email, fields, label) {
  const { uid } = await findByEmail(email);
  await db.collection('users').doc(uid).update(fields);
  console.log(`✅ ${email} → ${label}`);
}

const [command, arg] = process.argv.slice(2);

try {
  switch (command) {
    case 'list':
      await list();
      break;
    case 'make-admin':
      if (!arg) throw new Error('이메일을 입력하세요. 예: npm run admin -- make-admin a@b.com');
      await setFields(arg, { role: 'admin', status: 'approved' }, '관리자 + 승인');
      break;
    case 'approve':
      if (!arg) throw new Error('이메일을 입력하세요.');
      await setFields(arg, { status: 'approved' }, '승인');
      break;
    case 'reject':
      if (!arg) throw new Error('이메일을 입력하세요.');
      await setFields(arg, { status: 'rejected' }, '비공개');
      break;
    default:
      console.log(`사용법:
  npm run admin -- list
  npm run admin -- make-admin <이메일>
  npm run admin -- approve <이메일>
  npm run admin -- reject <이메일>`);
  }
} catch (e) {
  console.error(`❌ ${e.message}`);
  process.exit(1);
}
