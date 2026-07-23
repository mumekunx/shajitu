import { useEffect, useState } from 'react';

/**
 * TailwindのCSSブレークポイント`lg`(1024px)と完全に一致させるためのメディアクエリ文字列。
 * JS側でデスクトップ/モバイルを判定する箇所は、必ずこの定数を通して`useMediaQuery`を呼ぶこと
 * (別の基準値を独自に持つと、CSS側の`lg:`と食い違うバグの温床になる)。
 */
export const DESKTOP_MEDIA_QUERY = '(min-width: 1024px)';

/**
 * `window.matchMedia`を購読し、指定クエリの真偽値をReact stateとして返すフック。
 * コンテナ要素の実測サイズ(ResizeObserver等)ではなく、常にビューポート基準でCSSの
 * ブレークポイントと同じ判定をしたい場合に使う。SSRは行わないため、初期値は
 * `window.matchMedia(query).matches`をそのまま使う。
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handleChange = () => setMatches(mql.matches);
    handleChange();
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, [query]);

  return matches;
}
