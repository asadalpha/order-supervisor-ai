import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variants = {
      primary:
        "bg-emerald-500 text-black hover:bg-emerald-400 font-semibold shadow-sm glow-emerald border border-emerald-400/30",
      secondary:
        "bg-[#191924] text-text hover:bg-[#222230] border border-[#262636]",
      outline:
        "border border-[#1e1e2a] bg-[#111118] text-text hover:bg-[#191924] hover:border-[#2d2d3e]",
      ghost:
        "text-text-muted hover:bg-[#151520] hover:text-text",
      danger:
        "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 font-medium",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
      md: "h-9 px-4 text-xs gap-2 rounded-xl",
      lg: "h-11 px-5 text-sm gap-2 rounded-xl",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";