import React from 'react';

/**
 * Badge — a small inline label with semantic-type-driven styling.
 *
 * Used to display short status indicators or category labels (e.g. "success",
 * "warning", "danger", "info") with consistent visual treatment across tools.
 * The `type` prop maps to a key in the tool's `c` (color config) block, so
 * each tool's badge colors stay aligned with its theme.
 *
 * @param {React.ReactNode} children — the badge text or content
 * @param {string} type — semantic type; should match a key in `c` (e.g. 'success', 'warning', 'danger', 'info')
 * @param {object} c — the calling tool's color config object from useTheme()
 *
 * Example:
 *   <Badge c={c} type="success">✅ Completed</Badge>
 *   <Badge c={c} type={score >= 70 ? 'success' : 'warning'}>{score}/100</Badge>
 */
export function Badge({ children, type = 'info', c }) {
  const style = (c && c[type]) || (c && c.infoBox) || '';
  return (
    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${style}`}>
      {children}
    </span>
  );
}
