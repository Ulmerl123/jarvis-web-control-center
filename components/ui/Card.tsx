import React from 'react';

/**
 * Props for the Card component.
 */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The content to be rendered inside the card.
   */
  children: React.ReactNode;
  /**
   * Optional additional CSS class names to apply to the card.
   * These will be merged with the default styling.
   */
  className?: string;
  /**
   * Determines if the card should have a border.
   * @default false
   */
  hasBorder?: boolean;
  /**
   * Determines if the card should have a hover effect.
   * @default false
   */
  hasHover?: boolean;
}

/**
 * A reusable UI component for displaying content blocks with consistent styling and shadow effects.
 * It provides a structured container for various types of content, enhancing visual organization
 * and user experience in the JARVIS interface.
 *
 * @param {CardProps} props - The properties for the Card component.
 * @returns {JSX.Element} A React functional component.
 */
const Card: React.FC<CardProps> = ({ children, className = '', hasBorder = false, hasHover = false, ...props }) => {
  const baseStyles = 'bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-md rounded-xl shadow-lg transition-all duration-300';
  const borderStyles = hasBorder ? 'border border-gray-700/70' : '';
  const hoverStyles = hasHover ? 'hover:shadow-2xl hover:scale-[1.005] hover:from-gray-700/70 hover:to-gray-800/70' : '';

  const combinedStyles = `${baseStyles} ${borderStyles} ${hoverStyles} ${className}`.trim();

  return (
    <div className={combinedStyles} {...props}>
      {children}
    </div>
  );
};

export default Card;