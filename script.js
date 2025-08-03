// Browser History Map Visualizer
class BrowserHistoryMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.historyData = [];
        this.filteredData = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFileUpload();
    }

    setupEventListeners() {
        // File upload
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');

        fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            this.processFiles(files);
        });

        // Quick access methods
        document.getElementById('accessChromeHistory').addEventListener('click', () => {
            this.accessBrowserHistory();
        });

        document.getElementById('installExtension').addEventListener('click', () => {
            this.showExtensionInfo();
        });

        document.getElementById('pasteUrls').addEventListener('click', () => {
            this.showUrlPasteArea();
        });

        // URL paste functionality
        document.getElementById('processUrls').addEventListener('click', () => {
            this.processUrlList();
        });

        document.getElementById('cancelPaste').addEventListener('click', () => {
            this.hideUrlPasteArea();
        });

        // Demo data button
        document.getElementById('loadDemoData').addEventListener('click', () => {
            this.loadDemoData();
        });

        // Control buttons
        document.getElementById('resetView').addEventListener('click', () => {
            this.resetMapView();
        });

        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        // Filters
        document.getElementById('timeRange').addEventListener('change', () => {
            this.applyFilters();
        });

        document.getElementById('siteFilter').addEventListener('input', () => {
            this.applyFilters();
        });
    }

    setupFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
    }

    handleFileUpload(event) {
        const files = event.target.files;
        this.processFiles(files);
    }

    async processFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        const fileType = file.name.split('.').pop().toLowerCase();

        try {
            let data;
            const fileContent = await this.readFile(file);

            switch (fileType) {
                case 'json':
                    data = JSON.parse(fileContent);
                    break;
                case 'csv':
                    data = this.parseCSV(fileContent);
                    break;
                case 'txt':
                    data = this.parseTextFile(fileContent);
                    break;
                default:
                    throw new Error('Unsupported file format');
            }

            this.processHistoryData(data);
        } catch (error) {
            alert('Error processing file: ' + error.message);
            console.error('File processing error:', error);
        }
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',');
                const entry = {};
                headers.forEach((header, index) => {
                    entry[header] = values[index]?.trim() || '';
                });
                data.push(entry);
            }
        }

        return data;
    }

    parseTextFile(textContent) {
        // Simple text parsing - assumes each line is a URL with optional timestamp
        const lines = textContent.split('\n');
        const data = [];

        lines.forEach((line, index) => {
            if (line.trim()) {
                const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
                if (urlMatch) {
                    data.push({
                        url: urlMatch[1],
                        title: this.extractDomainFromUrl(urlMatch[1]),
                        visit_count: 1,
                        last_visit_time: new Date().toISOString()
                    });
                }
            }
        });

        return data;
    }

    extractDomainFromUrl(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    }

    processHistoryData(rawData) {
        // Normalize the data structure
        this.historyData = rawData.map(item => {
            const url = item.url || item.URL || item.link || '';
            const domain = this.extractDomainFromUrl(url);
            
            return {
                url: url,
                title: item.title || item.Title || domain,
                domain: domain,
                visitCount: parseInt(item.visit_count || item.visitCount || item.visits || 1),
                lastVisit: item.last_visit_time || item.lastVisit || item.timestamp || new Date().toISOString(),
                coordinates: this.getCoordinatesForDomain(domain)
            };
        });

        // Filter out invalid entries
        this.historyData = this.historyData.filter(item => 
            item.url && item.domain && item.coordinates
        );

        // Group by domain and aggregate data
        this.historyData = this.aggregateByDomain(this.historyData);

        this.filteredData = [...this.historyData];
        this.showMap();
        this.updateStats();
    }

    aggregateByDomain(data) {
        const domainMap = new Map();

        data.forEach(item => {
            if (domainMap.has(item.domain)) {
                const existing = domainMap.get(item.domain);
                existing.visitCount += item.visitCount;
                existing.urls.push(item.url);
                if (new Date(item.lastVisit) > new Date(existing.lastVisit)) {
                    existing.lastVisit = item.lastVisit;
                }
            } else {
                domainMap.set(item.domain, {
                    ...item,
                    urls: [item.url]
                });
            }
        });

        return Array.from(domainMap.values());
    }

    getCoordinatesForDomain(domain) {
        // This is a simplified mapping - in a real application, you'd use a more comprehensive database
        const domainCoordinates = {
            'google.com': [37.4419, -122.1430],
            'youtube.com': [37.4419, -122.1430],
            'facebook.com': [37.4845, -122.1478],
            'twitter.com': [37.7749, -122.4194],
            'instagram.com': [37.4845, -122.1478],
            'linkedin.com': [37.4419, -122.1430],
            'github.com': [37.7749, -122.4194],
            'stackoverflow.com': [40.7589, -73.9851],
            'reddit.com': [37.7749, -122.4194],
            'wikipedia.org': [37.7749, -122.4194],
            'amazon.com': [47.6062, -122.3321],
            'netflix.com': [37.2431, -121.7958],
            'spotify.com': [59.3293, 18.0686],
            'microsoft.com': [47.6395, -122.1300],
            'apple.com': [37.3318, -122.0312],
            'yahoo.com': [37.4419, -122.1430],
            'bing.com': [47.6395, -122.1300],
            'twitch.tv': [37.7749, -122.4194],
            'discord.com': [37.7749, -122.4194],
            'medium.com': [37.7749, -122.4194],
            'dribbble.com': [40.7589, -73.9851],
            'behance.net': [37.7749, -122.4194]
        };

        // Check for exact match first
        if (domainCoordinates[domain]) {
            return domainCoordinates[domain];
        }

        // Check for partial matches (e.g., subdomain)
        for (const [key, coords] of Object.entries(domainCoordinates)) {
            if (domain.includes(key) || key.includes(domain)) {
                return coords;
            }
        }

        // Generate pseudo-random coordinates based on domain hash
        const hash = this.hashCode(domain);
        const lat = 40 + (hash % 40) - 20; // Latitude between 20-60
        const lng = -120 + (hash % 240) - 120; // Longitude between -240 to 120
        
        return [lat, lng];
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    showMap() {
        // Show map container and controls
        document.getElementById('controlsSection').style.display = 'block';
        document.getElementById('mapContainer').style.display = 'block';
        document.getElementById('instructions').style.display = 'none';

        // Initialize map if not already done
        if (!this.map) {
            this.map = L.map('map').setView([40.7589, -73.9851], 2);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
        }

        this.updateMarkers();
    }

    updateMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Add new markers
        this.filteredData.forEach(item => {
            const [lat, lng] = item.coordinates;
            const color = this.getColorByVisitCount(item.visitCount);
            const size = Math.min(Math.max(item.visitCount * 2, 8), 30);

            const marker = L.circleMarker([lat, lng], {
                radius: size,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.map);

            // Create popup content
            const popupContent = `
                <div class="popup-content">
                    <h4>${item.domain}</h4>
                    <p><strong>Visits:</strong> <span class="popup-visits">${item.visitCount}</span></p>
                    <p><strong>Last Visit:</strong> ${new Date(item.lastVisit).toLocaleDateString()}</p>
                    <p><strong>URLs:</strong> ${item.urls.length}</p>
                </div>
            `;

            marker.bindPopup(popupContent);
            this.markers.push(marker);
        });

        // Fit map to show all markers
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    getColorByVisitCount(visitCount) {
        if (visitCount >= 10) return '#ff6b6b'; // High activity - Red
        if (visitCount >= 5) return '#4ecdc4';  // Medium activity - Teal
        return '#45b7d1'; // Low activity - Blue
    }

    applyFilters() {
        const timeRange = document.getElementById('timeRange').value;
        const siteFilter = document.getElementById('siteFilter').value.toLowerCase();

        this.filteredData = this.historyData.filter(item => {
            // Time filter
            if (timeRange !== 'all') {
                const days = parseInt(timeRange);
                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - days);
                
                if (new Date(item.lastVisit) < cutoffDate) {
                    return false;
                }
            }

            // Site filter
            if (siteFilter && !item.domain.toLowerCase().includes(siteFilter)) {
                return false;
            }

            return true;
        });

        this.updateMarkers();
        this.updateStats();
    }

    updateStats() {
        const totalSites = this.filteredData.length;
        const totalVisits = this.filteredData.reduce((sum, item) => sum + item.visitCount, 0);
        
        // Calculate time span
        const dates = this.filteredData.map(item => new Date(item.lastVisit));
        const earliestDate = new Date(Math.min(...dates));
        const latestDate = new Date(Math.max(...dates));
        const timeSpan = Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24));

        document.getElementById('totalSites').textContent = `${totalSites} sites`;
        document.getElementById('totalVisits').textContent = `${totalVisits} visits`;
        document.getElementById('timeSpan').textContent = `${timeSpan} days`;
    }

    resetMapView() {
        if (this.map && this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    exportData() {
        const exportData = {
            summary: {
                totalSites: this.filteredData.length,
                totalVisits: this.filteredData.reduce((sum, item) => sum + item.visitCount, 0),
                exportDate: new Date().toISOString()
            },
            data: this.filteredData
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'browser-history-map-export.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    loadDemoData() {
        const demoData = [
            {
                url: 'https://google.com',
                title: 'Google',
                visit_count: 25,
                last_visit_time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
            },
            {
                url: 'https://youtube.com',
                title: 'YouTube',
                visit_count: 18,
                last_visit_time: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
            },
            {
                url: 'https://github.com',
                title: 'GitHub',
                visit_count: 15,
                last_visit_time: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString()
            },
            {
                url: 'https://stackoverflow.com',
                title: 'Stack Overflow',
                visit_count: 12,
                last_visit_time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
            },
            {
                url: 'https://reddit.com',
                title: 'Reddit',
                visit_count: 8,
                last_visit_time: new Date(Date.now() - 1000 * 60 * 30).toISOString()
            },
            {
                url: 'https://twitter.com',
                title: 'Twitter',
                visit_count: 7,
                last_visit_time: new Date().toISOString()
            },
            {
                url: 'https://linkedin.com',
                title: 'LinkedIn',
                visit_count: 5,
                last_visit_time: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
            },
            {
                url: 'https://wikipedia.org',
                title: 'Wikipedia',
                visit_count: 10,
                last_visit_time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
            },
            {
                url: 'https://amazon.com',
                title: 'Amazon',
                visit_count: 6,
                last_visit_time: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString()
            },
            {
                url: 'https://netflix.com',
                title: 'Netflix',
                visit_count: 4,
                last_visit_time: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
            }
        ];

        this.processHistoryData(demoData);
    }

    // New seamless access methods
    async accessBrowserHistory() {
        try {
            // Check if the History API is available (Chrome extension context)
            if ('chrome' in window && chrome.history) {
                await this.accessChromeHistory();
            } else {
                // Fallback to Web History API (limited but available)
                await this.accessWebHistory();
            }
        } catch (error) {
            console.error('Browser history access failed:', error);
            this.showHistoryAccessFallback();
        }
    }

    async accessChromeHistory() {
        // This would work in a Chrome extension context
        const button = document.getElementById('accessChromeHistory');
        button.textContent = 'Requesting Permission...';
        button.disabled = true;

        try {
            // Request history permission
            const results = await new Promise((resolve, reject) => {
                chrome.history.search({
                    text: '',
                    maxResults: 1000,
                    startTime: Date.now() - (30 * 24 * 60 * 60 * 1000) // Last 30 days
                }, resolve);
            });

            const historyData = results.map(item => ({
                url: item.url,
                title: item.title,
                visit_count: item.visitCount || 1,
                last_visit_time: new Date(item.lastVisitTime).toISOString()
            }));

            this.processHistoryData(historyData);
        } catch (error) {
            throw new Error('Chrome History API not available');
        } finally {
            button.textContent = 'Access History';
            button.disabled = false;
        }
    }

    async accessWebHistory() {
        // Limited web-based history access
        const button = document.getElementById('accessChromeHistory');
        button.textContent = 'Analyzing Recent Activity...';
        button.disabled = true;

        try {
            // Use document.referrer and navigation API for limited history
            const recentUrls = [];
            
            // Get current URL
            if (window.location.href !== 'about:blank') {
                recentUrls.push({
                    url: window.location.href,
                    title: document.title,
                    visit_count: 1,
                    last_visit_time: new Date().toISOString()
                });
            }

            // Check if navigation API is available (newer browsers)
            if ('navigation' in window) {
                const entries = navigation.entries();
                entries.forEach(entry => {
                    if (entry.url && entry.url !== window.location.href) {
                        recentUrls.push({
                            url: entry.url,
                            title: entry.url,
                            visit_count: 1,
                            last_visit_time: new Date().toISOString()
                        });
                    }
                });
            }

            if (recentUrls.length === 0) {
                throw new Error('No accessible history data');
            }

            this.processHistoryData(recentUrls);
        } catch (error) {
            throw new Error('Limited browser history access');
        } finally {
            button.textContent = 'Access History';
            button.disabled = false;
        }
    }

    showHistoryAccessFallback() {
        alert(`
Browser History Access Limited

Due to browser security restrictions, direct history access is limited. Please try:

1. 📋 Use the "Paste URLs" option below
2. 🔗 Install our browser extension (coming soon)
3. 📄 Export history manually and upload the file
4. 🎯 Try the demo data to see how it works

Modern browsers protect your privacy by limiting direct history access.
        `.trim());
    }

    showExtensionInfo() {
        const modal = document.createElement('div');
        modal.className = 'extension-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔗 Browser Extension (Coming Soon)</h3>
                    <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="modal-body">
                    <p>We're developing browser extensions that will provide seamless, one-click access to your browsing history:</p>
                    
                    <div class="extension-features">
                        <div class="feature">
                            <span class="feature-icon">⚡</span>
                            <strong>One-click export</strong> - No manual steps required
                        </div>
                        <div class="feature">
                            <span class="feature-icon">🔒</span>
                            <strong>Privacy-first</strong> - Data never leaves your device
                        </div>
                        <div class="feature">
                            <span class="feature-icon">🔄</span>
                            <strong>Real-time sync</strong> - Always up-to-date visualization
                        </div>
                        <div class="feature">
                            <span class="feature-icon">🎯</span>
                            <strong>Smart filtering</strong> - Automatic categorization
                        </div>
                    </div>

                    <div class="extension-status">
                        <h4>Development Status:</h4>
                        <div class="status-item">✅ Chrome Extension - In Development</div>
                        <div class="status-item">🔄 Firefox Add-on - Planned</div>
                        <div class="status-item">🔄 Edge Extension - Planned</div>
                    </div>

                    <p><strong>In the meantime:</strong> Use the "Paste URLs" option for quick access!</p>
                </div>
                <div class="modal-footer">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="demo-btn">Got it!</button>
                </div>
            </div>
        `;

        // Add modal styles
        const style = document.createElement('style');
        style.textContent = `
            .extension-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            .modal-content {
                background: white;
                border-radius: 15px;
                max-width: 500px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
            }
            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 20px 25px;
                border-bottom: 1px solid #eee;
            }
            .modal-header h3 {
                margin: 0;
                color: #333;
            }
            .close-modal {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #999;
            }
            .modal-body {
                padding: 25px;
            }
            .extension-features {
                margin: 20px 0;
            }
            .feature {
                display: flex;
                align-items: center;
                margin-bottom: 12px;
                padding: 10px;
                background: #f8f9ff;
                border-radius: 8px;
            }
            .feature-icon {
                margin-right: 12px;
                font-size: 1.2rem;
            }
            .extension-status {
                background: #f0f8ff;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .extension-status h4 {
                margin-bottom: 10px;
                color: #333;
            }
            .status-item {
                margin-bottom: 5px;
                font-size: 0.9rem;
            }
            .modal-footer {
                padding: 20px 25px;
                border-top: 1px solid #eee;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal);
    }

    showUrlPasteArea() {
        document.getElementById('urlPasteSection').style.display = 'block';
        document.getElementById('urlTextarea').focus();
    }

    hideUrlPasteArea() {
        document.getElementById('urlPasteSection').style.display = 'none';
        document.getElementById('urlTextarea').value = '';
    }

    processUrlList() {
        const textarea = document.getElementById('urlTextarea');
        const urlText = textarea.value.trim();
        
        if (!urlText) {
            alert('Please paste some URLs first!');
            return;
        }

        const urls = urlText.split('\n')
            .map(line => line.trim())
            .filter(line => line && (line.startsWith('http') || line.includes('.')));

        if (urls.length === 0) {
            alert('No valid URLs found. Please make sure each URL is on a separate line.');
            return;
        }

        // Convert URLs to history data format
        const historyData = urls.map((url, index) => {
            const domain = this.extractDomainFromUrl(url);
            return {
                url: url,
                title: domain,
                visit_count: 1,
                last_visit_time: new Date(Date.now() - (index * 60000)).toISOString() // Stagger times
            };
        });

        this.processHistoryData(historyData);
        this.hideUrlPasteArea();

        // Show success message
        alert(`Successfully processed ${urls.length} URLs! 🎉`);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BrowserHistoryMap();
});

// Add some utility functions for enhanced functionality
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Enhanced file validation
function validateFileSize(file, maxSizeMB = 10) {
    const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    return file.size <= maxSize;
}

function validateFileType(file, allowedTypes = ['json', 'csv', 'txt']) {
    const fileType = file.name.split('.').pop().toLowerCase();
    return allowedTypes.includes(fileType);
}
