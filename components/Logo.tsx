// Hook Echo brand mark. A "hook echo" is the hook-shaped radar return of a
// rotating, often tornadic supercell, so the mark is that hook swung inside a
// radar ring. Single simple geometric mark (allowed brand-logo exception).

export function LogoMark({
  size = 28,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      role="img"
      aria-label="Hook Echo"
    >
      {/* radar ring */}
      <circle cx="16" cy="16" r="13.2" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.4" />
      <circle cx="16" cy="16" r="8" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.2" />
      {/* the hook echo: a comma/hook sweeping into the core */}
      <path
        d="M16 5.5 C 23.2 5.5 27 11 25.6 17 C 24.6 21.4 20.6 24 16.4 23.2 C 13.4 22.6 11.6 20 12 17.2 C 12.3 15.2 14 13.9 15.9 14.2 C 17.2 14.4 18 15.5 17.8 16.7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* core return */}
      <circle cx="16" cy="16" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function Logo({
  className = "",
  markSize = 28,
}: {
  className?: string;
  markSize?: number;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={markSize} className="text-storm-400" />
      <span className="text-[15px] font-semibold tracking-tight text-slate-100">
        Hook<span className="text-storm-400"> Echo</span>
      </span>
    </span>
  );
}
