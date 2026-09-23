interface AppLogoProps {
  className?: string;
}

export function AppLogo({ className = "h-8 w-8" }: AppLogoProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" className="fill-primary" />
      <rect x="7" y="9" width="7" height="14" rx="2" className="fill-white" />
      <rect x="18" y="9" width="7" height="14" rx="2" className="fill-white" />
    </svg>
  );
}
