const SIZE_CLASSES = {
  sm: { box: "h-4 w-4", icon: "h-2.5 w-2.5" },
  md: { box: "h-5 w-5", icon: "h-3 w-3" },
  lg: { box: "h-6 w-6", icon: "h-3.5 w-3.5" },
};

export function TaskCheckbox({
  checked,
  onToggle,
  size = "md",
  className = "",
}: {
  checked: boolean;
  onToggle: () => void;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}) {
  const { box, icon } = SIZE_CLASSES[size];

  return (
    <span className={`relative flex shrink-0 items-center justify-center ${box} ${className}`}>
      <input
        type="checkbox"
        defaultChecked={checked}
        onChange={onToggle}
        aria-label="Tandai selesai"
        className={`peer ${box} shrink-0 cursor-pointer appearance-none rounded-full border-2 border-border bg-background transition-colors checked:border-primary checked:bg-primary`}
      />
      <svg
        className={`pointer-events-none absolute ${icon} text-muted-foreground/50 peer-checked:text-primary-foreground`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="4 12 9 17 20 6" />
      </svg>
    </span>
  );
}
