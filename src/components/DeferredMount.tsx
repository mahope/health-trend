"use client";

import * as React from "react";

type Props = {
  children: React.ReactNode;
  /** How early the browser should mount content before it enters viewport. */
  rootMargin?: string;
  /** Placeholder shown until mounted. */
  placeholder?: React.ReactNode;
};

export function DeferredMount({
  children,
  rootMargin = "600px 0px",
  placeholder,
}: Props) {
  const [mounted, setMounted] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (mounted) return;

    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setMounted(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setMounted(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted, rootMargin]);

  return <div ref={ref}>{mounted ? children : placeholder ?? null}</div>;
}
