import React, { useState, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useTheme } from '../hooks/useTheme';

/**
 * Shared action buttons for tool output: Copy, Share, Print.
 * 
 * Each button manages its own state, uses useTheme for dark mode,
 * and follows a consistent visual pattern across all tools.
 * 
 * Usage:
 *   import { CopyBtn, ShareBtn, PrintBtn, ActionBar } from '../components/ActionButtons';
 * 
 *   // Individual buttons
 *   <CopyBtn content={text} label="Copy Script" />
 *   <ShareBtn content={text} title="My Strategy" />
 *   <PrintBtn content={text} title="Conversation Strategy" />
 * 
 *   // Or use ActionBar for the common Copy + Share + Print group
 *   <ActionBar content={text} title="Conversation Strategy" copyLabel="Copy All" />
 */

// ─── Shared styling ──────────────────────────────────────────
function useButtonStyles() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  return {
    isDark,
    base: isDark
      ? 'bg-zinc-700 hover:bg-zinc-600 text-zinc-100'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    success: isDark
      ? 'bg-green-900/40 text-green-300'
      : 'bg-green-100 text-green-700',
  };
} const btnClass = 'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all';

// ─── CopyBtn ─────────────────────────────────────────────────
/**
 * Copy text to clipboard with visual feedback.
 * Self-contained — no parent state needed.
 * 
 * Props:
 *   content  — string to copy
 *   label    — button text (default: "Copy")
 *   onCopied — optional callback after successful copy
 */
export const CopyBtn = ({ content, label = 'Copy', onCopied }) => {
  const [copied, setCopied] = useState(false);
  const s = useButtonStyles();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopied?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers / insecure contexts
      try {
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        onCopied?.();
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Copy failed:', fallbackErr);
      } } }, [content, onCopied]);

  return (<button onClick={handleCopy} className={`${btnClass} ${copied ? s.success : s.base}`}>
      <span className="text-sm">{copied ? '✅' : '📋'}</span>
      {copied ? 'Copied' : label} </button>
  );
};

// ─── ShareBtn ────────────────────────────────────────────────
/**
 * Native share sheet via Web Share API.
 * Auto-hides on browsers that don't support it.
 * 
 * Props:
 *   content  — text to share
 *   title    — share dialog title (default: "DeftBrain")
 *   url      — optional URL to include (defaults to current page)
 */
export const ShareBtn = ({ content, title = 'DeftBrain', url }) => {
  const s = useButtonStyles();
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  if (!canShare) return null;

  const handleShare = async () => {
    try {
      const shareData = { title, text: content };
      if (url) shareData.url = url;
      await navigator.share(shareData);
    } catch (err) {
      // User cancelled — not an error
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err);
      } } };

  return (<button onClick={handleShare} className={`${btnClass} ${s.base}`}>
      <span className="text-sm">📤</span> Share
    </button>
  );
};

// ─── PrintBtn ────────────────────────────────────────────────
/**
 * Opens a clean print window with formatted content.
 * 
 * Props:
 *   content  — plain text to print (will be HTML-escaped)
 *   title    — window/page title
 *   variant  — 'full' (default, 700px wide) or 'card' (500px, bordered)
 *   label    — button text (default: "Print")
 */

export const PrintBtn = ({ label = 'Print' }) => {
  const s = useButtonStyles();
  const { theme, setLightTheme, setDarkTheme } = useTheme();

  const handlePrint = () => {
    const wasDark = theme === 'dark';

    if (wasDark) {
      // Synchronously re-render in light mode before print dialog opens
      flushSync(() => setLightTheme());

      // Only restore dark mode AFTER the print/PDF operation fully completes.
      // Do NOT call setDarkTheme() immediately after window.print() — in Safari,
      // window.print() returns before PDF export finishes, so restoring early
      // causes the PDF renderer to capture the reverted dark state.
      const restore = () => setDarkTheme();
      window.addEventListener('afterprint', restore, { once: true });
      // Fallback in case afterprint never fires (e.g. user cancels)
      setTimeout(restore, 10000);
    }

    window.print();
  };

  return (
    <button onClick={handlePrint} className={`${btnClass} ${s.base}`}>
      <span className="text-sm">🖨️</span> {label}
    </button>
  );
};

export const ActionBar = ({
  content,
  title = 'DeftBrain',
  copyLabel = 'Copy',
  printLabel = 'Print',
  shareUrl,
  onCopied,
  showCopy = true,
  showShare = true,
  showPrint = true,
}) => {
  return (<div className="flex items-center gap-2">
      {showCopy && <CopyBtn content={content} label={copyLabel} onCopied={onCopied} />} {showShare && <ShareBtn content={content} title={title} url={shareUrl} />} {showPrint && <PrintBtn label={printLabel} />} </div>
  );
};


const ActionButtons = { CopyBtn, ShareBtn, PrintBtn, ActionBar };
export default ActionButtons;
