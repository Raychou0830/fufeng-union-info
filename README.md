# 桃園市教育產業工會-福豐國中分會 資訊福利站

給會員從 LINE 開啟、快速看重點與查福利的公開靜態網站。採使用者核准的「會員通訊」介面：一則重點導讀，接續青綠福利、暖橘活動、靛藍新聞三區。已上傳 GitHub，透過手動 GitHub Actions 發布。

- 會員網站：https://raychou0830.github.io/fufeng-union-info/
- 原始碼：https://github.com/Raychou0830/fufeng-union-info

## 本機預覽

需要 Node.js 22 以上，不需要安裝 npm 套件。

```powershell
node scripts/build.mjs
node scripts/serve.mjs
```

開啟腳本輸出的本機網址，預設為 http://127.0.0.1:4173/ 。也可執行 `預覽網站.ps1`，會優先使用 PATH 上的 Node，或這台電腦的 Codex 內建 Node。

驗證：

```powershell
node scripts/check.mjs
node --test tests/site.test.mjs
```

## 功能

- 首頁短摘要、與會員的關係、完整來源與下一步。
- 全站搜尋，包含歷史資料；福利可依店家、關鍵字與分類查詢。
- 活動依台北時間顯示報名狀態；已結束的活動移至歷史區。
- 活動 PDF 以本機保存的 PDF.js 逐頁預覽，可縮放、下載；原始檔位元組不變。
- 公文網頁摘要，不公開個別受文者資料。
- 每筆有 `#/read/…`、`#/event/…` 或 `#/benefit/…` 固定連結，可複製至 LINE。
- 所有模組與資產使用相對路徑，適用 GitHub Pages 的專案子路徑；不需要伺服器 URL rewrite。

## 下次有新資訊

把訊息及附件放入原本兩個資料夾，告訴 Codex：

> 請依 AGENTS.md 整理新收到的資料，更新網站並產生待確認清單，先不要發布。

Codex 會先執行收件盤點，再閱讀、分類與摘要。`scripts/inbox.mjs` 只找出新／變更檔案，不會單獨啟動 AI 或自動發布。細節見 AGENTS.md。

## 檔案位置

| 路徑 | 用途 |
|---|---|
| content/site.json | 可公開的結構化文章、活動、福利與站名 |
| content/public-files/ | 已檢查可公開的原始活動 PDF |
| content/attachments.json | 公開 PDF 白名單與 SHA-256 |
| web/ | HTML、CSS、JavaScript 與 PDF.js |
| dist/ | 建置後唯一可發布的目錄 |
| .work/ | 本機來源指紋與盤點報告，不提交 |
| 收到的訊息／收到的公文或活動資訊 | 私人原始來源，不提交 |
| 待確認清單.md | 這版內容及尚待核對事項 |

`build.mjs` 會重建專案內的 dist/，請勿在 dist/ 手動維護內容。

## GitHub Pages 發布

已設定公開儲存庫 `Raychou0830/fufeng-union-info`，Pages Source 為 GitHub Actions；原始收件、內部待確認清單、設計稿與審查證據留在本機。日後更新先審閱內容，確認後：

1. 提交核准的網站變更並推送 `main`；私有原始資料已由 .gitignore 排除。
2. 前往儲存庫的 Actions 頁面。
3. 在 Actions 手動執行「Publish approved site to GitHub Pages」。Workflow 先建置、驗證及測試，再只上傳 dist/。
4. 成功後以 workflow 回傳的網址檢查首頁、分享連結與 PDF。

工作流程刻意只支援手動觸發，推送程式碼不代表使用者已確認發布。

## 第三方授權

PDF.js 5.6.205 取自 Codex 已提供的 pdfjs-dist 官方套件，採 Apache-2.0；LICENSE 及各資源的授權檔隨套件保留於 web/assets/vendor/pdfjs/。目前沒有外部字型、追蹤碼、CDN 或會員資料庫。
