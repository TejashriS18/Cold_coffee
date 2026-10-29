import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "caramel" | "coffee" | "chocolate" | "cream" | "outline";
  size?: "sm" | "md";
  children: React.ReactNode;
}

export function Badge({
  variant = "coffee",
  size = "md",
  className,
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    caramel:
      "bg-[#C58A4A]/15 text-[#8F5A23] border-[#C58A4A]/30 hover:bg-[#C58A4A]/25",
    coffee:
      "bg-[#6F4935]/10 text-[#5C3B29] border-[#6F4935]/20 hover:bg-[#6F4935]/15",
    chocolate:
      "bg-[#3B241A] text-[#F6F0E7] border-[#3B241A] hover:bg-[#271710]",
    cream:
      "bg-[#F6F0E7] text-[#3B241A] border-[#3B241A]/15 hover:border-[#3B241A]/30",
    outline:
      "bg-transparent text-[#6F4935] border-[#3B241A]/20 hover:border-[#3B241A]/40",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2.5 py-0.5 tracking-wider font-medium",
    md: "text-xs px-3 py-1 tracking-wide font-medium",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-colors select-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
