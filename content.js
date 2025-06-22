// content.js

if (typeof window.cssDebugger === "undefined") {
  window.cssDebugger = {
    isEnabled: false,
    currentElement: null,
    tooltip: null,
    isDarkMode: window.matchMedia("(prefers-color-scheme: dark)").matches,
  };

  // Toggle the “debug” class on <html>
  function applyGlobalOutline() {
    document.documentElement.classList.add("css-debugger-enabled");
  }
  function removeGlobalOutline() {
    document.documentElement.classList.remove("css-debugger-enabled");
  }

  // Listen for popup toggle/getStatus
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggle") {
      window.cssDebugger.isEnabled = !window.cssDebugger.isEnabled;
      if (window.cssDebugger.isEnabled) {
        applyGlobalOutline();
      } else {
        removeGlobalOutline();
        removeHighlight();
        window.cssDebugger.tooltip?.remove();
      }
      sendResponse({ enabled: window.cssDebugger.isEnabled });
    } else if (request.action === "getStatus") {
      sendResponse({ enabled: window.cssDebugger.isEnabled });
    }
  });

  // Update tooltip theme if OS theme changes
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

  // Add a tiny label inside each box-model layer
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

  // Build nested box-model visualization: margin > border > padding > content
  function createBoxModelNode(margin, border, padding, content) {
    const wrapper = document.createElement("div");
    wrapper.className = "box-model";

    // helper to build each layer
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

    // nest them
    pBox.appendChild(cBox);
    bBox.appendChild(pBox);
    mBox.appendChild(bBox);
    wrapper.appendChild(mBox);

    return wrapper;
  }

  // Build computed CSS panel (names in #a626a4)
  function appendComputedStyles(tip, cs, el) {
    const sc = document.createElement("div");
    sc.className = "scroll-container";

    // selector line
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

  // Highlight + tooltip only on Ctrl/Cmd + hover
  function highlightElement(e) {
    if (!window.cssDebugger.isEnabled) return;
    if (!(e.ctrlKey || e.metaKey)) return;
    if (window.cssDebugger.tooltip?.contains(e.target)) return;

    // remove previous
    if (window.cssDebugger.currentElement) {
      window.cssDebugger.currentElement.classList.remove("css-debugger-hover");
    }
    window.cssDebugger.currentElement = e.target;
    e.target.classList.add("css-debugger-hover");
    window.cssDebugger.tooltip?.remove();

    // build tooltip
    const tip = document.createElement("div");
    tip.classList.add(
      "css-debugger-tooltip",
      window.cssDebugger.isDarkMode ? "dark" : "light"
    );
    window.cssDebugger.tooltip = tip;
    document.body.appendChild(tip);

    // position it
    let x = e.clientX + 10,
      y = e.clientY + 10;
    if (x + 400 > innerWidth) x = e.clientX - 310;
    if (y + 300 > innerHeight) y = e.clientY - 210;
    tip.style.left = x + "px";
    tip.style.top = y + "px";

    // gather metrics
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

  // Remove hover highlight + tooltip
  function removeHighlight() {
    if (window.cssDebugger.currentElement) {
      window.cssDebugger.currentElement.classList.remove("css-debugger-hover");
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
