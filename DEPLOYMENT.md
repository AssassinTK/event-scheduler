# 🚀 部署指南：活動排程管理系統

本指南將帶你完成整個部署流程。預計花時間：**30 分鐘**

---

## 📋 前置準備

你需要的東西：
- ✅ GitHub 帳號（免費）
- ✅ Google 帳號
- ✅ Vercel 帳號（免費，可用 GitHub 登入）

---

## 第一步：建立 GitHub Repository

### 1.1 打開終端機（Mac/Linux 用戶）或 PowerShell（Windows 用戶）

```bash
# 進入專案目錄
cd /path/to/包場一頁式介面
```

### 1.2 初始化 Git 並提交代碼

```bash
# 初始化 git
git init

# 添加所有檔案
git add .

# 提交代碼
git commit -m "Initial commit: Event scheduling app with Google Sheets sync"

# 建立主分支
git branch -M main
```

### 1.3 上傳到 GitHub

1. 打開 https://github.com/new
2. 建立新 Repository
   - Repository name：`event-scheduler`
   - Description：`活動排程管理系統`
   - Public（選擇公開，這樣 Vercel 才能部署）
   - 點擊「Create repository」

3. GitHub 會顯示設定指令，複製執行（大約像這樣）：

```bash
git remote add origin https://github.com/你的用戶名/event-scheduler.git
git branch -M main
git push -u origin main
```

✅ 完成：你的代碼現在在 GitHub 上了！

---

## 第二步：部署到 Vercel

### 2.1 打開 Vercel

1. 打開 https://vercel.com
2. 點擊「Sign Up」並用 GitHub 帳號登入

### 2.2 部署專案

1. 登入後點擊「Add New Project」
2. 在「Import Git Repository」中找到並選擇 `event-scheduler`
3. 點擊「Import」

### 2.3 配置設定

頁面會顯示設定選項，確認以下內容：
- **Framework Preset**：選 `Vite`
- **Build Command**：應該自動填入 `npm run build`
- **Output Directory**：應該自動填入 `dist`
- **Environment Variables**：留空（先跳過）

然後點擊「Deploy」

⏳ 等待部署完成（通常 2-3 分鐘）

✅ 完成：你會看到「Congratulations!」，並得到一個網址，例如：
```
https://event-scheduler.vercel.app
```

📌 **保存這個網址，分享給團隊！**

---

## 第三步：建立 Google Sheets 數據源

### 3.1 建立 Google Sheet

1. 打開 https://sheets.google.com
2. 點擊「+」新建試算表
3. 取名：`Event Scheduler Database`
4. 記下 Sheet ID（URL 中的這一串）
   ```
   https://docs.google.com/spreadsheets/d/[這一串就是ID]/edit
   ```

### 3.2 建立 Google Apps Script

1. 在 Google Sheet 中點擊「擴充程序」→「Apps Script」
2. 刪除預設代碼，複製 `GAS_CODE.js` 檔案中的全部代碼
3. 將最上面的 `SHEET_ID` 替換為你的 Sheet ID：
   ```javascript
   const SHEET_ID = "你剛剛記下的ID";
   ```
4. 點擊「💾 保存」（左上角）

### 3.3 部署 Google Apps Script

1. 點擊「部署」（右上角）
2. 點擊「新建部署」
3. 選擇部署類型：點擊右邊的圖示選「Web 應用」
4. 填寫資訊：
   - 說明：`Event Scheduler API`
   - 執行者：選你的帳號
   - 訪問權限：`所有人`
5. 點擊「部署」

### 3.4 複製 Web 應用 URL

部署後會顯示「Web 應用 URL」，像這樣：
```
https://script.google.com/macros/s/AKfycbyyQpsY...../exec
```

📌 **複製這個 URL，你馬上需要用！**

---

## 第四步：在 App 中設定 Google Sheets

1. 打開 `https://event-scheduler.vercel.app`（或你的 Vercel 網址）
2. 點擊右上角 ⚙️ 進入「設定」頁面
3. 找到「Google Sheets 同步設定」區塊
4. 貼入你複製的 **Web 應用 URL**
5. 點擊「🔗 儲存 URL」

✅ 完成：App 現在能和 Google Sheets 同步了！

### 4.1 啟用自動同步（可選但推薦）

1. 在同一個設定頁面，找到「🔄 自動同步」
2. 開啟開關
3. App 現在會每 30 秒自動從 Google Sheets 拉取最新資料

---

## 第五步：邀請團隊使用

### 分享模板

把這個內容複製給你的團隊：

```markdown
## 🎉 使用活動排程系統

### 快速開始（3 個步驟）

1. **打開應用**
   https://event-scheduler.vercel.app

2. **設定數據源**（只需做一次）
   - 點擊右上角 ⚙️ 進入設定
   - 找到「Google Sheets 同步設定」
   - 貼入 GAS Web App URL：
     ```
     [你的 GAS URL]
     ```
   - 點擊「儲存 URL」

3. **開始使用**
   - 左上角「📅 總覽」：查看所有場次
   - 點擊活動名稱進入詳情編輯
   - 自動保存到 Google Sheets（每 30 秒同步）

### 核心功能
✅ 活動基本資訊管理（日期、時間、地點、規模）
✅ 人員班表管理（外場/內場、到離場時間、出勤確認）
✅ 任務清單（指派給特定人員、時間追蹤）
✅ 菜單管理（品項、份數、內場確認）
✅ 預算追蹤（預估 vs 實際支出）
✅ 個人行程時間表（每人的當日排程）
✅ 甘特圖（可視化時間安排）
✅ 單獨列印（列印個人行程表）
✅ Google Sheets 自動同步

### 提示
💡 所有資料自動保存到本機瀏覽器
💡 同時可同步到 Google Sheets 作為備份
💡 支援深色模式和調整字體大小
💡 列印前點擊「🖨️ 列印」會自動格式化
```

---

## 🔧 常見問題排查

### Q: 部署後 Vercel 出錯
**A:**
1. 檢查 GitHub 上有沒有 `package.json` 和 `src/` 資料夾
2. 在 Vercel 控制台點「Redeploy」重新部署
3. 檢查 Build 日誌（Deployments → Build Logs）

### Q: Google Sheets 同步不動
**A:**
1. 確認 GAS 已部署（點 Google Sheet 擴充程序 → Apps Script 右上角有綠色勾）
2. 檢查 URL 是否正確複製（包括 `/exec` 結尾）
3. 確認 GAS 的訪問權限是「所有人」
4. 在 Settings 頁點「☁️ 即時同步」測試連接

### Q: 資料丟失了怎麼辦
**A:**
1. 檢查 Google Sheet 是否有備份
2. 在 Settings 頁點「💾 匯出 JSON」備份本機資料
3. 點「📥 從 Sheets 匯入」恢復從 Google Sheet 保存的資料

---

## 📊 架構概覽

```
┌──────────────────────────────┐
│   React App (Vercel)         │
│  https://event-scheduler...  │
└───────────────┬──────────────┘
                │ (HTTPS)
                ▼
┌──────────────────────────────┐
│  Google Sheets + GAS API     │
│  (資料存儲與同步)             │
└──────────────────────────────┘
```

---

## ✅ 檢查清單

- [ ] GitHub Repository 建立並推送代碼
- [ ] Vercel 部署完成，有網址
- [ ] Google Sheets 建立
- [ ] Google Apps Script 部署完成
- [ ] GAS URL 已在 App 中設定
- [ ] 測試：輸入一筆資料並檢查 Google Sheet 是否更新
- [ ] 團隊成員已收到使用說明

---

## 🎯 後續步驟

### 自動備份
在 Google Sheet 中：
- 設定「檔案」→「版本記錄」自動保留修改歷史
- 定期匯出 JSON 到本機備份

### 多人協作
- 所有人共享同一個 Vercel 網址
- 共享同一個 Google Sheet（可在 Google Drive 中分享權限）
- 自動同步讓所有人看到最新資料

### 後續擴展
可考慮的升級功能：
- 連接 Google Calendar 自動同步活動
- Slack 通知（當資料更新時）
- Email 提醒（給指定人員）

---

## 💬 需要幫助？

如有問題，檢查：
1. Google Sheet 的「活動日誌」（頂端 ⏱ 圖示）
2. Vercel 的 Build & Deployment Logs
3. Google Apps Script 的「執行紀錄」（Google Sheet → 擴充程序 → Apps Script → 執行紀錄）

**祝你部署順利！🎉**
