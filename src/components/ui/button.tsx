"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-condensed uppercase tracking-widest transition-all duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 focus-visible:ring-offset-cinema-50 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        // Primary — red ticket stub with hard shadow
        default:
          "bg-accent-500 text-cinema-50 border-2 border-cinema-900 shadow-[4px_4px_0_var(--color-cinema-900)] hover:bg-accent-400 hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_var(--color-cinema-900)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_var(--color-cinema-900)]",
        // Gold/marquee
        gold:
          "bg-gold-500 text-cinema-900 border-2 border-cinema-900 shadow-[4px_4px_0_var(--color-cinema-900)] hover:bg-gold-400 hover:-translate-x-px hover:-translate-y-px hover:shadow-[5px_5px_0_var(--color-cinema-900)] active:translate-x-[3px] active:translate-y-[3px] active:shadow-[1px_1px_0_var(--color-cinema-900)]",
        // Secondary — cream card
        secondary:
          "bg-cinema-50 text-cinema-900 border-2 border-cinema-900 shadow-[3px_3px_0_var(--color-cinema-900)] hover:bg-cinema-100 hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_var(--color-cinema-900)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-cinema-900)]",
        // Outline — no fill
        outline:
          "bg-transparent text-cinema-900 border-2 border-cinema-900 hover:bg-cinema-900 hover:text-cinema-50",
        // Ghost — minimal
        ghost:
          "text-cinema-800 hover:text-accent-500 hover:bg-cinema-100/60",
        // Danger
        danger:
          "bg-cinema-900 text-cinema-50 border-2 border-cinema-900 shadow-[3px_3px_0_var(--color-accent-600)] hover:bg-accent-600 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_var(--color-accent-600)]",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-14 px-10 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
