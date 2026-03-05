import { useState, useEffect } from 'react';

export interface SheetData {
  headers: string[];
  rows: any[][];
}

export interface SheetsState {
  [sheetName: string]: SheetData;
}

export interface SyncState {
  sheets: SheetsState | null;
  isLoading: boolean;
  lastUpdate: number;
  error: string | null;
  isOnline: boolean;
}

/**
 * 自動同步 Google Sheets 數據的 Hook
 * - 自動讀取所有分頁和欄位
 * - 每 5 秒檢查一次更新
 * - 多設備實時同步
 */
export function useGoogleSheetsSync(gasUrl: string, refreshInterval = 5000): SyncState {
  const [sheets, setSheets] = useState<SheetsState | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // 監控網絡狀態
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!gasUrl || !isOnline) return;

    const fetchData = async () => {
      try {
        setError(null);
        const response = await fetch(gasUrl);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const timestamp = data.timestamp || Date.now();

        // 只有數據變化時才更新 state（避免不必要的重新渲染）
        if (timestamp !== lastUpdate) {
          setSheets(data.sheets || {});
          setLastUpdate(timestamp);
          console.log('✅ Google Sheets 數據已同步', {
            updateTime: new Date(timestamp).toLocaleTimeString('zh-TW'),
            sheetCount: Object.keys(data.sheets || {}).length
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : '同步失敗';
        setError(errorMsg);
        console.error('❌ 同步錯誤:', errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    // 立即執行一次
    fetchData();

    // 設置定期檢查
    const interval = setInterval(fetchData, refreshInterval);

    return () => clearInterval(interval);
  }, [gasUrl, refreshInterval, lastUpdate, isOnline]);

  return {
    sheets,
    isLoading,
    lastUpdate,
    error,
    isOnline
  };
}
