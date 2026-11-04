import * as React from 'react';
import { cn } from '@/lib/utils';

export type LogoProps = React.ImgHTMLAttributes<HTMLImageElement>;

/** Owl-with-book avatar — source: `public/brand/owl-header.svg` (SVGO from carelink-owl-avatar). */
export function Logo({ className, alt = 'Carelink', ...props }: LogoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- brand SVG asset; small and cacheable
    <img
      src="/brand/owl-header.svg"
      alt={alt}
      width={1000}
      height={1120}
      decoding="async"
      className={cn('size-full object-contain', className)}
      {...props}
    />
  );
}
