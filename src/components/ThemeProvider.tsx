'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
}

const Ctx = createContext<ThemeCtx>({ theme: 'light', toggle: () => {} });

export const STORAGE_KEY = 'heroes-theme';

/**
 * 다크/라이트 테마는 메인 허브 및 관리/제작 화면에만 적용된다.
 * 개별 홈피(/h/[slug])는 컨셉 고유 팔레트를 고정 사용하므로 이 토글의 영향을 받지 않는다.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    const initial =
      stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  }, []);

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

/** SSR 시 first paint 깜빡임(FOUC) 방지용 인라인 스크립트 */
export const themeInitScript = `
(function(){try{
  var s=localStorage.getItem('${STORAGE_KEY}');
  var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;
  if(d){document.documentElement.classList.add('dark');}
  document.documentElement.dataset.theme=d?'dark':'light';
}catch(e){}})();
`;
