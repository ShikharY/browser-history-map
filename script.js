// Enhanced Browser History Map Visualizer with Extension Integration
class BrowserHistoryMap {
    constructor() {
        this.map = null;
        this.markers = [];
        this.historyData = [];
        this.filteredData = [];
        this.extensionConnected = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFileUpload();
        this.checkForExtensionData();
        this.setupExtensionIntegration();
        this.setupAdvancedFeatures();
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
            console.log('Show Guide button clicked');
            this.accessBrowserHistory();
        });

        document.getElementById('installExtension').addEventListener('click', () => {
            this.showExtensionInfo();
        });

        // URL paste functionality
        document.getElementById('pasteUrls').addEventListener('click', () => {
            this.showUrlPasteArea();
        });

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
                    // Handle both raw array and extension export format
                    if (data.data && Array.isArray(data.data)) {
                        data = data.data; // Extension format
                    }
                    break;
                case 'csv':
                    data = this.parseCSV(fileContent);
                    break;
                case 'txt':
                    data = this.parseTextFile(fileContent);
                    break;
                default:
                    throw new Error('Unsupported file format. Please use JSON, CSV, or TXT files.');
            }

            this.processHistoryData(data);
            this.showSuccessNotification(`Successfully processed ${data.length} entries from ${file.name}`);
        } catch (error) {
            this.showErrorNotification('Error processing file: ' + error.message);
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
        const lines = textContent.split('\n');
        const data = [];

        lines.forEach((line) => {
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
        // Enhanced domain coordinate mapping
        const domainCoordinates = {
            'google.com': [37.7749, -122.4194], // San Francisco
            'youtube.com': [37.7749, -122.4194],
            'facebook.com': [37.4849, -122.1477], // Menlo Park
            'twitter.com': [37.7749, -122.4194],
            'instagram.com': [37.4849, -122.1477],
            'linkedin.com': [37.4440, -122.1430], // Mountain View
            'github.com': [37.7749, -122.4194],
            'stackoverflow.com': [40.7128, -74.0060], // New York
            'reddit.com': [37.7749, -122.4194],
            'wikipedia.org': [37.7749, -122.4194],
            'amazon.com': [47.6062, -122.3321], // Seattle
            'netflix.com': [37.2431, -121.7914], // Los Gatos
            'apple.com': [37.3318, -122.0312], // Cupertino
            'microsoft.com': [47.6444, -122.1300], // Redmond
            'zoom.us': [37.3861, -122.0839], // San Jose
            'slack.com': [37.7749, -122.4194],
            'discord.com': [37.7749, -122.4194],
            'twitch.tv': [37.7749, -122.4194],
            'tiktok.com': [34.0522, -118.2437], // Los Angeles
            'spotify.com': [59.3293, 18.0686], // Stockholm
            'dropbox.com': [37.7749, -122.4194],
            'adobe.com': [37.3382, -121.8863], // San Jose
            'salesforce.com': [37.7749, -122.4194],
            'oracle.com': [37.5407, -122.0057], // Redwood City
            'cnn.com': [33.7490, -84.3880], // Atlanta
            'bbc.com': [51.5074, -0.1278], // London
            'nytimes.com': [40.7128, -74.0060], // New York
            'medium.com': [37.7749, -122.4194],
            'quora.com': [37.4440, -122.1430],
            'pinterest.com': [37.7749, -122.4194],
            'etsy.com': [40.6892, -74.0445], // Brooklyn
            'ebay.com': [37.4041, -121.9618], // San Jose
            'paypal.com': [37.4041, -121.9618],
            'stripe.com': [37.7749, -122.4194],
            'shopify.com': [45.4215, -75.6972], // Ottawa
            'mailchimp.com': [33.7490, -84.3880], // Atlanta
            'hubspot.com': [42.3584, -71.0598], // Boston
            'trello.com': [40.7128, -74.0060],
            'asana.com': [37.7749, -122.4194],
            'notion.so': [37.7749, -122.4194],
            'figma.com': [37.7749, -122.4194],
            'canva.com': [-33.8688, 151.2093], // Sydney
            'unsplash.com': [49.2827, -123.1207] // Vancouver
        };

        if (domainCoordinates[domain]) {
            return domainCoordinates[domain];
        }

        // Generate pseudo-random coordinates based on domain
        const hash = this.hashCode(domain);
        const lat = (hash % 180) - 90;
        const lng = ((hash * 1.618) % 360) - 180;
        return [lat, lng];
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    showMap() {
        if (!this.map) {
            this.map = L.map('map').setView([20, 0], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
        }

        this.updateMarkers();
        document.getElementById('mapContainer').style.display = 'block';
        document.getElementById('controlsSection').style.display = 'block';
    }

    updateMarkers() {
        // Clear existing markers
        this.markers.forEach(marker => this.map.removeLayer(marker));
        this.markers = [];

        // Add new markers
        this.filteredData.forEach(item => {
            const marker = L.circleMarker(item.coordinates, {
                radius: Math.min(20, Math.max(5, item.visitCount)),
                fillColor: this.getColorByVisitCount(item.visitCount),
                color: '#fff',
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.7
            }).addTo(this.map);

            marker.bindPopup(`
                <strong>${item.title}</strong><br>
                <em>${item.domain}</em><br>
                Visits: ${item.visitCount}<br>
                Last visit: ${new Date(item.lastVisit).toLocaleDateString()}<br>
                <small>${item.urls.length > 1 ? `+${item.urls.length - 1} more URLs` : ''}</small>
            `);

            this.markers.push(marker);
        });

        // Fit map to markers if any exist
        if (this.markers.length > 0) {
            const group = new L.featureGroup(this.markers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    getColorByVisitCount(visitCount) {
        if (visitCount >= 20) return '#d73027'; // Red
        if (visitCount >= 10) return '#ff6b6b'; // Light red
        if (visitCount >= 5) return '#4ecdc4'; // Teal
        return '#45b7d1'; // Blue
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
                exportDate: new Date().toISOString(),
                generatedBy: 'Browser History Map Explorer'
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
                last_visit_time: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
            }
        ];

        this.processHistoryData(demoData);
        this.showSuccessNotification('Demo data loaded! Explore the interactive map below.');
    }

    // Extension Integration Methods
    checkForExtensionData() {
        // Check if extension has provided data
        const extensionData = localStorage.getItem('extensionHistoryData');
        if (extensionData) {
            try {
                const data = JSON.parse(extensionData);
                this.showExtensionDataDialog(data);
                localStorage.removeItem('extensionHistoryData');
            } catch (error) {
                console.error('Error parsing extension data:', error);
            }
        }
    }

    setupExtensionIntegration() {
        // Add extension detection
        this.detectExtension();
        
        // Add extension-specific UI elements
        this.addExtensionButtons();
    }

    detectExtension() {
        // Simple extension detection
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
            this.extensionConnected = true;
            this.showExtensionConnectedNotification();
        }
    }

    addExtensionButtons() {
        // Add "Load from Extension" button
        const extensionBtn = document.createElement('button');
        extensionBtn.id = 'loadFromExtension';
        extensionBtn.className = 'demo-btn';
        extensionBtn.innerHTML = '🔗 Load from Extension';
        extensionBtn.addEventListener('click', () => this.requestExtensionData());
        
        const demoSection = document.querySelector('.demo-section');
        if (demoSection) {
            demoSection.appendChild(extensionBtn);
        }
    }

    requestExtensionData() {
        if (!this.extensionConnected) {
            this.showExtensionInfo();
            return;
        }

        // Request data from extension
        chrome.runtime.sendMessage({action: 'getHistoryData'}, (response) => {
            if (response && response.data) {
                this.processHistoryData(response.data.data || response.data);
                this.showSuccessNotification('Data loaded from extension!');
            } else {
                this.showErrorNotification('No data available from extension. Please export data first.');
            }
        });
    }

    showExtensionDataDialog(data) {
        const dialog = document.createElement('div');
        dialog.className = 'extension-data-dialog';
        dialog.innerHTML = `
            <div class="dialog-content">
                <h3>🔗 Extension Data Available</h3>
                <p>Your browser extension has prepared ${data.data ? data.data.length : 'some'} history entries.</p>
                <div class="dialog-buttons">
                    <button onclick="browserHistoryMap.importExtensionData(${JSON.stringify(data).replace(/"/g, '&quot;')}); this.parentElement.parentElement.parentElement.remove();" class="btn-primary">Import Data</button>
                    <button onclick="this.parentElement.parentElement.parentElement.remove();" class="btn-secondary">Cancel</button>
                </div>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .extension-data-dialog {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 10000;
            }
            .dialog-content {
                background: white;
                padding: 30px;
                border-radius: 15px;
                max-width: 400px;
                text-align: center;
            }
            .dialog-buttons {
                margin-top: 20px;
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            .btn-primary {
                background: #28a745;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
            }
            .btn-secondary {
                background: #6c757d;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(dialog);
    }

    importExtensionData(data) {
        try {
            const historyData = data.data || data;
            this.processHistoryData(historyData);
            this.showSuccessNotification(`Successfully imported ${historyData.length} entries from extension!`);
        } catch (error) {
            this.showErrorNotification('Error importing extension data: ' + error.message);
        }
    }

    setupAdvancedFeatures() {
        // Add advanced URL paste features
        this.setupSmartClipboard();
        this.setupBrowserDetection();
    }

    setupSmartClipboard() {
        // Add smart clipboard detection button
        const smartPasteBtn = document.createElement('button');
        smartPasteBtn.className = 'smart-btn';
        smartPasteBtn.innerHTML = '📋 Auto-Detect Clipboard URLs';
        smartPasteBtn.onclick = () => this.checkClipboardForUrls();
        
        const pasteSection = document.querySelector('.smart-paste-tools');
        if (pasteSection) {
            pasteSection.appendChild(smartPasteBtn);
        }
    }

    async checkClipboardForUrls() {
        try {
            const clipText = await navigator.clipboard.readText();
            const urls = this.extractUrlsFromText(clipText);
            
            if (urls.length > 0) {
                const textarea = document.getElementById('urlTextarea');
                if (textarea) {
                    textarea.value = urls.join('\n');
                    this.showSuccessNotification(`Found ${urls.length} URLs in clipboard!`);
                }
            } else {
                this.showErrorNotification('No URLs found in clipboard.');
            }
        } catch (error) {
            this.showErrorNotification('Unable to access clipboard: ' + error.message);
        }
    }

    extractUrlsFromText(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const matches = text.match(urlRegex);
        return matches ? [...new Set(matches)] : [];
    }

    setupBrowserDetection() {
        // Detect browser and show specific instructions
        const browser = this.detectBrowser();
        const suggestionText = document.getElementById('suggestionText');
        
        if (suggestionText) {
            switch (browser) {
                case 'chrome':
                    suggestionText.textContent = 'Press Ctrl+T for new tab, then copy URLs from "Most visited" section!';
                    break;
                case 'firefox':
                    suggestionText.textContent = 'Press Ctrl+T for new tab, then copy URLs from "Top Sites"!';
                    break;
                case 'safari':
                    suggestionText.textContent = 'Open new tab and copy URLs from "Frequently Visited"!';
                    break;
                case 'edge':
                    suggestionText.textContent = 'Press Ctrl+T for new tab, then copy URLs from "Top sites"!';
                    break;
                default:
                    suggestionText.textContent = 'Open a new tab and copy URLs from your start page!';
            }
        }
    }

    detectBrowser() {
        const userAgent = navigator.userAgent;
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'chrome';
        if (userAgent.includes('Firefox')) return 'firefox';
        if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'safari';
        if (userAgent.includes('Edg')) return 'edge';
        return 'unknown';
    }

    // URL Paste Methods
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
        const urls = textarea.value.split('\n').filter(line => line.trim());
        
        if (urls.length === 0) {
            this.showErrorNotification('Please enter some URLs first.');
            return;
        }

        // Convert URLs to history data format
        const historyData = urls.map(url => {
            const cleanUrl = url.trim();
            return {
                url: cleanUrl,
                title: this.extractDomainFromUrl(cleanUrl),
                visit_count: 1,
                last_visit_time: new Date().toISOString()
            };
        });

        this.processHistoryData(historyData);
        this.hideUrlPasteArea();
        this.showSuccessNotification(`Processed ${urls.length} URLs successfully!`);
    }

    generateSampleUrls() {
        const commonSites = [
            'https://google.com',
            'https://youtube.com', 
            'https://github.com',
            'https://stackoverflow.com',
            'https://reddit.com',
            'https://twitter.com',
            'https://linkedin.com',
            'https://wikipedia.org',
            'https://amazon.com',
            'https://netflix.com',
            'https://facebook.com',
            'https://instagram.com',
            'https://medium.com',
            'https://discord.com',
            'https://twitch.tv'
        ];
        
        const textarea = document.getElementById('urlTextarea');
        if (textarea) {
            textarea.value = commonSites.join('\n');
            textarea.focus();
        }
    }

    // Notification Methods
    showSuccessNotification(message) {
        this.showNotification(message, 'success');
    }

    showErrorNotification(message) {
        this.showNotification(message, 'error');
    }

    showExtensionConnectedNotification() {
        this.showNotification('🔗 Browser extension detected!', 'info');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            max-width: 300px;
            animation: slideInRight 0.3s ease-out;
            font-family: 'Poppins', sans-serif;
        `;
        
        // Add animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInRight 0.3s ease-out reverse';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    // Browser History Access Methods (Enhanced)
    async accessBrowserHistory() {
        const button = document.getElementById('accessChromeHistory');
        const originalText = button.textContent;
        
        try {
            button.textContent = 'Requesting Permission...';
            button.disabled = true;

            // Detect browser type
            const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
            const isEdge = /Edg/.test(navigator.userAgent);
            const isFirefox = /Firefox/.test(navigator.userAgent);
            const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
            
            // Try automatic permission-based access first
            const automaticSuccess = await this.tryModernBrowserAPIs();
            
            if (!automaticSuccess) {
                // Show enhanced guidance
                this.showEnhancedBrowserGuidance(isChrome, isEdge, isFirefox, isSafari);
            }
        } catch (error) {
            console.error('Error accessing browser history:', error);
            this.showEnhancedBrowserGuidance(true, false, false, false);
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    async tryModernBrowserAPIs() {
        const results = [];
        
        try {
            // Try current page info
            if (window.location.href !== 'about:blank') {
                results.push({
                    url: window.location.href,
                    title: document.title,
                    visit_count: 1,
                    last_visit_time: new Date().toISOString()
                });
            }

            // Try referrer
            if (document.referrer) {
                results.push({
                    url: document.referrer,
                    title: 'Referrer',
                    visit_count: 1,
                    last_visit_time: new Date().toISOString()
                });
            }
        } catch (e) {
            console.log('Modern API access failed:', e);
        }

        if (results.length > 0) {
            this.showSecurityExplanation(results);
            return true;
        }

        return false;
    }

    showSecurityExplanation(foundUrls) {
        // Show explanation of browser security limitations
        this.showNotification(`Found ${foundUrls.length} URLs from current session. For full history, use manual methods or our extension.`, 'info');
    }

    showEnhancedBrowserGuidance(isChrome, isEdge, isFirefox, isSafari) {
        let instructions = "Here's how to get your browsing data:\n\n";
        
        if (isChrome) {
            instructions += "🌐 CHROME:\n";
            instructions += "1. Press Ctrl+T (new tab)\n";
            instructions += "2. Copy URLs from 'Most visited' section\n";
            instructions += "3. Or press Ctrl+H → copy URLs from history\n\n";
        } else if (isFirefox) {
            instructions += "🦊 FIREFOX:\n";
            instructions += "1. Press Ctrl+T (new tab)\n";
            instructions += "2. Copy URLs from 'Top Sites'\n";
            instructions += "3. Or press Ctrl+Shift+H → copy from library\n\n";
        } else if (isSafari) {
            instructions += "🧭 SAFARI:\n";
            instructions += "1. Open new tab\n";
            instructions += "2. Copy URLs from 'Frequently Visited'\n";
            instructions += "3. Or History → Show All History\n\n";
        } else if (isEdge) {
            instructions += "🔷 EDGE:\n";
            instructions += "1. Press Ctrl+T (new tab)\n";
            instructions += "2. Copy URLs from 'Top sites'\n";
            instructions += "3. Or press Ctrl+H → copy from history\n\n";
        }

        instructions += "Then use the '📋 Smart Paste' button above!";
        
        alert(instructions);
    }

    showExtensionInfo() {
        const modal = document.createElement('div');
        modal.className = 'extension-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🔗 Browser Extension</h3>
                    <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="modal-body">
                    <h4>🚀 Get the Browser History Map Extension</h4>
                    <p>Our browser extension provides seamless, one-click access to your browsing history:</p>
                    
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

                    <div class="installation-steps">
                        <h4>📦 Installation Instructions:</h4>
                        <ol>
                            <li>Download the extension folder from the GitHub repository</li>
                            <li>Open Chrome/Edge and go to <code>chrome://extensions/</code></li>
                            <li>Enable "Developer mode" (top right toggle)</li>
                            <li>Click "Load unpacked" and select the browser-extension folder</li>
                            <li>The extension icon will appear in your toolbar</li>
                        </ol>
                    </div>

                    <div class="extension-status">
                        <h4>Development Status:</h4>
                        <div class="status-item">✅ Chrome Extension - Ready to install</div>
                        <div class="status-item">🔄 Firefox Add-on - Coming soon</div>
                        <div class="status-item">🔄 Edge Extension - Ready to install</div>
                        <div class="status-item">🔄 Safari Extension - Planned</div>
                    </div>

                    <p><strong>In the meantime:</strong> Use the manual methods above for quick access!</p>
                </div>
                <div class="modal-footer">
                    <a href="https://github.com/ShikharY/browser-history-map/tree/main/browser-extension" target="_blank" class="btn-primary">📥 Download Extension</a>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="btn-secondary">Got it!</button>
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
                font-family: 'Poppins', sans-serif;
            }
            .modal-content {
                background: white;
                border-radius: 15px;
                max-width: 600px;
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
            .installation-steps {
                background: #e3f2fd;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .installation-steps h4 {
                margin-top: 0;
                color: #1976d2;
            }
            .installation-steps code {
                background: #fff;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: monospace;
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
                display: flex;
                gap: 10px;
                justify-content: center;
            }
            .btn-primary {
                background: #28a745;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 5px;
                cursor: pointer;
                text-decoration: none;
                display: inline-block;
            }
            .btn-secondary {
                background: #6c757d;
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 5px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(modal);
    }
}

// Initialize the application when the page loads
let browserHistoryMap;
document.addEventListener('DOMContentLoaded', () => {
    browserHistoryMap = new BrowserHistoryMap();
});

// Enhanced utility functions
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

function validateFileSize(file, maxSizeMB = 10) {
    const maxSize = maxSizeMB * 1024 * 1024;
    return file.size <= maxSize;
}

function validateFileType(file, allowedTypes = ['json', 'csv', 'txt']) {
    const fileType = file.name.split('.').pop().toLowerCase();
    return allowedTypes.includes(fileType);
}

// Extension communication helper
function setupExtensionCommunication() {
    window.addEventListener('message', (event) => {
        if (event.data.type === 'EXTENSION_DATA') {
            if (window.browserHistoryMap) {
                window.browserHistoryMap.importExtensionData(event.data.payload);
            }
        }
    });
}