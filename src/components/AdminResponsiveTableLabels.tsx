import { useEffect } from 'react';

/**
 * Adds accessible column labels to admin tables so CSS can render each row
 * as a readable card on narrow screens without duplicating table data.
 */
export const AdminResponsiveTableLabels = () => {
  useEffect(() => {
    const applyLabels = () => {
      document.querySelectorAll<HTMLTableElement>('.admin-responsive-table table').forEach((table) => {
        const labels = Array.from(table.querySelectorAll<HTMLTableCellElement>('thead th'))
          .map((header) => (header.innerText || header.textContent || '').replace(/\s+/g, ' ').trim());

        table.querySelectorAll<HTMLTableRowElement>('tbody tr').forEach((row) => {
          Array.from(row.cells).forEach((cell, index) => {
            const label = labels[index] || `Column ${index + 1}`;
            if (cell.dataset.label !== label) cell.dataset.label = label;
          });
        });
      });
    };

    applyLabels();
    const observer = new MutationObserver(applyLabels);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
};
