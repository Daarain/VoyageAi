import { cn } from "@/lib/utils";

const colorMap = {
  cyan: "bg-cyan-glow",
  teal: "bg-teal-soft",
  amber: "bg-amber-signal",
  rose: "bg-rose-signal",
};

export function LiveDot({
  color = "teal",
  className,
}: {
  color?: keyof typeof colorMap;
  className?: string;
}) {
  return (
    <span className={cn("relative inline-flex h-2 w-2", className)}>
      <span
        className={cn(
          "absolute inline-flex h-full w-full rounded-full opacity-75 animate-pulse-slow",
          colorMap[color]
        )}
      />
      <span className={cn("relative inline-flex h-2 w-2 rounded-full", colorMap[color])} />
    </span>
  );
}
