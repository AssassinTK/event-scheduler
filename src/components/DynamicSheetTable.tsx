import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DynamicSheetTableProps {
  sheetName: string;
  headers: string[];
  rows: any[][];
  onDataChange?: (rowIndex: number, colIndex: number, value: any) => void;
}

/**
 * 動態表格組件 - 自動根據欄位生成表格
 */
export function DynamicSheetTable({
  sheetName,
  headers,
  rows,
  onDataChange
}: DynamicSheetTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  if (!headers || headers.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
        <p>此分頁無數據</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">{sheetName}</h3>

      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full border-collapse">
          {/* 表頭 */}
          <thead>
            <tr className="bg-blue-50">
              <th className="w-12 border px-4 py-3 text-left">
                <input type="checkbox" className="rounded" />
              </th>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="border px-4 py-3 text-left font-semibold text-gray-700 bg-blue-100"
                >
                  {header}
                </th>
              ))}
              <th className="w-12 border px-4 py-3">展開</th>
            </tr>
          </thead>

          {/* 表身 */}
          <tbody>
            {rows.map((row, rowIdx) => (
              <React.Fragment key={rowIdx}>
                {/* 主行 */}
                <tr className="border-b hover:bg-gray-50">
                  <td className="border px-4 py-3">
                    <input type="checkbox" className="rounded" />
                  </td>
                  {headers.map((header, colIdx) => (
                    <td
                      key={colIdx}
                      className="border px-4 py-3 text-gray-700 text-sm"
                      onClick={(e) => {
                        // 允許編輯（可選）
                        if (onDataChange) {
                          const newValue = prompt(
                            `編輯 ${header}:`,
                            row[colIdx] || ''
                          );
                          if (newValue !== null) {
                            onDataChange(rowIdx, colIdx, newValue);
                          }
                        }
                      }}
                      style={{
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: onDataChange ? 'pointer' : 'default'
                      }}
                      title={String(row[colIdx] || '')}
                    >
                      {row[colIdx] || '-'}
                    </td>
                  ))}
                  <td className="border px-4 py-3 text-center">
                    <button
                      onClick={() => toggleRow(rowIdx)}
                      className="p-1 hover:bg-gray-200 rounded inline-flex"
                    >
                      {expandedRows.has(rowIdx) ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </button>
                  </td>
                </tr>

                {/* 展開行（詳細信息） */}
                {expandedRows.has(rowIdx) && (
                  <tr className="bg-gray-50 border-b">
                    <td colSpan={headers.length + 2} className="px-6 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        {headers.map((header, colIdx) => (
                          <div key={colIdx} className="border-l-2 border-blue-300 pl-4">
                            <div className="text-xs font-semibold text-gray-600 uppercase">
                              {header}
                            </div>
                            <div className="text-sm text-gray-800 mt-1 break-words">
                              {row[colIdx] || '（空白）'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* 統計信息 */}
      <div className="text-xs text-gray-500">
        共 {rows.length} 筆紀錄
      </div>
    </div>
  );
}
