import React from "react";
import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "sm" | "default" | "lg";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "default",
  size = "default",
  className,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-full font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 shadow-md";
  const variants = {
    default: "bg-white text-black hover:bg-gray-200",
    outline: "border border-white text-white hover:bg-white/10",
  };
  const sizes = {
    sm: "px-4 py-2 text-base",
    default: "px-6 py-3 text-lg",
    lg: "px-8 py-4 text-xl",
  };

  return (
    <button
      {...props}
      className={clsx(baseClasses, variants[variant], sizes[size], className)}
    >
      {children}
    </button>
  );
};
