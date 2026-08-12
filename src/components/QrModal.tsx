'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

/**
 * 홈피 QR 코드 화면.
 * 화면 중앙에 QR 을 크게 띄우고, 퍼가기용 URL 복사와 나가기를 제공한다.
 */
export default function QrModal({
  url,
  title,
  accent,
  onClose,
}: {
  url: string;
  title: string;
  accent: string;
  onClose: () => void;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(url, {
      width: 720,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#111111', light: '#FFFFFF' },
    })
      .then(setDataUrl)
      .catch(() => setError('QR 코드를 만들지 못했습니다.'));
  }, [url]);

  // 열려 있는 동안 배경 스크롤 잠금 + ESC 로 닫기
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // 클립보드 권한이 없는 환경 폴백
      const ta = document.createElement('textarea');
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="QR 코드"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[340px] rounded-3xl bg-white p-6 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[14px] font-bold text-neutral-800">{title}</p>
        <p className="mt-1 text-[12px] text-neutral-500">
          휴대폰 카메라로 찍으면 바로 열려요
        </p>

        <div className="mx-auto mt-5 grid aspect-square w-full place-items-center overflow-hidden rounded-2xl bg-white ring-1 ring-neutral-200">
          {dataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={dataUrl} alt={`${title} QR 코드`} className="h-full w-full object-contain" />
          ) : (
            <span className="text-[13px] text-neutral-400">{error ?? 'QR 만드는 중…'}</span>
          )}
        </div>

        {/* 퍼가기 URL */}
        <div className="mt-5 text-left">
          <span className="mb-1.5 block text-[11px] font-semibold text-neutral-500">
            퍼가기 주소
          </span>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              aria-label="홈피 주소"
              className="min-w-0 flex-1 rounded-xl bg-neutral-100 px-3 py-2.5 text-[12px] text-neutral-700 outline-none"
            />
            <button
              type="button"
              onClick={copy}
              className="shrink-0 rounded-xl px-3.5 py-2.5 text-[12px] font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              {copied ? '복사됨' : '복사'}
            </button>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          {dataUrl && (
            <a
              href={dataUrl}
              download={`${title}-qr.png`}
              className="flex-1 rounded-2xl bg-neutral-100 py-3 text-[13px] font-bold text-neutral-700"
            >
              이미지 저장
            </a>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl bg-neutral-900 py-3 text-[13px] font-bold text-white"
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}
