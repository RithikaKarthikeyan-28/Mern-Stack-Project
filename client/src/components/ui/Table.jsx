import React from 'react';

export const Table = ({
  columns,
  data,
  emptyMessage = 'No records found',
  children,
  className = '',
}) => {
  if (children) {
    return (
      <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
          {children}
        </table>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
        <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <tr>
            {columns?.map((col) => (
              <th
                key={col.key || col.title}
                scope="col"
                className={`px-5 py-3.5 ${col.className || ''}`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {data?.length === 0 ? (
            <tr>
              <td
                colSpan={columns?.length || 1}
                className="px-5 py-8 text-center text-sm text-slate-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data?.map((row, rowIdx) => (
              <tr
                key={row._id || row.id || rowIdx}
                className="hover:bg-slate-50/60 transition-colors"
              >
                {columns?.map((col) => (
                  <td
                    key={col.key || col.title}
                    className={`px-5 py-4 whitespace-nowrap text-sm ${col.className || ''}`}
                  >
                    {col.render ? col.render(row[col.key], row, rowIdx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export const TableHead = ({ children, className = '' }) => (
  <thead className={`bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 ${className}`}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '' }) => (
  <tbody className={`divide-y divide-slate-100 bg-white ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '', ...props }) => (
  <tr className={`hover:bg-slate-50/60 transition-colors ${className}`} {...props}>
    {children}
  </tr>
);

export const TableHeaderCell = ({ children, className = '', ...props }) => (
  <th scope="col" className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 ${className}`} {...props}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '', ...props }) => (
  <td className={`px-5 py-4 whitespace-nowrap text-sm ${className}`} {...props}>
    {children}
  </td>
);

Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.HeaderCell = TableHeaderCell;
Table.Cell = TableCell;

export default Table;
