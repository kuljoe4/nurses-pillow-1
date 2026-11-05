import React from 'react';

interface AdminPaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const AdminPagination: React.FC<AdminPaginationProps> = ({
  total, page, pageSize, onPageChange, onPageSizeChange,
}) => {
  if (total <= 10) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Showing {start}–{end} of {total}</span>
        <label className="inline-flex items-center gap-2">
          <span>Rows</span>
          <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))} className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs dark:border-gray-700 dark:bg-[#14233a]">
            <option value={10}>10</option><option value={25}>25</option><option value={50}>50</option>
          </select>
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700">Previous</button>
        <span className="min-w-20 text-center text-xs text-gray-500 dark:text-gray-400">Page {page} of {pages}</span>
        <button type="button" onClick={() => onPageChange(Math.min(pages, page + 1))} disabled={page >= pages} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700">Next</button>
      </div>
    </div>
  );
};
