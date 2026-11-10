// Logo JM: trazos del color del texto (blancos) y punto verde de acento.
export function LogoJM({ className }) {
  return (
    <svg className={className} viewBox="0 0 46 26" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M3 18a5 5 0 0 0 10 0V3M19 23V3l8 11 8-11v20"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="42" cy="21" r="2.4" fill="var(--verde)" />
    </svg>
  );
}
