"use client";

import React from "react";
import { Link004, Link005 } from "@/components/ui/skiper-ui/skiper40";
import { cn } from "@/lib/utils";

interface SkiperButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "accent" | "yellow" | "purple";
  size?: "default" | "lg" | "xl";
  className?: string;
  icon?: React.ReactNode;
}

export default function SkiperButton({
  children,
  variant = "primary",
  size = "lg",
  className = "",
  icon,
  onClick,
  disabled,
  ...props
}: SkiperButtonProps) {
  const variantStyles = {
    primary: "bg-[#7000FF] text-white hover:bg-[#5B00D6] border-black shadow-[6px_6px_0px_#000000]",
    accent: "bg-[#FF4500] text-white hover:bg-[#E03E00] border-black shadow-[6px_6px_0px_#000000]",
    yellow: "bg-[#CCFF00] text-black hover:bg-[#B8E600] border-black shadow-[6px_6px_0px_#000000]",
    purple: "bg-[#6A0DAD] text-white hover:bg-[#550A8A] border-black shadow-[6px_6px_0px_#000000]",
  };

  const sizeStyles = {
    default: "px-6 py-3 text-lg",
    lg: "px-8 py-4 text-xl font-heading tracking-wide",
    xl: "px-10 py-5 text-2xl font-heading tracking-wider",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative inline-flex items-center justify-center font-black uppercase border-4 transition-all duration-200 active:translate-x-1 active:translate-y-1 active:shadow-[2px_2px_0px_#000000] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3 relative z-10">
        <span>{children}</span>
        {icon && <span className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">{icon}</span>}
      </div>
    </button>
  );
}
