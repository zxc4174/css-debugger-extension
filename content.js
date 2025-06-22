// content.js

if (typeof window.cssDebugger === "undefined") {
  window.cssDebugger = {
    isEnabled: false,
    currentElement: null,
    tooltip: null,
    isDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
  };

  // Toggle the debug outline class on <html>
  function applyGlobalOutline() {
    document.documentElement.classList.add("css-debugger-enabled");
  }
  function removeGlobalOutline() {
    document.documentElement.classList.remove("css-debugger-enabled");
  }

  // Listen for toggle/getStatus messages
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
      window.cssDebugger.isEnabled = !window.cssDebugger.isEnabled;
      if (window.cssDebugger.isEnabled) {
        applyGlobalOutline();
      } else {
        removeHighlight();
        removeGlobalOutline();
      }
      sendResponse({ enabled: window.cssDebugger.isEnabled });
    } else if (request.action === "getStatus") {
      sendResponse({ enabled: window.cssDebugger.isEnabled });
    }
  });

  // React to system color‐scheme changes
  function applyTheme() {
    window.cssDebugger.isDarkMode = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (window.cssDebugger.tooltip) updateTooltipTheme();
  }
  function updateTooltipTheme() {
    const tip = window.cssDebugger.tooltip;
    tip.classList.toggle("dark", window.cssDebugger.isDarkMode);
    tip.classList.toggle("light", !window.cssDebugger.isDarkMode);
  }

  // Add a label inside each box‐model layer
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
      color: "#333",
    });
    box.appendChild(lbl);
  }

  // Create nested box‐model DOM: margin > border > padding > content
  function createBoxModelNode(margin, border, padding, content) {
    const wrapper = document.createElement("div");
    wrapper.className = "box-model";

    function buildLayer(name, dims, className) {
      const layer = document.createElement("div");
      layer.className = className;
      layer.style.position = "relative";
      addLabel(layer, name);
      ["top", "right", "bottom", "left"].forEach((pos) => {
        const edge = document.createElement("div");
        edge.textContent = `${dims[pos]}`;
        Object.assign(edge.style, {
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
        layer.appendChild(edge);
      });
      return layer;
    }

    const mBox = buildLayer("margin", margin, "margin-box");
    const bBox = buildLayer("border", border, "border-box");
    const pBox = buildLayer("padding", padding, "padding-box");

    const cBox = document.createElement("div");
    cBox.className = "content-box";
    cBox.style.position = "relative";
    addLabel(cBox, "content");
    const cText = document.createElement("div");
    cText.textContent = `${content.width.toFixed(1)} × ${content.height.toFixed(
      1
    )}`;
    Object.assign(cText.style, {
      position: "absolute",
      bottom: "2px",
      width: "100%",
      textAlign: "center",
      color: "#333",
      fontSize: "8px",
      pointerEvents: "none",
      userSelect: "none",
    });
    cBox.appendChild(cText);

    pBox.appendChild(cBox);
    bBox.appendChild(pBox);
    mBox.appendChild(bBox);
    wrapper.appendChild(mBox);

    return wrapper;
  }

  // Append computed CSS panel (property names in #a626a4)
  function appendComputedStyles(tip, cs, el) {
    const sc = document.createElement("div");
    sc.className = "scroll-container";

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

  // Drag state
  let isDragging = false,
    dragOffsetX = 0,
    dragOffsetY = 0;

  // Make tooltip draggable
  function makeDraggable(tip) {
    tip.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      const rect = tip.getBoundingClientRect();
      dragOffsetX = e.clientX - rect.left;
      dragOffsetY = e.clientY - rect.top;
      e.preventDefault();
    });
  }

  document.addEventListener("mousemove", (e) => {
    if (!isDragging || !window.cssDebugger.tooltip) return;
    let x = e.clientX - dragOffsetX;
    let y = e.clientY - dragOffsetY;
    x = Math.max(
      0,
      Math.min(window.innerWidth - window.cssDebugger.tooltip.offsetWidth, x)
    );
    y = Math.max(
      0,
      Math.min(window.innerHeight - window.cssDebugger.tooltip.offsetHeight, y)
    );
    window.cssDebugger.tooltip.style.left = `${x}px`;
    window.cssDebugger.tooltip.style.top = `${y}px`;
  });

  document.addEventListener("mouseup", () => {
    if (isDragging) isDragging = false;
  });

  // Close tooltip when pressing Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      removeHighlight();
    }
  });

  // Highlight + tooltip on Ctrl/Cmd + hover
  function highlightElement(e) {
    if (!window.cssDebugger.isEnabled) return;
    if (!(e.ctrlKey || e.metaKey)) return;
    if (window.cssDebugger.tooltip?.contains(e.target)) return;

    // Clear previous
    removeHighlight();

    window.cssDebugger.currentElement = e.target;
    e.target.classList.add("css-debugger-hover");

    // Create tooltip
    const tip = document.createElement("div");
    tip.classList.add(
      "css-debugger-tooltip",
      window.cssDebugger.isDarkMode ? "dark" : "light"
    );
    // Allow dragging
    tip.style.pointerEvents = "auto";
    tip.style.cursor = "move";
    window.cssDebugger.tooltip = tip;
    document.body.appendChild(tip);

    // Make draggable
    makeDraggable(tip);

    // Initial position
    let x = e.clientX + 10,
      y = e.clientY + 10;
    if (x + 400 > innerWidth) x = e.clientX - 310;
    if (y + 300 > innerHeight) y = e.clientY - 210;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;

    // Compute metrics
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

    tip.appendChild(createBoxModelNode(margin, border, padding, content));
    appendComputedStyles(tip, cs, e.target);
  }

  // Remove hover highlight and tooltip
  function removeHighlight() {
    if (window.cssDebugger.currentElement) {
      window.cssDebugger.currentElement.classList.remove("css-debugger-hover");
      window.cssDebugger.currentElement = null;
    }
    if (window.cssDebugger.tooltip) {
      window.cssDebugger.tooltip.remove();
      window.cssDebugger.tooltip = null;
    }
  }

  document.addEventListener("mouseover", highlightElement);
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", applyTheme);
}
