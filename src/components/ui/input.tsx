import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full border-2 border-cinema-900 bg-cinema-50 px-3 py-2 text-base text-cinema-900 font-typewriter placeholder:text-cinema-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:border-accent-500 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
