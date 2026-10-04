import React, { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

/**
 * Button variants and their corresponding Tailwind CSS classes.
 */
const variantClasses: Record<string, string> = {
  primary:
    "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 focus:ring-4 focus:ring-indigo-300",
  secondary:
    "bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-4 focus:ring-gray-300",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-4 focus:ring-red-300",
  outline:
    "border border-gray-300 text-gray-800 hover:bg-gray-100 focus:ring-4 focus:ring-gray-200",
  ghost:
    "bg-transparent text-gray-800 hover:bg-gray-100 focus:ring-4 focus:ring-gray-200",
  link: "text-indigo-600 hover:underline focus:ring-2 focus:ring-indigo-200",
};

/**
 * Button sizes and their corresponding Tailwind CSS classes.
 */
const sizeClasses: Record<string, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
  lg: "px-5 py-3 text-lg",
};

/**
 * Props for the Button component.
 */
export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /**
   * Visual style of the button.
   * @default "primary"
   */
  variant?: keyof typeof variantClasses;
  /**
   * Size of the button.
   * @default "md"
   */
  size?: keyof typeof sizeClasses;
  /**
   * If true, the button shows a loading spinner and disables interaction.
   * @default false
   */
  loading?: boolean;
  /**
   * If true, the button is disabled.
   * @default false
   */
  disabled?: boolean;
  /**
   * HTML button type attribute.
   * @default "button"
   */
  type?: "button" | "submit" | "reset";
  /**
   * Optional icon element to be displayed before the children.
   */
  icon?: React.ReactNode;
}

/**
 * Reusable, accessible button component styled with Tailwind CSS.
 *
 * @param props ButtonProps
 * @returns JSX.Element
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled = false,
      type = "button",
      className,
      children,
      icon,
      onClick,
      ...rest
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    const handleClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (isDisabled) {
        e.preventDefault();
        return;
      }
      if (onClick) {
        onClick(e);
      }
    };

    const baseClasses =
      "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const combinedClasses = clsx(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      className
    );

    return (
      <button
        ref={ref}
        type={type}
        className={combinedClasses}
        onClick={handleClick}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...rest}
      >
        {loading ? (
          <svg
            className={clsx("animate-spin mr-2 h-5 w-5", {
              "text-white": variant === "primary" || variant === "destructive",
              "text-gray-800": variant !== "primary" && variant !== "destructive",
            })}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx={12}
              cy={12}
              r={10}
              stroke="currentColor"
              strokeWidth={4}
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        ) : (
          icon && <span className="mr-2 flex items-center">{icon}</span>
        )}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;