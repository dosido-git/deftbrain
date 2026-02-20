import React, { useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import twemoji from 'twemoji';

/**
 * IconRenderer - Super simple version
 * 
 * Strategy:
 * 1. Try Lucide icon first
 * 2. If not Lucide, assume it's emoji and use Twemoji
 * 3. No complex detection - just render everything
 */
const IconRenderer = ({ icon, className = "w-6 h-6", size = 24 }) => {
  const emojiRef = useRef(null);

  // No icon provided
  if (!icon) {
    return <span className={className}>❓</span>;
  }

  // Try Lucide icon first (this is the fast path for icon names)
  const LucideIcon = LucideIcons[icon];
  
  if (LucideIcon) {
    return <LucideIcon className={className} size={size} />;
  }

  // Not a Lucide icon - treat as emoji and always parse with Twemoji
  useEffect(() => {
    if (emojiRef.current) {
      // Parse with Twemoji
      twemoji.parse(emojiRef.current, {
        folder: 'svg',
        ext: '.svg',
        base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/'
      });

      // Style the generated image
      const img = emojiRef.current.querySelector('img');
      if (img) {
        img.style.height = `${size}px`;
        img.style.width = `${size}px`;
        img.style.display = 'inline-block';
        img.style.margin = '0';
        img.style.padding = '0';
        img.style.verticalAlign = 'middle';
        img.style.objectFit = 'contain';
        img.style.border = 'none';
        img.style.background = 'none';
        img.style.boxShadow = 'none';
      }
    }
  }, [icon, size]);

  // Render as emoji (Twemoji will parse it)
  return (
    <span 
      ref={emojiRef}
      className={`inline-flex items-center justify-center ${className}`}
      style={{ 
        fontSize: `${size}px`,
        lineHeight: 1,
      }}
    >
      {icon.trim()}
    </span>
  );
};

export default IconRenderer;
