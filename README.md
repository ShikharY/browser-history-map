# Browser History Map Explorer 🗺️

A comprehensive browser history visualization tool that transforms your browsing data into an interactive world map. Features both a browser extension and manual upload methods for maximum flexibility and privacy.

![Browser History Map](https://img.shields.io/badge/Status-Ready%20to%20Deploy-brightgreen)
![Privacy First](https://img.shields.io/badge/Privacy-Client%20Side%20Only-green)
![Extension Support](https://img.shields.io/badge/Extension-Supported-blue)

## ✨ Features

- **🔗 Browser Extension**: One-click export with full privacy protection
- **📋 Smart Manual Methods**: Intelligent URL detection and clipboard integration
- **🗺️ Interactive Map Visualization**: See your browsing history plotted on a world map
- **🔒 Privacy-First**: All processing happens in your browser - no data is sent to servers
- **📊 Multiple File Formats**: Supports JSON, CSV, and TXT history exports
- **🎯 Smart Filtering**: Filter by time range and search specific domains
- **🌈 Activity-Based Coloring**: Sites are colored based on visit frequency
- **📱 Responsive Design**: Works perfectly on desktop and mobile devices
- **🚀 Real-time Integration**: Extension data automatically loads in the web app

## 🚀 Quick Start

### Option 1: Browser Extension (Recommended)

1. **Download the Extension**:
   ```bash
   git clone https://github.com/ShikharY/browser-history-map.git
   # Or download ZIP from GitHub
   ```

2. **Install in Chrome/Edge**:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `browser-extension` folder
   - Click the extension icon in your toolbar

3. **Export Your Data**:
   - Click the extension icon
   - Choose your time range (7 days to all time)
   - Click "Send to Web App" for instant visualization
   - Or "Export to File" to save for later

### Option 2: Manual Methods

1. **Visit the Web App**: [https://shikhary.github.io/browser-history-map](https://shikhary.github.io/browser-history-map)

2. **Use Smart Copy-Paste**:
   - Open a new tab in your browser
   - Copy URLs from "Most visited" or "Top sites"
   - Click "Smart Paste" in the web app
   - Use clipboard auto-detection for instant URL discovery

3. **Traditional Export**:
   - Export your browser history as JSON/CSV
   - Drag and drop the file into the web app
   - Supported formats: JSON, CSV, TXT

## 🔗 Browser Extension

### Features
- ⚡ **One-click export** - No manual steps required
- 🔒 **Privacy-first** - Data never leaves your device
- 🎯 **Smart filtering** - Choose date ranges and exclude sensitive data
- 🚀 **Direct integration** - Automatically opens visualization in web app
- 📊 **Multiple formats** - Export as JSON or send directly to web app

### Installation Steps
1. Download the repository
2. Navigate to `chrome://extensions/` (Chrome) or `edge://extensions/` (Edge)
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `browser-extension` folder
5. The extension icon will appear in your toolbar

### Using the Extension
1. Click the extension icon
2. Select your desired time range:
   - Last 7 days
   - Last 30 days
   - Last 3 months
   - Last year
   - All time
3. Choose export method:
   - **Send to Web App**: Instantly visualize in the browser
   - **Export to File**: Download JSON file for later use

## 📊 Manual Data Export Methods

### Chrome
1. **Quick Method**: 
   - Press `Ctrl+T` (new tab)
   - Copy URLs from "Most visited" section
   - Use Smart Paste in the web app

2. **Full Export**:
   - Press `Ctrl+H` to open history
   - Right-click entries and "Copy link address"
   - Or use Google Takeout for complete data

### Firefox
1. **Quick Method**:
   - Press `Ctrl+T` (new tab)
   - Copy URLs from "Top Sites"

2. **Full Export**:
   - Press `Ctrl+Shift+H` for Library view
   - Export bookmarks as HTML
   - Extract URLs from the HTML file

### Safari
1. **Quick Method**:
   - Open new tab
   - Copy URLs from "Frequently Visited"

2. **Full Export**:
   - Go to History → Show All History
   - Right-click entries to copy URLs
   - Export Reading List and bookmarks

### Edge
1. **Quick Method**:
   - Press `Ctrl+T` (new tab)
   - Copy URLs from "Top sites"

2. **Full Export**:
   - Press `Ctrl+H` for history
   - Export Collections as Excel
   - Use bookmark export features

## 🛠️ Technical Details

### Built With
- **HTML5** - Structure and semantic markup
- **CSS3** - Modern styling with gradients and animations
- **Vanilla JavaScript** - No frameworks, pure JS for maximum compatibility
- **Leaflet.js** - Interactive map library
- **OpenStreetMap** - Map tile provider
- **Chrome Extensions API** - For browser extension functionality

### File Structure
```
browser-history-map/
├── index.html              # Main web application
├── styles.css              # Enhanced styling
├── script.js               # Core application logic
├── README.md               # This documentation
├── example-data.json       # Sample data for testing
└── browser-extension/      # Browser extension
    ├── manifest.json       # Extension configuration
    ├── background.js       # Extension background script
    ├── popup.html          # Extension popup interface
    ├── popup.js           # Extension popup logic
    ├── content.js         # Content script for web app integration
    └── icons/             # Extension icons
```

### Data Format Support

**JSON Format (Recommended):**
```json
[
  {
    "url": "https://example.com",
    "title": "Example Site",
    "visit_count": 5,
    "last_visit_time": "2024-01-15T10:30:00Z"
  }
]
```

**Extension Export Format:**
```json
{
  "summary": {
    "totalEntries": 150,
    "timeRange": "90",
    "exportDate": "2024-01-15T10:30:00Z",
    "generatedBy": "Browser History Map Exporter v1.0.0"
  },
  "data": [...]
}
```

**CSV Format:**
```csv
url,title,visit_count,last_visit_time
https://example.com,Example Site,5,2024-01-15T10:30:00Z
```

**TXT Format:**
```
https://example.com
https://another-site.com
https://third-site.org
```

## 🎯 Usage Instructions

1. **Choose Your Method**:
   - Browser Extension (recommended)
   - Smart Copy-Paste
   - File Upload

2. **Export Your Data**:
   - Follow browser-specific instructions
   - Or use the extension for one-click export

3. **Visualize**:
   - Data automatically loads in the web app
   - Explore the interactive map
   - Use filters to focus on specific time periods or sites
   - Click markers for detailed information

4. **Analyze**:
   - View statistics (total sites, visits, time span)
   - Filter by time range
   - Search for specific domains
   - Export processed data for further analysis

## 🔒 Privacy & Security

- **100% Client-Side**: All processing happens in your browser
- **No Data Transmission**: Your history never leaves your device
- **No Storage**: Data is not saved or cached on our servers
- **Open Source**: All code is visible and auditable
- **Extension Permissions**: Only requests necessary history access
- **Secure Processing**: Data is processed locally and discarded after visualization

## 🎨 Customization

### Adding More Domain Coordinates
Edit the `domainCoordinates` object in `script.js`:

```javascript
const domainCoordinates = {
    'yoursite.com': [latitude, longitude],
    // Add more mappings
};
```

### Changing Colors
Modify the `getColorByVisitCount()` function:

```javascript
getColorByVisitCount(visitCount) {
    if (visitCount >= 20) return '#your-color'; // Very high activity
    if (visitCount >= 10) return '#your-color'; // High activity
    if (visitCount >= 5) return '#your-color';  // Medium activity
    return '#your-color'; // Low activity
}
```

### Extension Customization
- Modify `manifest.json` for different permissions
- Update `popup.html` for custom UI
- Edit `background.js` for additional functionality

## 🐛 Troubleshooting

### Common Issues

1. **Extension Not Loading**:
   - Ensure Developer mode is enabled
   - Check for manifest.json errors in console
   - Verify all files are in the correct directory

2. **File Upload Not Working**:
   - Check file format (JSON, CSV, or TXT only)
   - Ensure file size is under 10MB
   - Try with demo data first

3. **Map Not Loading**:
   - Check browser console for errors
   - Ensure internet connection for map tiles
   - Try refreshing the page

4. **No Markers Appearing**:
   - Verify your data has URL fields
   - Check that domains are being extracted correctly
   - Try with demo data to test functionality

5. **Extension Data Not Importing**:
   - Ensure the web app is loaded
   - Check browser console for errors
   - Try manual file export instead

### Browser-Specific Issues

**Chrome/Edge**:
- Extension requires Developer mode
- Some corporate networks may block extension installation

**Firefox**:
- Different extension format required (future update)
- Use manual methods for now

**Safari**:
- Extension not yet available
- Use manual export methods

## 🚀 Deployment

### GitHub Pages (Recommended)

1. **Fork this repository**
2. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)"
3. **Access your site**: `https://yourusername.github.io/browser-history-map`

### Local Development

```bash
# Clone the repository
git clone https://github.com/ShikharY/browser-history-map.git
cd browser-history-map

# Serve locally (Python)
python -m http.server 8000

# Or use Node.js
npx http-server

# Access at http://localhost:8000
```

## 🤝 Contributing

We welcome contributions! Here are some ways you can help:

- **Add browser support**: Help create Firefox, Safari extensions
- **Improve domain mapping**: Add more accurate coordinates for popular sites
- **Enhance visualization**: Add new chart types or map features
- **Bug fixes**: Report and fix issues
- **Documentation**: Improve guides and instructions

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly (especially the extension)
5. Submit a pull request

### Extension Development

- Test in Chrome and Edge
- Follow Chrome Extension best practices
- Ensure privacy compliance
- Test with various data sizes

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙋‍♂️ Support

If you need help:

1. **Check the troubleshooting section** above
2. **Try the demo data** first to verify functionality
3. **Open an issue** on GitHub with:
   - Browser version
   - Error messages
   - Steps to reproduce
4. **Check browser console** for error messages

## 🔮 Future Features

- **Firefox Extension**: Native Firefox add-on
- **Safari Extension**: Safari app store extension
- **Mobile Apps**: Native iOS/Android apps
- **Advanced Analytics**: More detailed browsing insights
- **Export Options**: PDF reports, more visualization types
- **Cloud Sync**: Optional encrypted cloud storage
- **Team Features**: Collaborative browsing insights

## 📈 Stats

- **0 Data Breaches**: Your data never leaves your device
- **100% Open Source**: Full transparency
- **Multi-Browser Support**: Works with all major browsers
- **Real-time Processing**: Instant visualization
- **Privacy-Focused**: Built with privacy as the foundation

---

**Made with ❤️ for privacy-conscious web explorers**

Enjoy exploring your digital footprint! 🌍✨

For more information, visit: [https://shikhary.github.io/browser-history-map](https://shikhary.github.io/browser-history-map)