"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cinema-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-accent-500 text-cinema-950 hover:bg-accent-400 shadow-lg shadow-accent-500/25 hover:shadow-accent-400/40 active:scale-[0.98]",
        secondary:
          "bg-cinema-700 text-cinema-100 hover:bg-cinema-600 active:scale-[0.98]",
        outline:
          "border-2 border-cinema-600 text-cinema-200 hover:bg-cinema-800 hover:border-cinema-500 active:scale-[0.98]",
        ghost:
          "text-cinema-300 hover:text-cinema-100 hover:bg-cinema-800/50",
        danger:
          "bg-danger text-white hover:bg-red-600 active:scale-[0.98]",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-base",
        lg: "h-14 px-8 text-lg",
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
