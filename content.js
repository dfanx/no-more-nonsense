/**
 * NoMoreNonsense - 內容萃取腳本 (自定義 Prompt & Key 管理版)
 */

// 預設的 Prompt 指令
const DEFAULT_PROMPT = "你是一位專業的內容分析師。請將以下內容『脫水』，並依照以下規範呈現：\n\n1. **結構化呈現**：使用 Markdown 標題（###）與加粗（**）區分重點，確保閱讀性佳。\n2. **精煉內容**：移除贅句，保留核心事實、數據與關鍵邏輯。\n3. **事實查核度評分**：在內容最後，另起一行標記『### 事實查核度評分：X/10』，並簡短說明評分理由。\n4. **語言**：必須使用繁體中文。";

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "DO_EXTRACTION" || request.action === "DO_PAGE_EXTRACTION") {
    let textToProcess = request.text;

    if (request.action === "DO_PAGE_EXTRACTION") {
      const paragraphs = Array.from(document.querySelectorAll('p, article, section, h1, h2, h3'))
        .map(el => el.innerText.trim())
        .filter(t => t.length > 20);
      textToProcess = paragraphs.join("\n\n").substring(0, 10000);
    }

    if (!textToProcess || textToProcess.length < 5) {
      alert("選取內容太少，無法進行處理。");
      return;
    }

    const config = await getConfiguration();
    if (!config.apiKey) return;

    showFloatingWindow("💎 正在處理內容...");
    processAI(textToProcess, config.apiKey, config.systemPrompt);
  }
});

/**
 * 獲取設定 (Key 與 Prompt)
 */
async function getConfiguration() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['GEMINI_API_KEY', 'CUSTOM_PROMPT'], (result) => {
      let apiKey = result.GEMINI_API_KEY;
      if (!apiKey) {
        apiKey = window.prompt("請輸入您的 Gemini API Key：");
        if (apiKey) chrome.storage.local.set({ 'GEMINI_API_KEY': apiKey.trim() });
      }
      resolve({
        apiKey: apiKey,
        systemPrompt: result.CUSTOM_PROMPT || DEFAULT_PROMPT
      });
    });
  });
}

/**
 * 核心處理函數
 */
async function processAI(text, apiKey, systemPrompt) {
  const configs = [
    { ver: "v1beta", model: "gemini-3-flash-preview" },
    { ver: "v1beta", model: "gemini-3-flash" }
  ];
  
  const finalPrompt = systemPrompt + "\n\n待處理內容：\n" + text;
  let lastError = "";

  for (let config of configs) {
    try {
      const url = `https://generativelanguage.googleapis.com/${config.ver}/models/${config.model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2048 }
        })
      });

      const data = await response.json();
      if (data.error) {
        lastError = data.error.message;
        if (data.error.status === "UNAUTHENTICATED") chrome.storage.local.remove('GEMINI_API_KEY');
        continue;
      }
      
      if (data.candidates && data.candidates[0].content) {
        updateFloatingWindow(data.candidates[0].content.parts[0].text);
        return; 
      }
    } catch (err) { lastError = err.message; }
  }
  updateFloatingWindow("❌ 錯誤: " + lastError);
}

/**
 * UI 工具：漂浮視窗 (新增設定模式)
 */
function showFloatingWindow(msg) {
  let div = document.getElementById('ai-extractor-window');
  if (!div) {
    div = document.createElement('div');
    div.id = 'ai-extractor-window';
    div.style.setProperty('--ai-font-size', '16px');
    document.body.appendChild(div);
  }
  
  div.innerHTML = `
    <div class="ai-header" style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#f8f9fa; border-bottom:1px solid #eee; border-radius:8px 8px 0 0; flex-shrink:0;">
      <div class="ai-title" style="font-weight:bold; color:#333;">💎 AI 助手</div>
      <div class="ai-controls" style="display:flex; align-items:center; gap:8px;">
        <button id="ai-edit-prompt" title="自訂指令" style="cursor:pointer; background:none; border:none; font-size:16px;">⚙️</button>
        <button id="ai-zoom-in" style="cursor:pointer; padding:2px 6px;">A+</button>
        <button id="ai-zoom-out" style="cursor:pointer; padding:2px 6px;">A-</button>
        <span id="ai-close-btn" style="cursor:pointer; font-size:20px; color:#999;">&times;</span>
      </div>
    </div>
    <div class="ai-content-wrapper" style="padding:15px; overflow-y:auto; flex-grow:1; max-height:calc(80vh - 50px);">
      <div id="ai-display-area" class="ai-content" style="line-height:1.6; font-size:var(--ai-font-size); color:#333; word-break:break-word;">${formatMarkdown(msg)}</div>
      <div id="ai-edit-area" style="display:none; flex-direction:column; gap:10px;">
        <label style="font-size:12px; font-weight:bold;">自訂 System Prompt：</label>
        <textarea id="ai-prompt-input" style="width:100%; height:200px; font-size:13px; padding:8px; border:1px solid #ccc; border-radius:4px; font-family:inherit;"></textarea>
        <button id="ai-save-prompt" style="background:#1a73e8; color:white; border:none; padding:8px; border-radius:4px; cursor:pointer;">儲存設定</button>
      </div>
    </div>`;
  
  div.style.cssText = "position:fixed; top:20px; right:20px; width:450px; max-height:80vh; background:white; border:1px solid #ccc; border-radius:8px; box-shadow:0 4px 15px rgba(0,0,0,0.2); z-index:2147483647; display:flex; flex-direction:column; font-family:sans-serif;";

  // 綁定自訂 Prompt 事件
  document.getElementById('ai-edit-prompt').onclick = async () => {
    const displayArea = document.getElementById('ai-display-area');
    const editArea = document.getElementById('ai-edit-area');
    const promptInput = document.getElementById('ai-prompt-input');

    if (editArea.style.display === 'none') {
      const res = await chrome.storage.local.get(['CUSTOM_PROMPT']);
      promptInput.value = res.CUSTOM_PROMPT || DEFAULT_PROMPT;
      displayArea.style.display = 'none';
      editArea.style.display = 'flex';
    } else {
      displayArea.style.display = 'block';
      editArea.style.display = 'none';
    }
  };

  document.getElementById('ai-save-prompt').onclick = () => {
    const newPrompt = document.getElementById('ai-prompt-input').value;
    chrome.storage.local.set({ 'CUSTOM_PROMPT': newPrompt }, () => {
      alert("✅ 設定已儲存！");
      document.getElementById('ai-display-area').style.display = 'block';
      document.getElementById('ai-edit-area').style.display = 'none';
    });
  };

  document.getElementById('ai-zoom-in').onclick = () => adjustFontSize(2);
  document.getElementById('ai-zoom-out').onclick = () => adjustFontSize(-2);
  document.getElementById('ai-close-btn').onclick = () => { div.style.display = 'none'; };
}

function updateFloatingWindow(msg) {
  const el = document.querySelector('#ai-extractor-window .ai-content');
  if (el) el.innerHTML = formatMarkdown(msg);
}

function formatMarkdown(text) {
  return text
    .replace(/### (.*)/g, '<h3 style="margin:15px 0 8px 0; color:#1a73e8; border-bottom:1px solid #e8eaed; padding-bottom:4px;">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\* (.*)/g, '<li style="margin-bottom:6px;">$1</li>')
    .replace(/\n\n/g, '<div style="margin-bottom:12px;"></div>')
    .replace(/\n/g, '<br>');
}

function adjustFontSize(delta) {
  const div = document.getElementById('ai-extractor-window');
  if (div) {
    const size = parseInt(getComputedStyle(div).getPropertyValue('--ai-font-size'));
    div.style.setProperty('--ai-font-size', Math.min(Math.max(size + delta, 12), 32) + 'px');
  }
}