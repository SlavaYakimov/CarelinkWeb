import * as React from 'react';
import { OwlMarkPaths } from '@/components/brand/owl-mark';
import { cn } from '@/lib/utils';

export type LogoProps = React.SVGProps<SVGSVGElement>;

/** Inline owl — `currentColor`; source asset: `public/brand/owl.svg`. */
export function Logo({ className, ...props }: LogoProps) {
  return (
    <svg
      role="img"
      aria-label="Carelink"
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('size-full', className)}
      {...props}
    >
      <OwlMarkPaths fill="currentColor" stroke="currentColor" />
    </svg>
  );
}
