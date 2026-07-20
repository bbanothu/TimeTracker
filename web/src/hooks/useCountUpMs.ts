import { useEffect, useRef, useState } from 'react';

export function useCountUpMs(targetMs: number, durationMs = 700) {
  const [value, setValue] = useState(0);
  const previousTarget = useRef(0);

  useEffect(() => {
    const from = previousTarget.current;
    previousTarget.current = targetMs;
    const start = Date.now();
    let frame = 0;

    const step = () => {
      const elapsed = Date.now() - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(from + (targetMs - from) * eased));
      if (t < 1) frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [targetMs, durationMs]);

  return value;
}
