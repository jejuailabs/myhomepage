'use client';

import { useId, useRef, useState } from 'react';

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
}) {
  const id = useId();
  const cls =
    'w-full rounded-xl border border-hub-border bg-hub-surface px-3.5 py-3 text-[14px] outline-none placeholder:text-hub-muted/60 focus:border-hub-text';
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[12px] font-semibold text-hub-muted">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} resize-none`}
        />
      ) : (
        <input
          id={id}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
    </div>
  );
}

export function ImageField({
  label,
  value,
  onPick,
  aspect = 'aspect-[4/5]',
}: {
  label: string;
  value: string;
  onPick: (file: File) => Promise<void>;
  aspect?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handle = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      await onPick(file);
    } catch (e) {
      setErr(e instanceof Error ? e.message : '업로드에 실패했습니다.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-[12px] font-semibold text-hub-muted">{label}</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative w-full overflow-hidden rounded-xl border border-dashed border-hub-border bg-hub-surface ${aspect}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-[13px] text-hub-muted">
            + 사진 올리기
          </span>
        )}
        {busy && (
          <span className="absolute inset-0 grid place-items-center bg-black/40 text-[13px] text-white">
            올리는 중…
          </span>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          void handle(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {err && <p className="mt-1 text-[12px] text-red-500">{err}</p>}
    </div>
  );
}

export function FileButton({
  label,
  hint,
  accept,
  onPick,
}: {
  label: string;
  hint?: string;
  accept: string;
  onPick: (file: File) => Promise<void>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full rounded-xl border border-hub-border bg-hub-surface px-4 py-3 text-[14px] font-semibold"
      >
        {busy ? '올리는 중…' : label}
      </button>
      {hint && <p className="mt-1 text-[12px] text-hub-muted">{hint}</p>}
      {err && <p className="mt-1 text-[12px] text-red-500">{err}</p>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          setBusy(true);
          setErr(null);
          try {
            await onPick(file);
          } catch (error) {
            setErr(error instanceof Error ? error.message : '업로드에 실패했습니다.');
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

export function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-hub-border bg-hub-surface p-4">
      <h2 className="mb-3 text-[15px] font-bold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
