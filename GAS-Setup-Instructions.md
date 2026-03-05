# Google Apps Script 設定指南

## 步驟 1：建立 Google Sheets

1. 前往 [Google Sheets](https://sheets.google.com)
2. 建立新試算表，命名為「A Beach 101 排程管理」
3. 在第一個工作表中，準備儲存 JSON 資料

## 步驟 2：開啟 Apps Script 編輯器

1. 在試算表中，點選「擴充功能」→「Apps Script」
2. 刪除預設的 `myFunction()` 程式碼
3. 複製貼上下方完整的程式碼

## 步驟 3：Apps Script 完整程式碼

```javascript
// Google Apps Script - Beach 101 排程管理系統
// 用於與前端 Web App 進行雙向同步

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'get') {
      // 讀取資料
      const data = getData();
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        data: data
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Invalid action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const action = e.parameter.action;
    
    if (action === 'save') {
      // 儲存資料
      const postData = JSON.parse(e.postData.contents);
      saveData(postData);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        message: 'Data saved successfully'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Invalid action'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 讀取資料
function getData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('資料儲存');
  
  if (!sheet) {
    // 如果工作表不存在，建立新的
    const newSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('資料儲存');
    return null;
  }
  
  const dataRange = sheet.getRange('A2').getValue();
  
  if (!dataRange) {
    return null;
  }
  
  return JSON.parse(dataRange);
}

// 儲存資料
function saveData(data) {
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('資料儲存');
  
  if (!sheet) {
    // 建立新工作表
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('資料儲存');
    sheet.getRange('A1').setValue('Beach 101 排程資料（JSON 格式）');
  }
  
  // 將 JSON 資料儲存在 A2 儲存格
  sheet.getRange('A2').setValue(JSON.stringify(data));
  
  // 記錄最後更新時間
  sheet.getRange('B1').setValue('最後更新時間');
  sheet.getRange('B2').setValue(new Date());
  
  return true;
}

// 測試函數 - 可在編輯器中直接執行測試
function testGetData() {
  const data = getData();
  Logger.log(data);
}

function testSaveData() {
  const testData = {
    overviewTitle: "測試標題",
    events: [
      { date: "3/7晚宴", time: "17:00-21:00", people: "130人" }
    ]
  };
  saveData(testData);
  Logger.log("測試資料已儲存");
}
```

## 步驟 4：部署為 Web 應用程式

1. 點選「部署」→「新增部署作業」
2. 選擇類型：「網頁應用程式」
3. 設定：
   - **說明**：Beach 101 排程管理 API
   - **執行身分**：我
   - **具有存取權的使用者**：任何人
4. 點選「部署」
5. 複製 Web 應用程式 URL（格式：`https://script.google.com/macros/s/.../exec`）
6. 將此 URL 貼到前端程式碼的 `GAS_URL` 常數中

## 步驟 5：測試同步功能

1. 在 Apps Script 編輯器中執行 `testSaveData()` 函數，確認資料能成功儲存
2. 檢查 Google Sheets 中的「資料儲存」工作表，確認資料已寫入
3. 在前端應用中點擊「從 Sheets 匯入」，測試讀取功能
4. 在前端修改資料後，點擊「匯出到 Sheets」，測試寫入功能
5. 使用「雙向同步」確保資料一致性

## 資料格式說明

所有資料以 JSON 格式儲存在 Google Sheets 的 A2 儲存格中，包含：

- 活動總覽資訊
- 3/7、3/8、3/15 三場活動的完整資料
- 賓客名單、桌位安排、員工班表、任務清單、預算明細
- 員工班表總覽

## 權限說明

- **執行身分設為「我」**：Apps Script 以您的身分執行，有完整的試算表讀寫權限
- **存取權設為「任何人」**：允許前端應用（即使未登入）也能呼叫 API
- 建議僅在內部使用或信任的環境中使用此設定

## 進階功能（選用）

### 自動備份
可以新增定時觸發條件，每天自動備份資料：

```javascript
function autoBackup() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('資料儲存');
  const data = sheet.getRange('A2').getValue();
  const timestamp = Utilities.formatDate(new Date(), 'GMT+8', 'yyyy-MM-dd HH:mm:ss');
  
  // 將備份寫入歷史記錄工作表
  let backupSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('備份歷史');
  if (!backupSheet) {
    backupSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('備份歷史');
    backupSheet.getRange('A1:B1').setValues([['時間戳記', '資料']]);
  }
  
  backupSheet.appendRow([timestamp, data]);
}
```

設定觸發條件：「編輯」→「目前專案的觸發條件」→「新增觸發條件」，選擇 `autoBackup` 函數，時間型觸發條件，每日執行。

## 疑難排解

### 問題：匯入時顯示「無法連接到 Google Sheets」
- 確認 Web 應用程式已正確部署
- 確認 URL 正確複製到前端程式碼
- 檢查 Apps Script 專案的存取權限設定

### 問題：匯出後資料沒有更新
- 使用 no-cors 模式時，前端無法確認是否成功
- 直接檢查 Google Sheets 確認資料是否已更新
- 或使用「雙向同步」功能來確認

### 問題：資料格式錯誤
- 確保 Google Sheets 中的資料是有效的 JSON 格式
- 使用 Apps Script 的 `testGetData()` 函數測試讀取

## 安全性建議

1. 定期檢查 Google Sheets 的共用設定
2. 考慮在 Apps Script 中加入簡單的驗證機制（如 API Key）
3. 定期備份重要資料
4. 不要在公開的程式碼儲存庫中暴露 Web 應用程式 URL
