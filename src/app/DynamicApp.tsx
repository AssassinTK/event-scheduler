/**
 * DynamicApp.tsx - 動態谷歌表單同步應用
 * 特點：
 * - 自動讀取 Google Sheets 的所有分頁和欄位
 * - 無需修改代碼，只需修改 Google Sheets 即可更新應用
 * - 每 5 秒自動檢查更新，實現多設備實時同步
 * - 完全傻瓜級別操作
 */

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { RefreshCw, Settings, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { useGoogleSheetsSync } from '@/hooks/useGoogleSheetsSync';
import { DynamicSheetTable } from '@/components/DynamicSheetTable';

interface GASUrlConfig {
  gasUrl: string;
  isValid: boolean;
}

export default function DynamicApp() {
  const [gasUrlConfig, setGasUrlConfig] = useState<GASUrlConfig>({
    gasUrl: localStorage.getItem('beach101-gas-url') || '',
    isValid: !!localStorage.getItem('beach101-gas-url')
  });
  const [showUrlInput, setShowUrlInput] = useState(!gasUrlConfig.isValid);
  const [tempUrl, setTempUrl] = useState(gasUrlConfig.gasUrl);

  // 使用新的同步 Hook
  const { sheets, isLoading, error, isOnline, lastUpdate } = useGoogleSheetsSync(
    gasUrlConfig.gasUrl,
    5000 // 5 秒更新一次
  );

  // 保存 GAS URL
  const handleSaveGasUrl = () => {
    if (!tempUrl.trim()) {
      alert('請輸入有效的 GAS URL');
      return;
    }
    localStorage.setItem('beach101-gas-url', tempUrl);
    setGasUrlConfig({
      gasUrl: tempUrl,
      isValid: true
    });
    setShowUrlInput(false);
  };

  // 手動刷新
  const handleManualRefresh = () => {
    window.location.reload();
  };

  // 如果 GAS URL 未設置
  if (!gasUrlConfig.isValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center mb-6">
            <AlertCircle className="w-12 h-12 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold text-center mb-4">設置 GAS URL</h1>
          <p className="text-gray-600 text-center mb-6">
            請輸入您的 Google Apps Script Web App URL，以啟用 Google Sheets 同步功能
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GAS Web App URL
              </label>
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={handleSaveGasUrl}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              保存並連接
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部欄 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">📊 動態排程管理</h1>
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="flex items-center gap-1 text-green-600">
                  <Wifi size={16} />
                  <span className="text-xs font-medium">在線</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600">
                  <WifiOff size={16} />
                  <span className="text-xs font-medium">離線</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 更新時間 */}
            {lastUpdate > 0 && (
              <div className="text-xs text-gray-500">
                最後更新：{new Date(lastUpdate).toLocaleTimeString('zh-TW')}
              </div>
            )}

            {/* 刷新按鈕 */}
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              title="手動刷新"
            >
              <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
            </button>

            {/* 設置按鈕 */}
            <button
              onClick={() => setShowUrlInput(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="設置 GAS URL"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* 設置 URL 面板 */}
        {showUrlInput && (
          <div className="bg-blue-50 border-t px-4 py-4">
            <div className="max-w-7xl mx-auto flex gap-3">
              <input
                type="text"
                value={tempUrl}
                onChange={(e) => setTempUrl(e.target.value)}
                placeholder="輸入新的 GAS URL..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveGasUrl}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition"
              >
                保存
              </button>
              <button
                onClick={() => setShowUrlInput(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg transition"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 主內容 */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 錯誤消息 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800">同步錯誤</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* 加載中 */}
        {isLoading && !sheets && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
              <p className="text-gray-600">正在加載 Google Sheets 數據...</p>
            </div>
          </div>
        )}

        {/* 分頁內容 */}
        {sheets && Object.keys(sheets).length > 0 ? (
          <Tabs defaultValue={Object.keys(sheets)[0]} className="w-full">
            {/* 選項卡列表 */}
            <TabsList className="flex gap-2 mb-6 border-b bg-white rounded-lg p-2">
              {Object.keys(sheets).map((sheetName) => (
                <TabsTrigger
                  key={sheetName}
                  value={sheetName}
                  className="px-4 py-2 rounded-lg hover:bg-gray-100 data-[state=active]:bg-blue-500 data-[state=active]:text-white transition"
                >
                  {sheetName}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* 選項卡內容 */}
            {Object.entries(sheets).map(([sheetName, sheetData]) => (
              <TabsContent key={sheetName} value={sheetName} className="mt-6">
                <DynamicSheetTable
                  sheetName={sheetName}
                  headers={sheetData.headers}
                  rows={sheetData.rows}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          !isLoading && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                未找到任何分頁。請檢查 Google Sheets 是否有數據。
              </p>
            </div>
          )
        )}
      </div>

      {/* 底部提示 */}
      {!isLoading && sheets && (
        <div className="bg-blue-50 border-t mt-12 py-4">
          <div className="max-w-7xl mx-auto px-4 text-sm text-blue-800">
            <p>
              💡 <strong>提示</strong>：應用每 5 秒自動檢查 Google Sheets 的更新。
              在 Sheets 中修改數據或欄位後，刷新此頁面可立即查看最新內容。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
