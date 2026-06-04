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
      <path
        d="M8 14.5 16 8l8 6.5V24a1 1 0 0 1-1 1h-4.5v-6h-5v6H9a1 1 0 0 1-1-1v-9.5Z"
        className="fill-white"
      />
    </svg>
  );
}
