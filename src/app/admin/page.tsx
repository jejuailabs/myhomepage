'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import ThemeToggle from '@/components/ThemeToggle';
import { fetchAllUsers, saveUserOrder, setUserStatus } from '@/lib/repo';
import type { AppUser, UserStatus } from '@/lib/types';

const STATUS_LABEL: Record<UserStatus, string> = {
  pending: '승인 대기',
  approved: '공개중',
  rejected: '비공개',
};

export default function AdminPage() {
  const { appUser, loading } = useAuth();
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const isAdmin = appUser?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    fetchAllUsers().then(setUsers).catch(() => setUsers([]));
  }, [isAdmin]);

  if (loading) return <Centered>불러오는 중…</Centered>;
  if (!isAdmin) {
    return (
      <Centered>
        <p className="text-sm font-semibold">관리자만 접근할 수 있는 화면입니다.</p>
        <Link href="/" className="mt-4 inline-block text-sm underline underline-offset-2">
          허브로 돌아가기
        </Link>
      </Centered>
    );
  }

  const changeStatus = async (uid: string, status: UserStatus) => {
    setBusy(true);
    try {
      await setUserStatus(uid, status);
      setUsers((prev) => prev?.map((u) => (u.uid === uid ? { ...u, status } : u)) ?? prev);
    } finally {
      setBusy(false);
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    setUsers((prev) => {
      if (!prev) return prev;
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((u, i) => ({ ...u, order: i }));
    });
  };

  const persistOrder = async () => {
    if (!users) return;
    setBusy(true);
    try {
      await saveUserOrder(users.map((u, i) => ({ uid: u.uid, order: i })));
      setToast('정렬 순서를 저장했습니다.');
    } catch {
      setToast('저장에 실패했습니다.');
    } finally {
      setBusy(false);
      setTimeout(() => setToast(null), 2500);
    }
  };

  return (
    <main className="mx-auto min-h-[100dvh] w-full max-w-frame pb-28">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-hub-border bg-hub-bg/90 px-5 py-3 backdrop-blur">
        <Link href="/" className="text-[13px] font-semibold">
          ← 허브
        </Link>
        <h1 className="text-[15px] font-bold">관리자</h1>
        <ThemeToggle />
      </header>

      <div className="space-y-2.5 px-5 py-5">
        <p className="text-[12px] text-hub-muted">
          위/아래 화살표로 허브 카드 노출 순서를 바꾸고, 아래 저장 버튼을 눌러 반영하세요.
        </p>

        {users === null ? (
          <p className="py-10 text-center text-sm text-hub-muted">불러오는 중…</p>
        ) : users.length === 0 ? (
          <p className="py-10 text-center text-sm text-hub-muted">등록된 회원이 없습니다.</p>
        ) : (
          users.map((u, i) => (
            <div
              key={u.uid}
              className="flex items-center gap-3 rounded-2xl border border-hub-border bg-hub-surface p-3"
            >
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="px-1 text-[13px] disabled:opacity-25"
                  aria-label="위로"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === users.length - 1}
                  className="px-1 text-[13px] disabled:opacity-25"
                  aria-label="아래로"
                >
                  ▼
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">
                  {u.displayName}
                  {u.role === 'admin' && (
                    <span className="ml-1.5 text-[11px] text-hub-muted">관리자</span>
                  )}
                </p>
                <p className="truncate text-[12px] text-hub-muted">
                  /h/{u.slug} · {STATUS_LABEL[u.status]}
                </p>
              </div>

              <select
                value={u.status}
                disabled={busy}
                onChange={(e) => void changeStatus(u.uid, e.target.value as UserStatus)}
                className="rounded-lg border border-hub-border bg-hub-bg px-2 py-1.5 text-[12px]"
                aria-label={`${u.displayName} 상태 변경`}
              >
                <option value="pending">승인 대기</option>
                <option value="approved">공개</option>
                <option value="rejected">비공개</option>
              </select>
            </div>
          ))
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-frame border-t border-hub-border bg-hub-bg/95 px-5 pb-[max(14px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        {toast && <p className="mb-2 text-center text-[12px] text-hub-muted">{toast}</p>}
        <button
          type="button"
          onClick={persistOrder}
          disabled={busy}
          className="w-full rounded-2xl bg-hub-text py-3.5 text-[15px] font-bold text-hub-bg disabled:opacity-60"
        >
          정렬 순서 저장
        </button>
      </div>
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto grid min-h-[100dvh] max-w-frame place-items-center px-8 text-center">
      <div>{children}</div>
    </main>
  );
}
