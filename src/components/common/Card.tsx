import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "white" | "cream" | "chocolate";
  hoverEffect?: boolean;
  children: React.ReactNode;
}

export function Card({
  variant = "white",
  hoverEffect = true,
  className,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    white:
      "bg-white border border-[#3B241A]/10 text-[#3B241A] shadow-sm",
    cream:
      "bg-[#FBF8F3] border border-[#3B241A]/10 text-[#3B241A]",
    chocolate:
      "bg-[#3B241A] border border-[#3B241A] text-[#F6F0E7]",
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-200",
        variantStyles[variant],
        hoverEffect && "hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
