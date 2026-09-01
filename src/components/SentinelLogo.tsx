export function SentinelLogo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Sentinel AI logo"
      role="img"
    >
      <rect width="40" height="40" rx="8" fill="url(#sentinel-grad)" />
      <path
        d="M20 8L30 14V22C30 28 25.5 33 20 34C14.5 33 10 28 10 22V14L20 8Z"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M16 20L19 23L25 17"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="sentinel-grad" x1="0" y1="0" x2="40" y2="40">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function SentinelWordmark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <SentinelLogo size={32} />
      <span className="text-lg font-semibold tracking-tight text-text-primary">
        SENTINEL <span className="text-accent-cyan">AI</span>
      </span>
    </div>
  );
}
