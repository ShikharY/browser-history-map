# Browser History Map Explorer 🗺️

A GitHub Pages application that visualizes your browser history as an interactive map that you can explore. See where your digital journey takes you across the web!

![Browser History Map](https://img.shields.io/badge/Status-Ready%20to%20Deploy-brightgreen)
![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Compatible-blue)
![Privacy First](https://img.shields.io/badge/Privacy-Client%20Side%20Only-green)

## ✨ Features

- **Interactive Map Visualization**: See your browsing history plotted on a world map
- **Privacy-First**: All processing happens in your browser - no data is sent to servers
- **Multiple File Formats**: Supports JSON, CSV, and TXT history exports
- **Smart Filtering**: Filter by time range and search specific domains
- **Activity-Based Coloring**: Sites are colored based on visit frequency
- **Responsive Design**: Works on desktop and mobile devices
- **Demo Mode**: Try it out with sample data before uploading your own

## 🚀 Deployment to GitHub Pages

### Option 1: Direct Upload (Easiest)

1. **Create a new GitHub repository**:
   - Go to GitHub.com and click "New repository"
   - Name it something like `browser-history-map`
   - Make sure it's **public**
   - Initialize with a README

2. **Upload files**:
   - Click "uploading an existing file"
   - Drag and drop all files from this project:
     - `index.html`
     - `styles.css`
     - `script.js`
     - `README.md`
   - Commit the files

3. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Select "Deploy from a branch"
   - Choose "main" branch and "/ (root)"
   - Click Save

4. **Access your site**:
   - Your site will be available at: `https://yourusername.github.io/browser-history-map`
   - It may take a few minutes to deploy

### Option 2: Git Clone and Push

```bash
# Clone this repository or create a new one
git clone https://github.com/yourusername/browser-history-map.git
cd browser-history-map

# Add your files
# Copy index.html, styles.css, script.js, README.md to this directory

# Commit and push
git add .
git commit -m "Initial commit: Browser History Map Explorer"
git push origin main

# Enable GitHub Pages in repository settings
```

## 📊 How to Export Your Browser History

### Chrome
1. **Method 1 - Browser Extensions**:
   - Install "History Export" or similar extension
   - Export as JSON or CSV

2. **Method 2 - Developer Tools**:
   - Open Chrome DevTools (F12)
   - Go to Application → Storage → Web SQL or Local Storage
   - Export history data

3. **Method 3 - Chrome Data**:
   - Navigate to `chrome://settings/`
   - Advanced → Reset and clean up → Clean up computer
   - Use third-party tools like "BrowsingHistoryView"

### Firefox
1. **Library Method**:
   - Press `Ctrl+Shift+H` or go to Library → History
   - Use "Export Bookmarks to HTML" (includes some history)
   - Convert to JSON/CSV format

2. **Profile Folder**:
   - Type `about:support` in address bar
   - Open Profile Folder
   - Use tools to export `places.sqlite`

### Safari
1. **History Menu**:
   - Go to History → Show All History
   - Use third-party export tools
   - Save in JSON or CSV format

### Edge
1. **Settings**:
   - Go to `edge://settings/`
   - Similar process to Chrome
   - Use browser extensions for export

## 🎯 Usage Instructions

1. **Visit your deployed GitHub Pages site**
2. **Try the demo first**: Click "📊 Try with Demo Data" to see how it works
3. **Export your browser history** using the instructions above
4. **Upload your file**: Drag and drop or click to browse
5. **Explore your data**:
   - Zoom and pan around the map
   - Click on markers to see details
   - Use filters to focus on specific time periods or sites
   - Export processed data for further analysis

## 🔒 Privacy & Security

- **100% Client-Side**: All processing happens in your browser
- **No Data Transmission**: Your history never leaves your device
- **No Storage**: Data is not saved or cached anywhere
- **Open Source**: All code is visible and auditable

## 🛠️ Technical Details

### Built With
- **HTML5** - Structure and semantic markup
- **CSS3** - Modern styling with gradients and animations
- **Vanilla JavaScript** - No frameworks, pure JS for maximum compatibility
- **Leaflet.js** - Interactive map library
- **OpenStreetMap** - Map tile provider

### File Structure
```
browser-history-map/
├── index.html          # Main HTML file
├── styles.css          # All styling and responsive design
├── script.js           # JavaScript functionality
└── README.md           # This documentation
```

### Data Format Support
The application can process history data in multiple formats:

**JSON Format:**
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

**CSV Format:**
```csv
url,title,visit_count,last_visit_time
https://example.com,Example Site,5,2024-01-15T10:30:00Z
```

## 🎨 Customization

### Adding More Domain Coordinates
Edit the `domainCoordinates` object in `script.js` to add specific locations for more websites:

```javascript
const domainCoordinates = {
    'yoursite.com': [latitude, longitude],
    // Add more mappings
};
```

### Changing Colors
Modify the `getColorByVisitCount()` function in `script.js`:

```javascript
getColorByVisitCount(visitCount) {
    if (visitCount >= 10) return '#your-color'; // High activity
    if (visitCount >= 5) return '#your-color';  // Medium activity
    return '#your-color'; // Low activity
}
```

### Styling
All visual customization can be done in `styles.css`. The design uses CSS custom properties for easy theming.

## 🐛 Troubleshooting

### Common Issues

1. **File Upload Not Working**:
   - Check file format (JSON, CSV, or TXT only)
   - Ensure file size is under 10MB
   - Try with demo data first

2. **Map Not Loading**:
   - Check browser console for errors
   - Ensure internet connection for map tiles
   - Try refreshing the page

3. **No Markers Appearing**:
   - Verify your data has URL fields
   - Check that domains are being extracted correctly
   - Try with demo data to test functionality

4. **GitHub Pages Not Working**:
   - Ensure repository is public
   - Check that GitHub Pages is enabled in settings
   - Wait 5-10 minutes for deployment
   - Verify all files are in the root directory

## 🤝 Contributing

Feel free to fork this project and submit pull requests for improvements:

- Add support for more browser formats
- Improve domain-to-location mapping
- Add more visualization options
- Enhance mobile responsiveness
- Add data analysis features

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙋‍♂️ Support

If you have questions or need help:

1. Check the troubleshooting section above
2. Open an issue on the GitHub repository
3. Try the demo data first to verify functionality

---

**Made with ❤️ for privacy-conscious web explorers**

Enjoy exploring your digital footprint! 🌍✨
