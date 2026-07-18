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
 *   showTagline — show the dictionary-entry tagline below text (default: false)
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
    ? '/pBrain-r.png'
    : '/pBrain-l.png';

  // Navy & Gold palette — theme-aware
  const goldD    = isDark ? 'text-[#d9a04e]' : 'text-[#c8872e]';
  const navyRest = isDark ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]';
  // Definition reads in the wordmark's own navy — the old warm gray
  // (#a8a196) was too subtle for a line that carries the brand argument.
  const tagColor = isDark ? 'text-[#a8b9ce]' : 'text-[#2c4a6e]';

  const brainImg = (
    <img
      src={imgSrc}
      alt="DeftBrain"
      className={`${s.img} w-auto block object-contain flex-shrink-0`}
      style={undefined}
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
        /* Dictionary entry, played straight — lowercase, not the old
           uppercase tracking. "Handling things" is the product promise. */
        <p className={`${s.tagline} leading-snug mt-1.5 max-w-[36ch] ${tagColor}`} style={{ letterSpacing: '0.02em' }}>
          <span className="font-bold">deft</span> <span className="italic">(adj.)</span> — skillful, nimble, clever.
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
