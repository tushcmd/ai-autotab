let activeElement = null;
let suggestion = null;
let suggestionElement = null;

// Create a suggestion element
function createSuggestionElement() {
  const element = document.createElement("div");
  element.className = "ai-suggestion-overlay";
  element.style.position = "absolute";
  element.style.pointerEvents = "none";
  element.style.color = "#888";
  element.style.zIndex = "9999";
  document.body.appendChild(element);
  return element;
}

// Position the suggestion element
function positionSuggestionElement(target) {
  if (!suggestionElement || !target) return;

  const rect = target.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(target);

  suggestionElement.style.top = `${rect.top + window.scrollY}px`;
  suggestionElement.style.left = `${rect.left + window.scrollX}px`;
  suggestionElement.style.fontFamily = computedStyle.fontFamily;
  suggestionElement.style.fontSize = computedStyle.fontSize;
  suggestionElement.style.fontWeight = computedStyle.fontWeight;
  suggestionElement.style.lineHeight = computedStyle.lineHeight;
  suggestionElement.style.padding = computedStyle.padding;
  suggestionElement.style.textIndent = computedStyle.textIndent;
  suggestionElement.style.whiteSpace = computedStyle.whiteSpace;
}

// Get text before cursor
function getTextBeforeCursor(element) {
  if (element.tagName === "TEXTAREA" || element.tagName === "INPUT") {
    return element.value.substring(0, element.selectionStart);
  } else if (element.isContentEditable) {
    // Handle contentEditable elements
    const selection = window.getSelection();
    if (!selection.rangeCount) return "";

    const range = selection.getRangeAt(0).cloneRange();
    range.setStart(element, 0);
    return range.toString();
  }
  return "";
}

function processSuggestion(originalText, suggestion) {
  // Remove any repeated text from the beginning
  if (suggestion.startsWith(originalText)) {
    suggestion = suggestion.substring(originalText.length);
  }

  // Take only the first sentence or paragraph if it's too long
  const firstSentenceMatch = suggestion.match(/^[^.!?]*[.!?]/);
  if (firstSentenceMatch && suggestion.length > 50) {
    suggestion = firstSentenceMatch[0];
  }

  // Limit suggestion length for UI purposes
  if (suggestion.length > 100) {
    suggestion = suggestion.substring(0, 100);
  }

  return suggestion.trim();
}

// Request completion from background script
function requestCompletion(text) {
  chrome.runtime.sendMessage({ action: "getCompletion", text }, (response) => {
    if (response && response.completion) {
      suggestion = processSuggestion(text, response.completion);
      updateSuggestionDisplay();
    }
  });
}

// Update the display of the suggestion
function updateSuggestionDisplay() {
  if (!activeElement || !suggestion) {
    if (suggestionElement) {
      suggestionElement.style.display = "none";
    }
    return;
  }

  if (!suggestionElement) {
    suggestionElement = createSuggestionElement();
  }

  const beforeCursor = getTextBeforeCursor(activeElement);
  const fullText = beforeCursor + suggestion;

  // For textareas/inputs, position the suggestion element and show only the suggestion part
  if (
    activeElement.tagName === "TEXTAREA" ||
    activeElement.tagName === "INPUT"
  ) {
    positionSuggestionElement(activeElement);
    // Only show the suggestion part (not the full text)
    suggestionElement.textContent = suggestion;

    // Calculate position more precisely
    const textBeforeCursor = activeElement.value.substring(
      0,
      activeElement.selectionStart,
    );
    const tempElement = document.createElement("div");
    tempElement.style.position = "absolute";
    tempElement.style.visibility = "hidden";
    tempElement.style.whiteSpace = "pre";
    tempElement.style.fontFamily =
      window.getComputedStyle(activeElement).fontFamily;
    tempElement.style.fontSize =
      window.getComputedStyle(activeElement).fontSize;
    tempElement.textContent = textBeforeCursor;
    document.body.appendChild(tempElement);

    const cursorOffset = tempElement.getBoundingClientRect().width;
    document.body.removeChild(tempElement);

    // Position the suggestion at cursor position
    suggestionElement.style.left = `${activeElement.getBoundingClientRect().left + window.scrollX + cursorOffset}px`;
    suggestionElement.style.display = "block";
  } else if (activeElement.isContentEditable) {
    // For contentEditable elements
    // Implement similar positioning but for contentEditable
  }
}

// Apply the suggestion
function applySuggestion() {
  if (!activeElement || !suggestion) return;

  if (
    activeElement.tagName === "TEXTAREA" ||
    activeElement.tagName === "INPUT"
  ) {
    const beforeCursor = activeElement.value.substring(
      0,
      activeElement.selectionStart,
    );
    const afterCursor = activeElement.value.substring(
      activeElement.selectionStart,
    );
    activeElement.value = beforeCursor + suggestion + afterCursor;

    // Place cursor at the end of the inserted text
    const newCursorPos = beforeCursor.length + suggestion.length;
    activeElement.setSelectionRange(newCursorPos, newCursorPos);
  } else if (activeElement.isContentEditable) {
    // Implement for contentEditable
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const textNode = document.createTextNode(suggestion);
    range.insertNode(textNode);

    // Place cursor at end of inserted text
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  suggestion = null;
  updateSuggestionDisplay();
}

// Event Handlers
document.addEventListener("focusin", (e) => {
  const element = e.target;
  if (
    element.tagName === "TEXTAREA" ||
    (element.tagName === "INPUT" && element.type === "text") ||
    element.isContentEditable
  ) {
    activeElement = element;
  } else {
    activeElement = null;
    suggestion = null;
  }
  updateSuggestionDisplay();
});

document.addEventListener("focusout", () => {
  activeElement = null;
  suggestion = null;
  updateSuggestionDisplay();
});

document.addEventListener("input", (e) => {
  if (!activeElement) return;

  const text = getTextBeforeCursor(activeElement);
  if (text.trim().length > 0) {
    requestCompletion(text);
  } else {
    suggestion = null;
    updateSuggestionDisplay();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Tab" && suggestion && activeElement) {
    e.preventDefault(); // Prevent default tab behavior
    applySuggestion();
  } else if (
    ["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)
  ) {
    // Clear suggestion on arrow key navigation
    suggestion = null;
    updateSuggestionDisplay();
    // Allow a small delay then request again
    setTimeout(() => {
      if (activeElement) {
        const text = getTextBeforeCursor(activeElement);
        if (text.trim().length > 0) {
          requestCompletion(text);
        }
      }
    }, 300);
  }
});

// Listen for scroll events to reposition suggestion
window.addEventListener("scroll", () => {
  if (activeElement && suggestionElement) {
    positionSuggestionElement(activeElement);
  }
});

// Initial setup
document.addEventListener("DOMContentLoaded", () => {
  suggestionElement = createSuggestionElement();
});
