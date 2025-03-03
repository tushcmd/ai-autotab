// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("AI Text Completion extension installed");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    sendResponse({ status: "ok" });
    return true;
  }

  if (request.action === "getCompletion") {
    const text = request.text;

    // Add error handling for the timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Request timeout")), 10000);
    });

    window.completionTimer = setTimeout(async () => {
      try {
        const response = await Promise.race([
          fetch("http://localhost:3000/api/completion", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ text }),
          }),
          timeoutPromise,
        ]);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
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
      } catch (error) {
        console.error("Error fetching completion:", error);
        sendResponse({ error: error.message || "Failed to get completion" });
      }
    }, 300);

    return true;
  }
});
