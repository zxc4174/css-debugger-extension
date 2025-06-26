// content.js

/**
 * CSS Debugger Chrome Extension Content Script
 * Provides visual debugging tools for CSS with box model visualization and computed styles
 */

(function () {
  "use strict";

  // Prevent multiple initialization
  if (typeof window.cssDebugger !== "undefined") {
    return;
  }

  /**
   * Main CSS Debugger class encapsulating all functionality
   */
  class CSSDebugger {
    constructor() {
      this.isEnabled = false;
      this.currentElement = null;
      this.tooltip = null;
      this.tooltipHost = null;
      this.isDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      this.dragState = {
        isDragging: false,
        dragX: 0,
        dragY: 0,
      };

      this.init();
    }

    /**
     * Initialize the debugger with event listeners
     */
    init() {
      this.setupMessageListeners();
      this.setupEventListeners();
      this.setupThemeListener();
    }

    /**
     * Setup Chrome extension message listeners
     */
    setupMessageListeners() {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        switch (request.action) {
          case "toggle":
            this.toggle();
            sendResponse({ enabled: this.isEnabled });
            break;
          case "getStatus":
            sendResponse({ enabled: this.isEnabled });
            break;
        }
      });
    }

    /**
     * Setup DOM event listeners
     */
    setupEventListeners() {
      document.addEventListener("mouseover", this.handleMouseOver.bind(this));
      document.addEventListener("keydown", this.handleKeyDown.bind(this));
      document.addEventListener("mousemove", this.handleMouseMove.bind(this));
      document.addEventListener("mouseup", this.handleMouseUp.bind(this));
    }

    /**
     * Setup theme change listener
     */
    setupThemeListener() {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", this.updateTheme.bind(this));
    }

    /**
     * Toggle debugger on/off
     */
    toggle() {
      this.isEnabled = !this.isEnabled;
      if (this.isEnabled) {
        this.applyGlobalOutline();
      } else {
        this.removeHighlight();
        this.removeGlobalOutline();
      }
    }

    /**
     * Apply global outline styles
     */
    applyGlobalOutline() {
      document.documentElement.classList.add("css-debugger-enabled");
    }

    /**
     * Remove global outline styles
     */
    removeGlobalOutline() {
      document.documentElement.classList.remove("css-debugger-enabled");
    }

    /**
     * Update theme settings
     */
    updateTheme() {
      this.isDarkMode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (this.tooltip) {
        this.updateTooltipTheme();
      }
    }

    /**
     * Update tooltip theme classes
     */
    updateTooltipTheme() {
      this.tooltip.classList.toggle("dark", this.isDarkMode);
      this.tooltip.classList.toggle("light", !this.isDarkMode);
    }

    /**
     * Handle mouse over events for element highlighting
     */
    handleMouseOver(e) {
      if (!this.isEnabled) return;
      if (!(e.ctrlKey || e.metaKey)) return;
      if (this.tooltipHost?.shadowRoot?.contains(e.target)) return;

      this.highlightElement(e);
    }

    /**
     * Handle keydown events
     */
    handleKeyDown(e) {
      if (e.key === "Escape") {
        this.removeHighlight();
      }
    }

    /**
     * Handle mouse move for dragging
     */
    handleMouseMove(e) {
      if (!this.dragState.isDragging || !this.tooltipHost) return;

      const x = Math.max(
        0,
        Math.min(
          window.innerWidth - this.tooltipHost.offsetWidth,
          e.clientX - this.dragState.dragX
        )
      );
      const y = Math.max(
        0,
        Math.min(
          window.innerHeight - this.tooltipHost.offsetHeight,
          e.clientY - this.dragState.dragY
        )
      );

      this.tooltipHost.style.left = `${x}px`;
      this.tooltipHost.style.top = `${y}px`;
    }

    /**
     * Handle mouse up for dragging
     */
    handleMouseUp() {
      this.dragState.isDragging = false;
    }

    /**
     * Highlight element and show tooltip
     */
    highlightElement(e) {
      this.removeHighlight();
      this.currentElement = e.target;
      e.target.classList.add("css-debugger-hover");

      this.createTooltip(e);
      this.populateTooltip(e.target);
    }

    /**
     * Create tooltip with shadow DOM
     */
    createTooltip(e) {
      // Create tooltip host with shadow DOM
      const host = document.createElement("div");
      host.style.position = "fixed";
      host.style.zIndex = "999999";
      document.body.appendChild(host);

      const shadow = host.attachShadow({ mode: "open" });
      this.tooltipHost = host;

      // Inject styles
      this.injectTooltipStyles(shadow);

      // Create tooltip element
      const tip = document.createElement("div");
      tip.classList.add(
        "css-debugger-tooltip",
        this.isDarkMode ? "dark" : "light"
      );
      tip.style.pointerEvents = "auto";
      tip.style.cursor = "move";

      this.tooltip = tip;
      shadow.appendChild(tip);

      // Make tooltip draggable
      this.makeDraggable(tip, host);

      // Position tooltip
      this.positionTooltip(host, e);
    }

    /**
     * Inject tooltip styles into shadow DOM
     */
    injectTooltipStyles(shadow) {
      const style = document.createElement("style");
      style.textContent = `
        .css-debugger-tooltip {
          position: fixed;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 10px;
          border-radius: 8px;
          z-index: 999999;
          pointer-events: auto;
          cursor: move;
          width: 350px;
          max-width: 350px;
          overflow: auto;
          font-size: 13px;
          font-family: "SF Mono", Monaco, Inconsolata, "Roboto Mono", Consolas, "Courier New", monospace;
          line-height: 1.5;
          white-space: pre-wrap;
          text-shadow: none;
        }
        .css-debugger-tooltip.light {
          background: rgba(255, 255, 255, 0.65);
          color: #1a1b20;
          border: 1px solid rgba(0, 0, 0, 0.1);
        }
        .css-debugger-tooltip.dark {
          background: rgba(36, 38, 43, 0.9);
          color: #e1e1e9;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .box-model {
          display: flex;
          flex-direction: column;
          width: 90%;
          margin: 0 auto;
          padding: 10px;
          font-size: 9px;
          box-sizing: border-box;
        }
        .margin-box {
          position: relative;
          width: 100%;
          padding: 16px 0;
          border: 1px dashed #ccc;
          background-color: rgba(255, 166, 0, 0.2);
          box-sizing: border-box;
        }
        .border-box {
          position: relative;
          width: calc(100% - 32px);
          margin: 0 auto;
          padding: 16px 0;
          border: 1px solid #999;
          background-color: rgba(128, 128, 128, 0.2);
          box-sizing: border-box;
        }
        .padding-box {
          position: relative;
          width: calc(100% - 32px);
          margin: 0 auto;
          padding: 16px 0;
          border: 1px dashed #666;
          background-color: rgba(0, 128, 0, 0.1);
          box-sizing: border-box;
        }
        .content-box {
          position: relative;
          width: calc(100% - 32px);
          margin: 0 auto;
          padding: 8px;
          background-color: rgba(0, 0, 255, 0.1);
          text-align: center;
          white-space: nowrap;
          box-sizing: border-box;
        }
        .scroll-container {
          pointer-events: auto;
          width: 100%;
          max-height: 200px;
          overflow: auto;
          white-space: pre-wrap;
          font-size: 11px;
          z-index: 999999;
        }
      `;
      shadow.appendChild(style);
    }

    /**
     * Position tooltip near mouse cursor
     */
    positionTooltip(host, e) {
      let x = e.clientX + 10;
      let y = e.clientY + 10;

      // Adjust position to keep tooltip on screen
      if (x + 400 > window.innerWidth) {
        x = e.clientX - 310;
      }
      if (y + 300 > window.innerHeight) {
        y = e.clientY - 210;
      }

      host.style.left = `${x}px`;
      host.style.top = `${y}px`;
    }

    /**
     * Make tooltip draggable
     */
    makeDraggable(tip, host) {
      tip.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;

        this.dragState.isDragging = true;
        const rect = host.getBoundingClientRect();
        this.dragState.dragX = e.clientX - rect.left;
        this.dragState.dragY = e.clientY - rect.top;
        e.preventDefault();
      });
    }

    /**
     * Populate tooltip with box model and computed styles
     */
    populateTooltip(element) {
      const cs = getComputedStyle(element);
      const boxModel = this.calculateBoxModel(element, cs);

      const title = this.createElementTitle(element);
      this.tooltip.appendChild(title);

      this.tooltip.appendChild(this.createBoxModelNode(boxModel));

      this.appendComputedStyles(this.tooltip, cs, element, true); // 傳 true 代表已經加過 title
    }

    /**
     * Calculate box model dimensions
     */
    calculateBoxModel(element, cs) {
      const rect = element.getBoundingClientRect();

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
          rect.width -
          border.left -
          border.right -
          padding.left -
          padding.right,
        height:
          rect.height -
          border.top -
          border.bottom -
          padding.top -
          padding.bottom,
      };

      return { margin, border, padding, content };
    }

    /**
     * Create box model visualization node
     */
    createBoxModelNode({ margin, border, padding, content }) {
      const wrapper = document.createElement("div");
      wrapper.className = "box-model";

      const marginBox = this.buildBoxLayer("margin", margin, "margin-box");
      const borderBox = this.buildBoxLayer("border", border, "border-box");
      const paddingBox = this.buildBoxLayer("padding", padding, "padding-box");
      const contentBox = this.buildContentBox(content);

      // Nest the boxes
      paddingBox.appendChild(contentBox);
      borderBox.appendChild(paddingBox);
      marginBox.appendChild(borderBox);
      wrapper.appendChild(marginBox);

      return wrapper;
    }

    /**
     * Build a box model layer (margin, border, padding)
     */
    buildBoxLayer(name, dimensions, className) {
      const layer = document.createElement("div");
      layer.className = className;
      layer.style.position = "relative";

      this.addLabel(layer, name);
      this.addDimensionLabels(layer, dimensions);

      return layer;
    }

    /**
     * Build content box with dimensions
     */
    buildContentBox(content) {
      const contentBox = document.createElement("div");
      contentBox.className = "content-box";
      contentBox.style.position = "relative";

      this.addLabel(contentBox, "content");

      const contentText = document.createElement("div");
      contentText.textContent = `${content.width.toFixed(
        1
      )} × ${content.height.toFixed(1)}`;
      Object.assign(contentText.style, {
        position: "absolute",
        bottom: "2px",
        width: "100%",
        textAlign: "center",
        fontSize: "8px",
        pointerEvents: "none",
        userSelect: "none",
      });
      contentBox.appendChild(contentText);

      return contentBox;
    }

    /**
     * Add label to box model layer
     */
    addLabel(box, text) {
      const label = document.createElement("div");
      label.textContent = text;
      Object.assign(label.style, {
        position: "absolute",
        top: "2px",
        left: "2px",
        fontSize: "8px",
        fontWeight: "bold",
        pointerEvents: "none",
        userSelect: "none",
      });
      box.appendChild(label);
    }

    /**
     * Add dimension labels to box edges
     */
    addDimensionLabels(layer, dimensions) {
      const positions = [
        {
          name: "top",
          style: { top: "2px", width: "100%", textAlign: "center" },
        },
        {
          name: "bottom",
          style: { bottom: "2px", width: "100%", textAlign: "center" },
        },
        {
          name: "left",
          style: { left: "2px", top: "50%", transform: "translateY(-50%)" },
        },
        {
          name: "right",
          style: { right: "2px", top: "50%", transform: "translateY(-50%)" },
        },
      ];

      positions.forEach(({ name, style }) => {
        const edge = document.createElement("div");
        edge.textContent = `${dimensions[name]}`;
        Object.assign(edge.style, {
          position: "absolute",
          fontSize: "8px",
          pointerEvents: "none",
          userSelect: "none",
          ...style,
        });
        layer.appendChild(edge);
      });
    }

    /**
     * Append computed CSS styles to tooltip
     */
    appendComputedStyles(tip, cs, element, skipTitle) {
      if (!skipTitle) {
        const title = this.createElementTitle(element);
        tip.appendChild(title);
      }

      const container = document.createElement("div");
      container.className = "scroll-container";

      const relevantProps = [
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

      relevantProps.forEach((prop) => {
        const value = cs.getPropertyValue(prop);
        if (this.shouldShowProperty(value)) {
          container.appendChild(this.createPropertyLine(prop, value));
        }
      });

      tip.appendChild(container);
    }

    /**
     * Create element title with syntax highlighting
     */
    createElementTitle(element) {
      const title = document.createElement("div");
      const tag = element.tagName.toLowerCase();

      const colors = this.getElementTitleColors();
      const parts = this.buildElementTitleParts(element, tag, colors);

      title.innerHTML = parts.join("");
      title.style.marginBottom = "4px";
      title.style.width = "100%";

      return title;
    }

    /**
     * Get colors for element title based on theme
     */
    getElementTitleColors() {
      const isDark = this.isDarkMode;
      return {
        tag: isDark ? "#a8c7fa" : "#a03166",
        attr: isDark ? "#a8c7fa" : "#a03166",
        class: isDark ? "#fe8d59" : "#0842a0",
      };
    }

    /**
     * Build element title parts with syntax highlighting
     */
    buildElementTitleParts(element, tag, colors) {
      const parts = [`<span style="color:${colors.tag}">&lt;${tag}</span>`];

      if (element.id) {
        parts.push(
          ` <span style="color:${colors.attr}">id</span>="<span style="color:${colors.class}">${element.id}</span>"`
        );
      }

      if (typeof element.className === "string" && element.className.trim()) {
        const filteredClass = element.className
          .split(/\s+/)
          .filter((cls) => cls && cls !== "css-debugger-hover")
          .join(" ");
        if (filteredClass) {
          parts.push(
            ` <span style="color:${colors.attr}">class</span>="<span style="color:${colors.class}">${filteredClass}</span>"`
          );
        }
      }

      parts.push(`<span style="color:${colors.tag}"> /&gt;</span>`);

      return parts;
    }

    /**
     * Check if CSS property should be displayed
     */
    shouldShowProperty(value) {
      return (
        value && value !== "none" && value !== "auto" && value !== "normal"
      );
    }

    /**
     * Create property line element
     */
    createPropertyLine(prop, value) {
      const line = document.createElement("div");
      const nameSpan = document.createElement("span");

      nameSpan.textContent = prop;
      nameSpan.style.color = this.isDarkMode ? "#5cd5fb" : "#a626a4";

      line.appendChild(nameSpan);
      line.appendChild(document.createTextNode(`: ${value};`));

      return line;
    }

    /**
     * Remove highlight and tooltip
     */
    removeHighlight() {
      if (this.currentElement) {
        this.currentElement.classList.remove("css-debugger-hover");
        this.currentElement = null;
      }

      if (this.tooltipHost) {
        this.tooltipHost.remove();
        this.tooltipHost = null;
        this.tooltip = null;
      }
    }
  }

  // Initialize the CSS Debugger
  window.cssDebugger = new CSSDebugger();
})();
