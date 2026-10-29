import React from "react";
import { cn } from "@/lib/utils";

export interface SectionHeadingProps {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center" | "right";
  className?: string;
  titleClassName?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
  className,
  titleClassName,
}: SectionHeadingProps) {
  const alignClasses = {
    left: "text-left items-start",
    center: "text-center items-center mx-auto",
    right: "text-right items-end ml-auto",
  };

  return (
    <div
      className={cn(
        "flex flex-col max-w-2xl",
        alignClasses[align],
        className
      )}
    >
      {eyebrow && (
        <div className="inline-flex items-center gap-2 mb-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C58A4A]" />
          <span className="text-xs uppercase tracking-[0.2em] font-semibold text-[#C58A4A]">
            {eyebrow}
          </span>
        </div>
      )}

      <h2
        className={cn(
          "font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#3B241A] leading-[1.15]",
          titleClassName
        )}
      >
        {title}
      </h2>

      {description && (
        <p className="mt-3.5 text-base sm:text-lg text-[#6F4935] leading-relaxed font-normal">
          {description}
        </p>
      )}
    </div>
  );
}
