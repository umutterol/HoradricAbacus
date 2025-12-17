import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import './DiabloButton.css';

export interface DiabloButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'active' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const DiabloButton = forwardRef<HTMLButtonElement, DiabloButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, children, className = '', ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={`diablo-btn diablo-btn--${variant} diablo-btn--${size} ${isDisabled ? 'diablo-btn--disabled' : ''} ${className}`}
        disabled={isDisabled}
        {...props}
      >
        {/* 3-slice button structure */}
        <span className="diablo-btn__left" aria-hidden="true" />
        <span className="diablo-btn__center" aria-hidden="true" />
        <span className="diablo-btn__right" aria-hidden="true" />

        {/* Button content */}
        <span className="diablo-btn__content">
          {loading ? (
            <span className="diablo-btn__loader">
              <svg viewBox="0 0 24 24" className="diablo-btn__spinner">
                <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2" strokeDasharray="31.4" strokeLinecap="round" />
              </svg>
            </span>
          ) : (
            children
          )}
        </span>
      </button>
    );
  }
);

DiabloButton.displayName = 'DiabloButton';
