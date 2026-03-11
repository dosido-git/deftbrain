/**
 * BrandMark — DeftBrain logo wordmark component
 * ───────────────────────────────────────────────
 * Renders the brain+glasses image alongside the styled "DeftBrain" text
 * with gold "D" + navy "eftBrain" (Concept D from the style guide).
 *
 * Props:
 *   direction  — "left" (brain left, text right) or "right" (text left, brain right)
 *   size       — "lg" (Dashboard header) | "md" | "sm" (navbar compact)
 *   isDark     — from useTheme()
 *   className  — optional additional classes on the wrapper
 *   onClick    — optional click handler
 *   showTagline — show "Intelligence on Demand" below text (default: false)
 */
import React from 'react';

const SIZES = {
  lg: { img: 'h-28 sm:h-32', text: 'text-3xl sm:text-4xl', tagline: 'text-[11px]', taglineTracking: 'tracking-[0.45em]', gap: 'gap-3' },
  md: { img: 'h-20 sm:h-24', text: 'text-2xl sm:text-3xl', tagline: 'text-[10px]', taglineTracking: 'tracking-[0.45em]', gap: 'gap-2.5' },
  sm: { img: 'h-14 sm:h-16', text: 'text-xl sm:text-2xl',  tagline: 'text-[9px]',  taglineTracking: 'tracking-[0.18em]', gap: 'gap-2' },
};

const BrandMark = ({
  direction = 'left',
  size = 'lg',
  isDark = false,
  className = '',
  onClick,
  showTagline = false,
}) => {
  const s = SIZES[size] || SIZES.lg;

  // Image source based on direction
  const imgSrc = direction === 'left'
    ? '/logo-brain-only-r.png'
    : '/logo-brain-only-l.png';

  // Navy & Gold palette — theme-aware
  const goldD    = isDark ? 'text-[#d9a04e]' : 'text-[#c8872e]';
  const navyRest = isDark ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]';
  const tagColor = isDark ? 'text-[#8a8275]' : 'text-[#a8a196]';

  const brainImg = (
    <img
      src={imgSrc}
      alt="DeftBrain"
      className={`${s.img} w-auto block object-contain flex-shrink-0`}
      style={isDark ? { filter: 'invert(0.85) brightness(1.2)' } : undefined}
    />
  );

  const wordmark = (
    <div className="flex flex-col justify-center">
      <span
        className={`${s.text} font-extrabold leading-none tracking-tight`}
        style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
      >
        <span className={goldD}>D</span>
        <span className={navyRest}>eftBrain</span>
      </span>
      {showTagline && (
        <p className={`${s.tagline} ${s.taglineTracking} font-black uppercase leading-none mt-1.5 ${tagColor}`}>
          Intelligence on Demand
        </p>
      )}
    </div>
  );

  const content = direction === 'left'
    ? <>{brainImg}{wordmark}</>
    : <>{wordmark}{brainImg}</>;

  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      className={`flex items-center ${s.gap} ${className}`}
      onClick={onClick}
      {...(onClick ? { type: 'button' } : {})}
    >
      {content}
    </Wrapper>
  );
};

export default BrandMark;
