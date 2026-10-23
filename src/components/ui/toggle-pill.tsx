import type { ReactNode } from "react";

type TogglePillProps = {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
  activeClassName?: string;
  inactiveClassName?: string;
};

/**
 * Reusable pill-style toggle button. Its accessible name is its visible text
 * (`children`); `aria-pressed` tells whether it is on.
 */
export function TogglePill({
  pressed,
  onClick,
  children,
  className = "",
  activeClassName,
  inactiveClassName,
}: TogglePillProps) {
  const baseClasses =
    "rounded-full px-4 py-2.5 text-base font-medium outline-hidden transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
  const activeClasses =
    activeClassName ?? "bg-primary text-white hover:bg-primary-dark";
  const inactiveClasses =
    inactiveClassName ??
    "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600";

  const stateClasses = pressed ? activeClasses : inactiveClasses;

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${stateClasses} ${className}`.trim()}
      aria-pressed={pressed}
      type="button"
    >
      {children}
    </button>
  );
}
