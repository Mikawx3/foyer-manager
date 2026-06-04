import { Home, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-bg text-stone-600 transition hover:border-primary/30 hover:text-primary"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <User className="h-4 w-4" strokeWidth={2} />
      </button>
      {open && (
        <div
          className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-border bg-surface py-1 shadow-lg"
          role="menu"
        >
          <Link
            to="/households"
            role="menuitem"
            className="flex items-center gap-2 px-3 py-2 text-sm text-stone-700 hover:bg-stone-50"
            onClick={() => setOpen(false)}
          >
            <Home className="h-4 w-4 shrink-0" strokeWidth={2} />
            All households
          </Link>
        </div>
      )}
    </div>
  );
}
