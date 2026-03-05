/**
 * Google Apps Script - 活動排程管理系統數據 API
 *
 * 使用說明：
 * 1. 在 Google Sheet 中打開「擴充程序」→「Apps Script」
 * 2. 複製整個這個檔案的內容到 Apps Script 編輯器
 * 3. 點擊「部署」→「新建部署」→ 類型選「Web 應用」
 * 4. 執行者：選你的賬戶
 * 5. 訪問權限：「所有人」
 * 6. 複製生成的「Web 應用 URL」貼到 App 的設定頁面
 */

const SHEET_ID = "你的_Google_Sheet_ID"; // 替換為你的 Sheet ID（從 URL 複製）

// 初始化 Sheet
function initializeSheet() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName('Data');

  if (!sheet) {
    sheet = ss.insertSheet('Data');
    sheet.appendRow(['Timestamp', 'Data', 'Version']);
  }

  return sheet;
}

// GET 請求：獲取最新資料
function doGet(e) {
  try {
    const action = e.parameter.action;
    const sheet = initializeSheet();
    const data = sheet.getDataRange().getValues();

    if (action === 'getData') {
      // 獲取最新一筆資料
      if (data.length > 1) {
        const latestRow = data[data.length - 1];
        const timestamp = latestRow[0];
        const jsonData = JSON.parse(latestRow[1]);

        return ContentService
          .createTextOutput(JSON.stringify({
            status: 'ok',
            success: true,
            data: jsonData,
            version: timestamp
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'ok',
          success: true,
          data: null
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        success: false,
        error: 'Unknown action'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// POST 請求：保存資料
function doPost(e) {
  try {
    const payload = e.postData.contents;
    const data = JSON.parse(payload);
    const action = data.action || 'save';

    const sheet = initializeSheet();
    const timestamp = new Date().toISOString();

    if (action === 'realTimeSync' || action === 'save') {
      // 清空舊資料，只保留最新一筆
      if (sheet.getLastRow() > 1) {
        sheet.deleteRows(2, sheet.getLastRow() - 1);
      }

      // 寫入新資料
      sheet.appendRow([
        timestamp,
        JSON.stringify(data.data || data),
        timestamp
      ]);

      return ContentService
        .createTextOutput(JSON.stringify({
          status: 'ok',
          success: true,
          version: timestamp,
          message: 'Data saved successfully'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        success: false,
        error: 'Unknown action'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        success: false,
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 測試用：驗證 Sheet 連接
function testConnection() {
  try {
    const sheet = initializeSheet();
    Logger.log('✅ Sheet 連接成功');
    Logger.log('Sheet ID: ' + SHEET_ID);
    Logger.log('Last row: ' + sheet.getLastRow());
  } catch (error) {
    Logger.log('❌ Sheet 連接失敗: ' + error.toString());
  }
}
