export function BrandMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Caring hands / leaves cradling a warm emerald heart */}
      <path
        d="M24 38.5C24 38.5 11.5 31.2 11.5 21.2C11.5 17.5 14.3 14.5 17.9 14.5C20.3 14.5 22.5 15.8 24 17.8C25.5 15.8 27.7 14.5 30.1 14.5C33.7 14.5 36.5 17.5 36.5 21.2C36.5 31.2 24 38.5 24 38.5Z"
        fill="#135D43"
      />
      <path
        d="M24 27.5C24 27.5 18.8 24.4 18.8 20.5C18.8 18.9 20.1 17.6 21.6 17.6C22.7 17.6 23.6 18.2 24 19.1C24.4 18.2 25.3 17.6 26.4 17.6C27.9 17.6 29.2 18.9 29.2 20.5C29.2 24.4 24 27.5 24 27.5Z"
        fill="#FFFFFF"
      />
      <path
        d="M7 22.5C7 31.5 14.2 38.8 23.2 41.2C15.8 36.8 11.2 30.3 11.2 22.5C11.2 18.6 12.6 15.1 15 12.6C10.1 14.2 7 18.1 7 22.5Z"
        fill="#1B8A5A"
      />
      <path
        d="M41 22.5C41 31.5 33.8 38.8 24.8 41.2C32.2 36.8 36.8 30.3 36.8 22.5C36.8 18.6 35.4 15.1 33 12.6C37.9 14.2 41 18.1 41 22.5Z"
        fill="#27A56E"
      />
    </svg>
  );
}

export function BrandLogo({
  compact = false,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandMark className={compact ? 'h-8 w-8' : 'h-9 w-9'} />
      <span className="text-lg font-extrabold tracking-tight text-[#0E2D24] sm:text-xl">
        CARE BRIDGE
      </span>
    </span>
  );
}

export function BotanicalCorners() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        className="absolute -left-6 -top-6 h-40 w-40 text-[#9AD7B8]/40"
        viewBox="0 0 160 160"
        fill="currentColor"
      >
        <path d="M20 120C20 60 65 18 125 18C120 75 78 120 20 120Z" />
        <path d="M10 68C10 34 38 10 74 10C70 44 45 68 10 68Z" opacity="0.65" />
      </svg>
      <svg
        className="absolute -bottom-8 -right-8 h-48 w-48 text-[#7CC7A1]/35"
        viewBox="0 0 180 180"
        fill="currentColor"
      >
        <path d="M160 40C160 108 108 160 40 160C45 96 95 44 160 40Z" />
        <path d="M170 102C170 142 138 170 98 170C102 132 130 104 170 102Z" opacity="0.7" />
      </svg>
    </div>
  );
}
