# CSS Debugger

A Chrome extension for debugging CSS layouts by outlining every element, and showing detailed box-model and computed CSS information on demand.

## Release Notes

**v1.2.0**  

- **Global outline**: when enabled, every element gets a red outline for an instant layout overview.  
- **On-demand details**: hold **Ctrl** (or **⌘** on Mac) and hover to display a draggable tooltip with nested box-model visualization and computed CSS properties.  
- **Escape key**: press **Esc** to close the tooltip immediately.  
- **Dark mode support**: box-model labels and values automatically switch color in light vs. dark system themes.  

## Features

- **Global Red Outline**  
  Click the toolbar icon to toggle a subtle red outline on _all_ elements (`.css-debugger-enabled`), so you can instantly see element boundaries.

- **Ctrl/Cmd + Hover for Details**  
  Hold **Ctrl** (Windows/Linux) or **⌘** (Mac) while hovering over an element to open a tooltip showing:
  - **Nested Box-Model**: margin, border, padding, and content layers, each labeled and sized.  
  - **Computed CSS Panel**: key computed styles (display, size, colors, typography, shadows, etc.) with property names in `#a626a4`.

- **Draggable Tooltip**  
  Click and drag the tooltip anywhere on the page. Cursor changes to "move" when over the tooltip.

- **Escape to Close**  
  Press **Esc** at any time to remove the tooltip (and its highlight).

- **Light & Dark Themes**  
  Tooltip background, text color, and box-model labels automatically adapt to your OS color-scheme.

## Installation

1. Clone or download this repository:

   ```bash
   git clone https://github.com/yourname/css-debugger.git
   ```

2. Open Chrome and go to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the `css-debugger/` folder.
5. The **CSS Debugger** icon appears in your toolbar.

## Usage

1. **Toggle Outline**
   Click the toolbar icon (or use the shortcut **Alt+Shift+C**) to enable or disable the global red outline.

2. **Inspect Details**

   - Hold **Ctrl** (Windows/Linux) or **⌘** (Mac).
   - Hover over any element to highlight it in purple and open the tooltip.
   - Drag the tooltip by its body to reposition it.
   - Press **Esc** to close the tooltip.

3. **Toggle Off**
   Click the toolbar icon again (or press **Alt+Shift+C**) to remove all outlines and close any open tooltip.

## File Structure

```txt
css-debugger/
├── manifest.json        # Extension metadata & permissions
├── content.js           # Core logic: toggling, listeners, tooltip, box-model, drag & Esc handling
├── content.css          # Styling: outlines, tooltip themes, box-model layers
├── popup.html           # Toggle button UI
├── popup.js             # Sends toggle/getStatus messages
└── README.md            # This documentation
```

## Development & Contribution

1. Fork the repo and create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

2. Implement changes and test in Chrome via **Load unpacked**.

3. Submit a Pull Request describing your enhancement.

Contributions welcome for:

- Additional computed CSS properties
- Enhanced animations or performance
- Localization or theming options

## License

Released under the [MIT License](LICENSE). Feel free to use, modify, and distribute.
