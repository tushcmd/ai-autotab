// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("AI Text Completion extension installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCompletion") {
    const text = request.text;

    // Debounce requests to avoid too many API calls
    if (window.completionTimer) {
      clearTimeout(window.completionTimer);
    }

    window.completionTimer = setTimeout(() => {
      fetch("http://localhost:3000/api/completion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.completion) {
            // Process the completion to make it more suitable for autocompletion
            // Remove any quotation marks or formatting that Gemini might add
            let cleanedCompletion = data.completion.trim();

            // Remove the original text if Gemini repeated it
            if (cleanedCompletion.startsWith(text)) {
              cleanedCompletion = cleanedCompletion.substring(text.length);
            }

            // Remove quotes that might appear in the response
            cleanedCompletion = cleanedCompletion.replace(/^["']|["']$/g, "");

            sendResponse({ completion: cleanedCompletion });
          } else {
            sendResponse({ completion: "" });
          }
        })
        .catch((error) => {
          console.error("Error fetching completion:", error);
          sendResponse({ error: "Failed to get completion" });
        });
    }, 300); // 300ms debounce

    return true; // Required for async response
  }
});
