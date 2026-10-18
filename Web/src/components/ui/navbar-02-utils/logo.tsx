import * as React from 'react';

/** Marca HookHub en React (versión del Logo.astro original). */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-foreground" aria-label="HookHub">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="1.5" y="1.5" width="29" height="29" rx="8" stroke="currentColor" strokeWidth="1.5"></rect>
        <path
          d="M10 8v10a6 6 0 0 0 12 0"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        ></path>
        <circle cx="22" cy="10" r="2.5" fill="currentColor"></circle>
      </svg>
      <span className="font-bold text-lg tracking-tight [font-family:var(--font-heading)]">
        HookHub
      </span>
    </span>
  );
}

export default Logo;
