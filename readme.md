# 💎 NoMoreNonsense - AI 廢文脫水機

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.6-green.svg)
![Engine](https://img.shields.io/badge/AI-Gemini%203%20Flash-orange.svg)

**NoMoreNonsense** 是一款基於 Google Gemini 3 Flash 技術的 Chrome 擴充功能。它能幫你從長篇大論、充滿 AI 贅句或客套話的網頁內容中，快速「脫水」萃取出核心事實、關鍵數據與邏輯結論。

## ✨ 核心功能

-   **高效脫水**：剔除冗詞贅句，直接顯示精煉後的條列式重點。
-   **雙模式萃取**：支援「選取文字萃取」與「全網頁內容萃取」。
-   **Gemini 3 引擎**：預設採用最新 Gemini 3 Flash Preview，反應極速且邏輯精準。
-   **自訂 Prompt**：內建設定面板，可根據需求調整 AI 的指令（例如：翻譯、總結、格式變換）。
-   **事實查核評分**：自動對分析內容進行事實查核度評分（1-10分），並提供簡短說明。
-   **商業化設計**：具備 API Key 儲存管理功能，不需在程式碼中寫死金鑰，安全且方便。
-   **閱讀優化**：支援 Markdown 渲染、字體縮放與內容區域滾動。

## 🚀 安裝教學

1.  **下載專案**：將此專案 Clone 或下載 `.zip` 檔至本機並解壓縮。
2.  **開啟擴充功能管理員**：在 Chrome 瀏覽器網址列輸入 `chrome://extensions/`。
3.  **啟用開發者模式**：開啟右上角的「開發者模式」。
4.  **載入解壓縮後的擴充功能**：點擊「載入解壓後的擴充功能」，選取本專案的資料夾。
5.  **準備 API Key**：前往 [Google AI Studio](https://aistudio.google.com/) 免費申請您的 API Key。

## 🛠️ 如何使用

1.  **設定 Key**：首次執行時，系統會提示您輸入 API Key。
2.  **執行萃取**：
    * **選取模式**：在網頁上反白一段文字，點擊右鍵選單中的「✨ 萃取這段話」。
    * **全頁模式**：在網頁空白處點擊右鍵選單中的「📄 萃取全頁內容」。
3.  **自訂指令**：點擊彈出視窗右上角的 ⚙️ 齒輪圖示，即可修改 System Prompt 以符合您的個人需求。

## 📂 檔案結構

-   `manifest.json`: 擴充功能設定檔（定義權限與資源）。
-   `background.js`: 後台 Service Worker，負責右鍵選單管理與腳本注入。
-   `content.js`: 核心邏輯處理，包含 API 呼叫、UI 渲染與設定儲存。
-   `styles.css`: 漂浮視窗的視覺樣式與動畫。

## 🛡️ 隱私權聲明

本外掛僅將您選取的文字傳送至 Google Gemini API 進行處理。您的 **API Key** 會安全地儲存在瀏覽器的 `chrome.storage.local` 中，不會傳送至任何第三方伺服器，開發者亦無法讀取。

## 📝 授權協議

本專案採用 [MIT License](LICENSE) 授權。