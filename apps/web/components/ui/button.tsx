import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, children, disabled, ...props }, ref) => {
    const variants = {
      primary: "bg-[#6C3BDB] text-white hover:bg-[#5A2EC0] active:bg-[#4E24AA] shadow-sm",
      secondary: "bg-[#F5F1FF] text-[#6C3BDB] hover:bg-[#ECE4FC] active:bg-[#DFD3FA]",
      outline: "border border-[#E9E5F0] bg-white text-[#1D1930] hover:bg-[#F8F8FC] active:bg-[#F3F1F8]",
      ghost: "text-[#77738A] hover:bg-[#F5F1FF] hover:text-[#6C3BDB]",
      danger: "bg-[#EF4444] text-white hover:bg-[#DC2626]",
      link: "text-[#6C3BDB] underline-offset-4 hover:underline p-0 h-auto",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md",
      md: "h-9 px-4 text-sm rounded-md",
      lg: "h-11 px-6 text-base rounded-md",
      icon: "h-9 w-9 p-0 rounded-md flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6C3BDB] disabled:pointer-events-none disabled:opacity-50 select-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
