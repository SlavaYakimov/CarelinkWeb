'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

/** Moves focus to the first heading in `#main` after client navigations (a11y route change). */
export function useRouteMainFocus(mainRef: React.RefObject<HTMLElement | null>) {
  const pathname = usePathname();
  const skipNextFocus = React.useRef(true);

  React.useEffect(() => {
    if (skipNextFocus.current) {
      skipNextFocus.current = false;
      return;
    }
    const main = mainRef.current;
    if (!main) return;
    const heading = main.querySelector('h1');
    const target = heading instanceof HTMLElement ? heading : main;
    if (target === heading) {
      heading.setAttribute('tabindex', '-1');
    }
    target.focus({ preventScroll: false });
  }, [pathname, mainRef]);
}
