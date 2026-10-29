import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "caramel" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  isLoading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "relative inline-flex items-center justify-center font-medium tracking-wide rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C58A4A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F6F0E7] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.99]";

  const variantStyles = {
    primary:
      "bg-[#3B241A] text-[#F6F0E7] hover:bg-[#271710] shadow-sm hover:shadow-md",
    caramel:
      "bg-[#C58A4A] text-white hover:bg-[#B27738] shadow-sm hover:shadow-md",
    secondary:
      "bg-[#6F4935]/10 text-[#3B241A] hover:bg-[#6F4935]/20 border border-[#6F4935]/15",
    outline:
      "bg-transparent text-[#3B241A] border border-[#3B241A]/25 hover:bg-[#3B241A] hover:text-[#F6F0E7]",
    ghost:
      "bg-transparent text-[#6F4935] hover:text-[#3B241A] hover:bg-[#3B241A]/5",
  };

  const sizeStyles = {
    sm: "text-xs px-3.5 py-1.5 gap-1.5",
    md: "text-sm px-5 py-2.5 gap-2",
    lg: "text-base px-6 py-3 gap-2.5",
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="inline-flex shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}
