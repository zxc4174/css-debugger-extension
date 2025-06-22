# CSS Debugger

A Chrome extension for debugging CSS layouts by highlighting elements and displaying their box model and computed CSS properties on hover.

## Features

- **Real-time Highlighting**  
  Hover over any element to outline it with a purple border.
- **Visual Box Model**  
  Nested display of margin, border, padding, and content layers, each labeled and showing numeric values.
- **Computed CSS Panel**  
  Shows common computed CSS properties in a scrollable panel. Property names are colored `#a626a4`, values retain default color.
- **Light & Dark Themes**  
  Automatically detects system color scheme and switches tooltip styling.

## Installation

1. Clone or download this repository:

   ```bash
   git clone https://github.com/yourname/css-debugger.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top-right corner.
4. Click **Load unpacked** and select the project's root folder.
5. The **CSS Debugger** icon will appear in your toolbar.

## Usage

1. Click the CSS Debugger icon in the toolbar to toggle debugging mode.
2. Hover over page elements:

   - A purple outline appears around the element.
   - A tooltip shows up with the box model and computed CSS properties.
3. Click the toolbar icon again to disable debugging and remove all outlines/tooltips.

## File Structure

```hash
css-debugger/
├── manifest.json       # Chrome extension metadata and content script registration
├── content.js          # Main logic: mouse listeners, tooltip creation, box model & CSS panel
├── content.css         # Tooltip and box-model styling definitions
├── popup.html          # Simple UI for toggling debug mode
├── popup.js            # Sends toggle/getStatus messages to content script
└── README.md           # Project documentation
```

## Development & Contribution

1. Fork the repository and create a feature branch:

   ```bash
   git checkout -b feature/your-feature
   ```

2. Implement your changes and add tests if applicable.

Contributions are welcome for:

- Supporting additional computed CSS properties
- Improving tooltip animations and performance
- Adding theming or localization options

## License

This project is released under the [MIT License](LICENSE). Feel free to use, modify, and distribute.
