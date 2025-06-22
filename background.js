// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("CSS Debugger Extension Installed");
});

chrome.action.onClicked.addListener((tab) => {
  // When the extension icon is clicked, inject the content script into the active tab
  // This ensures the content script is always running when the popup tries to communicate
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      files: ["content.js"],
    },
    () => {
      // After injecting, send a message to the content script to toggle its state
      chrome.tabs.sendMessage(tab.id, { action: "toggle" }, (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Error sending message to content script:",
            chrome.runtime.lastError.message
          );
          // Handle error, e.g., content script not yet ready or tab not accessible
        } else if (response) {
          console.log("Content script status:", response.enabled);
        }
      });
    }
  );
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getComputedStyle") {
    chrome.scripting
      .executeScript({
        target: { tabId: sender.tab.id },
        function: (selector) => {
          const element = document.querySelector(selector);
          if (element) {
            const computedStyle = window.getComputedStyle(element);
            const style = {};
            for (let i = 0; i < computedStyle.length; i++) {
              const prop = computedStyle[i];
              style[prop] = computedStyle.getPropertyValue(prop);
            }
            return style;
          }
          return null;
        },
        args: [request.selector],
      })
      .then((result) => {
        sendResponse(result[0].result);
      });
    return true; // Indicates that the response will be sent asynchronously
  }
});
