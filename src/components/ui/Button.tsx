"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled,
      className = "",
      ...props
    },
    ref
  ) => {
    const baseClasses = "btn";
    
    const variantClasses = {
      primary: "",
      secondary: "btn-secondary",
      outline: "btn-outline",
      danger: "btn-danger",
      ghost: "btn-ghost",
    };
    
    const sizeClasses = {
      sm: "",
      md: "",
      lg: "",
    };
    
    const widthClass = fullWidth ? "wide" : "";

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <span 
            className="spinner"
            style={{
              width: "18px",
              height: "18px",
              border: "2px solid transparent",
              borderTopColor: "currentColor",
              borderRadius: "50%",
              display: "inline-block",
              animation: "spin 1s linear infinite",
              marginRight: "var(--space-2)"
            }}
            aria-hidden="true"
          />
        )}
        {children}
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </button>
    );
  }
);

Button.displayName = "Button";