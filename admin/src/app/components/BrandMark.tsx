import { useState } from "react";
import { cn } from "./ui/utils";

type BrandMarkProps = {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  compact?: boolean;
  className?: string;
};

const sizes = {
  sm: "h-9 w-9 rounded-xl text-lg",
  md: "h-12 w-12 rounded-2xl text-2xl",
  lg: "h-24 w-24 rounded-[1.65rem] text-5xl",
};

export function BrandMark({ size = "md", showText = true, compact = false, className }: BrandMarkProps) {
  const [logoFailed, setLogoFailed] = useState(false);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      {!logoFailed ? (
        <img
          src="/assets/riyadh-logo.png"
          alt="RYDE"
          onError={() => setLogoFailed(true)}
          className={cn("shrink-0 object-cover shadow-[0_12px_30px_rgba(0,0,0,0.18)]", sizes[size])}
        />
      ) : (
        <div
          className={cn(
            "relative flex shrink-0 items-center justify-center overflow-hidden border bg-[#171715] text-[#d7b35f] shadow-[0_12px_30px_rgba(0,0,0,0.18)]",
            "border-[#d7b35f]/80 before:absolute before:inset-1 before:rounded-[inherit] before:border before:border-[#d7b35f]/30",
            sizes[size]
          )}
        >
          <span className="font-serif leading-none tracking-normal drop-shadow-[0_2px_8px_rgba(215,179,95,0.25)]">
            R
          </span>
          <span className="absolute left-2 right-2 top-2 h-px bg-gradient-to-r from-transparent via-[#d7b35f]/70 to-transparent" />
          <span className="absolute bottom-2 left-2 right-2 h-px bg-gradient-to-r from-transparent via-[#d7b35f]/70 to-transparent" />
        </div>
      )}

      {showText && (
        <div className={compact ? "hidden" : "min-w-0"}>
          <div className="text-xl font-medium leading-tight tracking-normal text-gray-950 dark:text-gray-50">
            RYDE
          </div>
          <div className="mt-0.5 text-xs leading-tight text-[#9a7a35] dark:text-[#d7b35f]/80">
            Premium Ride Service
          </div>
        </div>
      )}
    </div>
  );
}
