import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactElement<any>;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
}

/**
 * Enterprise Flat Tooltip Component
 * Displays contextual helper descriptions on hover / focus with zero layout shifting.
 * Built with sharp borders, dark contrast styling, and keyboard accessible focus triggers.
 */
export default function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className = ''
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const positionStyles = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const childWithEvents = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      showTooltip();
      if (children.props.onMouseEnter) children.props.onMouseEnter(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      hideTooltip();
      if (children.props.onMouseLeave) children.props.onMouseLeave(e);
    },
    onFocus: (e: React.FocusEvent) => {
      showTooltip();
      if (children.props.onFocus) children.props.onFocus(e);
    },
    onBlur: (e: React.FocusEvent) => {
      hideTooltip();
      if (children.props.onBlur) children.props.onBlur(e);
    },
    title: typeof content === 'string' ? content : children.props.title
  });

  return (
    <div className="relative inline-flex items-center">
      {childWithEvents}
      {isVisible && content && (
        <div
          role="tooltip"
          className={`absolute ${positionStyles[position]} z-50 pointer-events-none px-2.5 py-1.5 text-2xs font-mono font-medium leading-tight text-white bg-slate-900 dark:bg-night-950 border border-slate-700 dark:border-teal-700/60 shadow-xl rounded-none whitespace-nowrap animate-fadeIn select-none ${className}`}
        >
          {content}
        </div>
      )}
    </div>
  );
}
