chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: "extract-selection", title: "✨ 萃取這段話", contexts: ["selection"] });
  chrome.contextMenus.create({ id: "extract-page", title: "📄 萃取全頁內容", contexts: ["page"] });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const action = info.menuItemId === "extract-selection" ? "DO_EXTRACTION" : "DO_PAGE_EXTRACTION";
  const text = info.selectionText || "";

  try {
    // 試探性發送
    await chrome.tabs.sendMessage(tab.id, { action, text });
  } catch (err) {
    // 發現通訊中斷，強行注入 content.js
    console.log("偵測到通訊中斷，重新注入腳本...");
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    // 延遲發送確保 script 已啟動
    setTimeout(() => {
      chrome.tabs.sendMessage(tab.id, { action, text }).catch(e => console.error("注入後通訊依然失敗"));
    }, 300);
  }
});