# ⚡ 快速開始清單（5 分鐘版）

複製這個清單，一項一項完成！

---

## 📦 準備物品

- [ ] GitHub 帳號（沒有？去 https://github.com 註冊免費帳號）
- [ ] Google 帳號（有 Gmail 就有）
- [ ] Vercel 帳號（可用 GitHub 登入，無需額外註冊）

---

## 🔧 安裝步驟（本機）

```bash
# 1. 進到專案資料夾
cd 你的專案路徑/包場一頁式介面

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器
npm run dev

# 4. 打開瀏覽器
# http://localhost:5173
```

**測試**：能看到「包場排程系統」首頁 ✅

---

## 🚀 部署到網路（30 分鐘）

### 步驟 1：上傳到 GitHub

```bash
cd 包場一頁式介面

# 初始化 git
git init
git add .
git commit -m "Initial commit: event scheduler"
git branch -M main

# 推到 GitHub（先去 GitHub 新建 Repository）
git remote add origin https://github.com/你的用戶名/event-scheduler.git
git push -u origin main
```

### 步驟 2：部署到 Vercel

1. 打開 https://vercel.com
2. 用 GitHub 帳號登入
3. 點「Add New Project」
4. 選擇 `event-scheduler` Repository
5. 點「Import」
6. 等待 2-3 分鐘 → 完成！
7. 複製網址：`https://event-scheduler-xxx.vercel.app`

### 步驟 3：建立 Google Sheets 數據源

#### 3.1 建立試算表
1. 打開 https://sheets.google.com
2. 建立新試算表，取名 `Event Scheduler Database`
3. 複製 URL 中的 Sheet ID：
   ```
   https://docs.google.com/spreadsheets/d/[複製這一串]/edit
   ```

#### 3.2 建立 Google Apps Script
1. 在 Sheet 中點「擴充程序」→「Apps Script」
2. 刪除預設代碼
3. 複製本專案的 `GAS_CODE.js` 中的全部代碼
4. 貼入 Google Apps Script
5. 在最上面填入你的 Sheet ID：
   ```javascript
   const SHEET_ID = "你的_Sheet_ID";
   ```
6. 點「💾 保存」

#### 3.3 部署 GAS
1. 點「部署」→「新建部署」
2. 類型選「Web 應用」
3. 執行者：你的帳號
4. 訪問權限：「所有人」
5. 點「部署」
6. **複製 Web App URL**（看起來像：`https://script.google.com/macros/s/AKfycbyyQpsY...../exec`）

### 步驟 4：連接 App 和 Google Sheets

1. 打開你的 Vercel 網址
2. 點右上角 ⚙️ 進入設定
3. 找「Google Sheets 同步設定」
4. 貼入 Web App URL
5. 點「🔗 儲存 URL」

✅ **完成！App 現在能同步到 Google Sheets 了！**

---

## 🎉 邀請團隊

分享這段文字給你的團隊：

```markdown
## 使用活動排程系統

1. 打開：https://your-vercel-url.vercel.app
2. 第一次用時：
   - 點 ⚙️ 設定
   - 貼入 GAS URL
   - 完成！
3. 開始建立活動

所有資料會自動保存到 Google Sheets
```

---

## 📋 功能速查表

| 我想... | 怎麼做 |
|--------|--------|
| 建立活動 | 📅 總覽 → 下方「+ 新增場次」 |
| 管理人員 | 活動詳情 → 「👔 外場人員」或「👨‍🍳 內場人員」 |
| 管理任務 | 活動詳情 → 「✅ 外場任務清單」 |
| 列印活動 | 上方「🖨️ 列印」 |
| 列印個人行程 | 「📅 人員當日時間表」→ 展開人員 → 「🖨️ 列印」 |
| 同步到 Google Sheets | ⚙️ 設定 → 「☁️ 即時同步」 |
| 開啟自動同步 | ⚙️ 設定 → 「🔄 自動同步」開關 |
| 備份資料 | ⚙️ 設定 → 「💾 匯出 JSON」 |
| 調整字體大小 | 上方「A-」或「A+」 |
| 深色模式 | 上方☀️按鈕 |

---

## 🆘 卡住了？

| 問題 | 解決方案 |
|------|--------|
| npm install 失敗 | 試試 `npm install --legacy-peer-deps` |
| 本機無法跑 | 確認安裝了 Node.js（https://nodejs.org） |
| Vercel 部署失敗 | 檢查 GitHub 上有沒有 `package.json` |
| Google Sheets 不同步 | 確認 GAS URL 有「/exec」結尾、權限設為「所有人」 |
| 資料丟失 | 打開 DevTools (F12) → Application → LocalStorage，找「beach101」開頭的資料 |

---

## 📚 更多幫助

- 💻 **開發者**：看 `DEPLOYMENT.md`
- 👥 **一般使用者**：看 `USER_GUIDE.md`
- 🔧 **技術問題**：看 `README.md`

---

## ✅ 成功標誌

當你看到這些，表示一切正常：

- [ ] App 在瀏覽器能打開（本機或 Vercel）
- [ ] 能建立和編輯活動
- [ ] 資料能自動保存（刷新頁面還在）
- [ ] 能同步到 Google Sheets
- [ ] 能列印活動和個人行程

🎉 **恭喜！你已經完全設定好了！**

---

**需要團隊一起用？**

所有人都打開相同的 Vercel 網址 + 相同的 GAS URL，就能實時協作！

祝你活動順利！
