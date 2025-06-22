// popup.js

document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleButton');
  const statusText = document.getElementById('status');

  function updateButtonState(enabled) {
    if (enabled) {
      toggleButton.textContent = 'Disable';
      toggleButton.classList.add('disabled');
      statusText.textContent = 'CSS debugging is enabled';
    } else {
      toggleButton.textContent = 'Enable';
      toggleButton.classList.remove('disabled');
      statusText.textContent = 'CSS debugging is disabled';
    }
  }

  // Function to inject content script and then send message
  function injectAndSendMessage(action) {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs.length === 0) {
        console.error("No active tab found.");
        statusText.textContent = 'No active tab. Please open a web page.';
        return;
      }
      const tabId = tabs[0].id;

      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      }, () => {
        if (chrome.runtime.lastError) {
          console.error("Script injection failed:", chrome.runtime.lastError.message);
          statusText.textContent = 'Error injecting script. Check console.';
          return;
        }
        // Now that content script is (re)injected, send the message
        chrome.tabs.sendMessage(tabId, { action: action }, function(response) {
          if (chrome.runtime.lastError) {
            console.error("Message sending failed:", chrome.runtime.lastError.message);
            statusText.textContent = 'Error communicating with page. Try refreshing.';
            updateButtonState(false); // Assume disabled on error
          } else if (response) {
            updateButtonState(response.enabled);
          }
        });
      });
    });
  }

  // Initial status check
  injectAndSendMessage("getStatus");

  // Handle toggle button click
  toggleButton.addEventListener('click', function() {
    injectAndSendMessage("toggle");
  });
});

