// content.js

if (typeof window.cssDebugger === "undefined") {
  window.cssDebugger = {
    isEnabled: false,
    currentElement: null,
    tooltip: null,
    isDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
  };

  // Listen for toggle messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
      window.cssDebugger.isEnabled = !window.cssDebugger.isEnabled;
      if (!window.cssDebugger.isEnabled) removeHighlight();
      sendResponse({ enabled: window.cssDebugger.isEnabled });
    } else if (request.action === "getStatus") {
      sendResponse({ enabled: window.cssDebugger.isEnabled });
    }
  });

  // Update theme (light / dark)
  function applyTheme() {
    window.cssDebugger.isDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (window.cssDebugger.tooltip) updateTooltipTheme();
  }
  function updateTooltipTheme() {
    const tip = window.cssDebugger.tooltip;
    if (!tip) return;
    tip.classList.toggle("dark", window.cssDebugger.isDarkMode);
    tip.classList.toggle("light", !window.cssDebugger.isDarkMode);
  }

  // Add top-left label to a box
  function addLabel(box, text) {
    const lbl = document.createElement("div");
    lbl.textContent = text;
    Object.assign(lbl.style, {
      position: "absolute",
      top: "2px",
      left: "2px",
      fontSize: "8px",
      fontWeight: "bold",
      pointerEvents: "none",
      userSelect: "none",
    });
    box.appendChild(lbl);
  }

  // Create nested box-model DOM structure
  function createBoxModelNode(margin, border, padding, content) {
    // Wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "box-model";

    // 1. margin layer
    const marginBox = document.createElement("div");
    marginBox.className = "margin-box";
    marginBox.style.position = "relative";
    addLabel(marginBox, "margin");
    ["top", "left", "right", "bottom"].forEach((pos) => {
      const d = document.createElement("div");
      d.textContent = `${margin[pos]}`;
      Object.assign(d.style, {
        position: "absolute",
        ...(pos === "top" && {
          top: "2px",
          width: "100%",
          textAlign: "center",
        }),
        ...(pos === "bottom" && {
          bottom: "2px",
          width: "100%",
          textAlign: "center",
        }),
        ...(pos === "left" && {
          left: "2px",
          top: "50%",
          transform: "translateY(-50%)",
        }),
        ...(pos === "right" && {
          right: "2px",
          top: "50%",
          transform: "translateY(-50%)",
        }),
        color: "#333",
        fontSize: "8px",
        pointerEvents: "none",
        userSelect: "none",
      });
      marginBox.appendChild(d);
    });

    // 2. border layer (nested in margin)
    const borderBox = document.createElement("div");
    borderBox.className = "border-box";
    borderBox.style.position = "relative";
    addLabel(borderBox, "border");
    ["top", "left", "right", "bottom"].forEach((pos) => {
      const d = document.createElement("div");
      d.textContent = `${border[pos]}`;
      Object.assign(d.style, {
        position: "absolute",
        ...(pos === "top" && {
          top: "2px",
          width: "100%",
          textAlign: "center",
        }),
        ...(pos === "bottom" && {
          bottom: "2px",
          width: "100%",
          textAlign: "center",
        }),
        ...(pos === "left" && {
          left: "2px",
          top: "50%",
          transform: "translateY(-50%)",
        }),
        ...(pos === "right" && {
          right: "2px",
          top: "50%",
          transform: "translateY(-50%)",
        }),
        color: "#333",
        fontSize: "8px",
        pointerEvents: "none",
        userSelect: "none",
      });
      borderBox.appendChild(d);
    });
    marginBox.appendChild(borderBox);

    // 3. padding layer (nested in border)
    const paddingBox = document.createElement("div");
    paddingBox.className = "padding-box";
    paddingBox.style.position = "relative";
    addLabel(paddingBox, "padding");
    ["top", "left", "right", "bottom"].forEach((pos) => {
      const d = document.createElement("div");
      d.textContent = `${padding[pos]}`;
      Object.assign(d.style, {
        position: "absolute",
        ...(pos === "top" && {
          top: "2px",
          width: "100%",
          textAlign: "center",
        }),
        ...(pos === "bottom" && {
          bottom: "2px",
          width: "100%",
          textAlign: "center",
        }),
        ...(pos === "left" && {
          left: "2px",
          top: "50%",
          transform: "translateY(-50%)",
        }),
        ...(pos === "right" && {
          right: "2px",
          top: "50%",
          transform: "translateY(-50%)",
        }),
        color: "#333",
        fontSize: "8px",
        pointerEvents: "none",
        userSelect: "none",
      });
      paddingBox.appendChild(d);
    });
    borderBox.appendChild(paddingBox);

    // 4. content layer (nested in padding)
    const contentBox = document.createElement("div");
    contentBox.className = "content-box";
    contentBox.style.position = "relative";
    addLabel(contentBox, "content");
    const txt = document.createElement("div");
    txt.textContent = `${content.width.toFixed(1)} × ${content.height.toFixed(
      1
    )}`;
    Object.assign(txt.style, {
      position: "absolute",
      bottom: "2px",
      width: "100%",
      textAlign: "center",
      color: "#333",
      fontSize: "8px",
      pointerEvents: "none",
      userSelect: "none",
    });
    contentBox.appendChild(txt);
    paddingBox.appendChild(contentBox);

    wrapper.appendChild(marginBox);
    return wrapper;
  }

  // Build computed CSS panel with labels colored #a626a4
  function appendComputedStyles(tip, cs, el) {
    const sc = document.createElement("div");
    sc.className = "scroll-container";

    // Element title: only the tag/id/class string
    const title = document.createElement("div");
    title.textContent =
      `${el.tagName.toLowerCase()}` +
      (el.id ? `#${el.id}` : "") +
      (typeof el.className === "string" && el.className.trim()
        ? "." + el.className.trim().split(/\s+/).join(".")
        : "");
    title.style.marginBottom = "4px";
    sc.appendChild(title);

    const props = [
      "display",
      "position",
      "width",
      "height",
      "background-color",
      "color",
      "font-size",
      "font-family",
      "line-height",
      "text-align",
      "vertical-align",
      "float",
      "clear",
      "z-index",
      "opacity",
      "transform",
      "transition",
      "box-shadow",
      "border-radius",
      "overflow",
    ];

    props.forEach((pn) => {
      const v = cs.getPropertyValue(pn);
      if (v && v !== "none" && v !== "auto" && v !== "normal") {
        const line = document.createElement("div");
        const nameSpan = document.createElement("span");
        nameSpan.textContent = pn;
        nameSpan.style.color = "#a626a4";
        line.appendChild(nameSpan);
        line.appendChild(document.createTextNode(`: ${v};`));
        sc.appendChild(line);
      }
    });

    tip.appendChild(sc);
  }

  // Highlight element and show tooltip
  function highlightElement(e) {
    if (!window.cssDebugger.isEnabled) return;
    if (window.cssDebugger.tooltip?.contains(e.target)) return;

    // Clear previous highlight
    if (window.cssDebugger.currentElement) {
      window.cssDebugger.currentElement.style.outline = "";
    }
    window.cssDebugger.currentElement = e.target;
    e.target.style.outline = "2px solid rgb(110, 55, 249)";
    window.cssDebugger.tooltip?.remove();

    // Create tooltip container
    const tip = document.createElement("div");
    tip.classList.add(
      "css-debugger-tooltip",
      window.cssDebugger.isDarkMode ? "dark" : "light"
    );
    window.cssDebugger.tooltip = tip;

    // Position tooltip
    let x = e.clientX + 10,
      y = e.clientY + 10;
    if (x + 400 > innerWidth) x = e.clientX - 310;
    if (y + 300 > innerHeight) y = e.clientY - 210;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
    document.body.appendChild(tip);

    // Get computed styles and dimensions
    const cs = getComputedStyle(e.target);
    const r = e.target.getBoundingClientRect();
    const margin = {
      top: parseFloat(cs.marginTop) || 0,
      right: parseFloat(cs.marginRight) || 0,
      bottom: parseFloat(cs.marginBottom) || 0,
      left: parseFloat(cs.marginLeft) || 0,
    };
    const border = {
      top: parseFloat(cs.borderTopWidth) || 0,
      right: parseFloat(cs.borderRightWidth) || 0,
      bottom: parseFloat(cs.borderBottomWidth) || 0,
      left: parseFloat(cs.borderLeftWidth) || 0,
    };
    const padding = {
      top: parseFloat(cs.paddingTop) || 0,
      right: parseFloat(cs.paddingRight) || 0,
      bottom: parseFloat(cs.paddingBottom) || 0,
      left: parseFloat(cs.paddingLeft) || 0,
    };
    const content = {
      width:
        r.width - border.left - border.right - padding.left - padding.right,
      height:
        r.height - border.top - border.bottom - padding.top - padding.bottom,
    };

    // Append box model and computed styles
    tip.appendChild(createBoxModelNode(margin, border, padding, content));
    appendComputedStyles(tip, cs, e.target);
  }

  // Remove highlight and tooltip
  function removeHighlight() {
    if (window.cssDebugger.currentElement) {
      window.cssDebugger.currentElement.style.outline = "";
      window.cssDebugger.currentElement = null;
    }
    window.cssDebugger.tooltip?.remove();
    window.cssDebugger.tooltip = null;
  }

  document.addEventListener("mouseover", highlightElement);
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", applyTheme);
}
