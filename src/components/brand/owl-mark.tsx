import * as React from 'react';

/** Shared geometry from `public/brand/owl.svg` (viewBox 0 0 512 512). */
export function OwlMarkPaths({
  fill = 'currentColor',
  stroke = 'currentColor',
}: {
  fill?: string;
  stroke?: string;
}) {
  return (
    <>
      <path
        fill={fill}
        fillRule="evenodd"
        d="M132 60 L196 132 Q256 116 316 132 L380 60 L392 168 Q440 226 440 300 Q440 410 352 456 Q306 480 256 480 Q206 480 160 456 Q72 410 72 300 Q72 226 120 168 Z M190 168 a70 70 0 1 0 0.1 0 Z M322 168 a70 70 0 1 0 0.1 0 Z M256 270 L238 300 L256 336 L274 300 Z M214 372 q14 18 28 0 q-14 8 -28 0 Z M270 372 q14 18 28 0 q-14 8 -28 0 Z M242 404 q14 18 28 0 q-14 8 -28 0 Z M186 404 q14 18 28 0 q-14 8 -28 0 Z M298 404 q14 18 28 0 q-14 8 -28 0 Z"
      />
      <circle fill={fill} cx="190" cy="238" r="34" />
      <circle fill={fill} cx="322" cy="238" r="34" />
      <circle fill="none" stroke={stroke} strokeWidth="10" cx="190" cy="238" r="50" />
      <circle fill="none" stroke={stroke} strokeWidth="10" cx="322" cy="238" r="50" />
    </>
  );
}
