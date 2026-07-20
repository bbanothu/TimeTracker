import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface ExpandableDetailsProps {
  expanded: boolean;
  children: ReactNode;
  className?: string;
}

export function ExpandableDetails({ expanded, children, className = '' }: ExpandableDetailsProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) return;

    const measure = () => setContentHeight(node.scrollHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div
      className="overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ height: expanded ? contentHeight : 0 }}
    >
      <div ref={contentRef} className={className}>
        {children}
      </div>
    </div>
  );
}

export function ExpandChevron({ expanded, color }: { expanded: boolean; color: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
