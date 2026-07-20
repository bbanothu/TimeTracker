import type { ReactNode } from 'react';

export function AuthBackground({
  children,
  image = '/assets/login1.jpg',
}: {
  children: ReactNode;
  image?: string;
}) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px]" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
