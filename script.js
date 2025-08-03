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
            console.log('Show Guide button clicked'); // Debug log
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
        const button = document.getElementById('accessChromeHistory');
        const originalText = button.textContent;
        
        try {
            console.log('Access browser history called'); // Debug log
            button.textContent = 'Checking Browser...';
            button.disabled = true;

            // Detect browser type
            const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
            const isEdge = /Edg/.test(navigator.userAgent);
            const isFirefox = /Firefox/.test(navigator.userAgent);
            
            console.log('Browser detection:', { isChrome, isEdge, isFirefox }); // Debug log
            
            // Check if we're in an extension context or have special permissions
            if (typeof chrome !== 'undefined' && chrome.history) {
                console.log('Chrome extension context detected');
                await this.accessChromeHistory();
            } else {
                console.log('Showing browser-specific guidance');
                // Show browser-specific guidance
                this.showBrowserSpecificGuidance(isChrome, isEdge, isFirefox);
            }
        } catch (error) {
            console.error('Browser history access failed:', error);
            alert('Error: ' + error.message + '\n\nPlease try the "Paste URLs" method instead.');
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    showBrowserSpecificGuidance(isChrome, isEdge, isFirefox) {
        console.log('Showing browser guidance modal'); // Debug log
        
        let browserName = 'your browser';
        let specificInstructions = '';
        
        if (isEdge) {
            browserName = 'Microsoft Edge';
            specificInstructions = `
                <div class="browser-specific-guide">
                    <h4>🌐 Microsoft Edge Quick Access</h4>
                    <div class="quick-steps">
                        <div class="step">
                            <span class="step-number">1</span>
                            <div class="step-content">
                                <strong>Open History:</strong> Press <kbd>Ctrl + H</kbd> or click the ⋯ menu → History
                            </div>
                        </div>
                        <div class="step">
                            <span class="step-number">2</span>
                            <div class="step-content">
                                <strong>Copy URLs:</strong> Right-click on any site and "Copy link" or select and copy from address bar
                            </div>
                        </div>
                        <div class="step">
                            <span class="step-number">3</span>
                            <div class="step-content">
                                <strong>Paste Here:</strong> Use the "📋 Paste URLs" button above to add them to your map
                            </div>
                        </div>
                    </div>
                    <div class="edge-tips">
                        <h5>💡 Edge Pro Tips:</h5>
                        <ul>
                            <li>Use "Most visited" section for your top sites</li>
                            <li>Check your "Collections" for organized links</li>
                            <li>Export favorites and paste the URLs here</li>
                        </ul>
                    </div>
                </div>
            `;
        } else if (isChrome) {
            browserName = 'Google Chrome';
            specificInstructions = `
                <div class="browser-specific-guide">
                    <h4>🌐 Google Chrome Quick Access</h4>
                    <div class="quick-steps">
                        <div class="step">
                            <span class="step-number">1</span>
                            <div class="step-content">
                                <strong>Open History:</strong> Press <kbd>Ctrl + H</kbd> or chrome://history/
                            </div>
                        </div>
                        <div class="step">
                            <span class="step-number">2</span>
                            <div class="step-content">
                                <strong>Copy URLs:</strong> Click on any entry and copy the URL, or use the search box
                            </div>
                        </div>
                        <div class="step">
                            <span class="step-number">3</span>
                            <div class="step-content">
                                <strong>Paste Here:</strong> Use the "📋 Paste URLs" button above
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (isFirefox) {
            browserName = 'Mozilla Firefox';
            specificInstructions = `
                <div class="browser-specific-guide">
                    <h4>🦊 Mozilla Firefox Quick Access</h4>
                    <div class="quick-steps">
                        <div class="step">
                            <span class="step-number">1</span>
                            <div class="step-content">
                                <strong>Open History:</strong> Press <kbd>Ctrl + Shift + H</kbd> or Library button → History
                            </div>
                        </div>
                        <div class="step">
                            <span class="step-number">2</span>
                            <div class="step-content">
                                <strong>Copy URLs:</strong> Right-click entries and copy location
                            </div>
                        </div>
                        <div class="step">
                            <span class="step-number">3</span>
                            <div class="step-content">
                                <strong>Paste Here:</strong> Use the "📋 Paste URLs" button above
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            // Fallback for other browsers
            specificInstructions = `
                <div class="browser-specific-guide">
                    <h4>🌐 Browser History Quick Access</h4>
                    <div class="quick-steps">
                        <div class="step">
                            <span class="step-number">1</span>
                            <div class="step-content">
                                <strong>Open History:</strong> Look for History in your browser menu or press <kbd>Ctrl + H</kbd>
                            </div>
                        </div>
                        <div class="step">
                            <span class="step-number">2</span>
                            <div class="step-content">
                                <strong>Copy URLs:</strong> Right-click on entries and copy the URLs
                            </div>
                        </div>
                        <div class="step">
                            <span class="step-number">3</span>
                            <div class="step-content">
                                <strong>Paste Here:</strong> Use the "📋 Paste URLs" button above
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        try {
            const modal = document.createElement('div');
            modal.className = 'browser-guidance-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🚀 Quick Access for ${browserName}</h3>
                        <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="security-notice">
                            <p><strong>🔒 Browser Security:</strong> For privacy protection, browsers don't allow websites to directly access your history. But we can make it super easy!</p>
                        </div>
                        
                        ${specificInstructions}
                        
                        <div class="alternative-methods">
                            <h4>🎯 Even Easier Alternatives:</h4>
                            <div class="alt-method">
                                <strong>📱 Most Visited:</strong> Look for "Most visited" or "Frequently visited" in your browser and copy those URLs
                            </div>
                            <div class="alt-method">
                                <strong>🔖 Bookmarks:</strong> Export bookmarks and paste the URLs here
                            </div>
                            <div class="alt-method">
                                <strong>📝 Address Bar:</strong> Type in your address bar and copy suggestions that appear
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="document.getElementById('pasteUrls').click(); this.parentElement.parentElement.parentElement.remove();" class="demo-btn">📋 Open Paste Area</button>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="cancel-btn">Got it!</button>
                    </div>
                </div>
            `;

            // Add CSS if not already added
            if (!document.querySelector('#browser-guidance-styles')) {
                this.addBrowserGuidanceStyles();
            }
            
            document.body.appendChild(modal);
            console.log('Modal added to page'); // Debug log
            
        } catch (error) {
            console.error('Error creating modal:', error);
            // Fallback to simple alert
            alert(`Quick Guide for ${browserName}:\n\n1. Press Ctrl+H to open history\n2. Copy URLs from your history\n3. Use the "Paste URLs" button above\n4. Paste and process your URLs!`);
        }
    }

    addBrowserGuidanceStyles() {
        const style = document.createElement('style');
        style.id = 'browser-guidance-styles';
        style.textContent = `
            .browser-guidance-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                font-family: 'Poppins', sans-serif;
            }
            .browser-guidance-modal .modal-content {
                background: white;
                border-radius: 15px;
                max-width: 600px;
                width: 90%;
                max-height: 85vh;
                overflow-y: auto;
                animation: modalSlideIn 0.3s ease-out;
            }
            @keyframes modalSlideIn {
                from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .browser-guidance-modal .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 25px;
                border-bottom: 1px solid #eee;
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                border-radius: 15px 15px 0 0;
            }
            .browser-guidance-modal .modal-header h3 {
                margin: 0;
                font-weight: 600;
            }
            .browser-guidance-modal .close-modal {
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: white;
                opacity: 0.8;
                transition: opacity 0.2s;
            }
            .browser-guidance-modal .close-modal:hover {
                opacity: 1;
            }
            .browser-guidance-modal .modal-body {
                padding: 25px;
            }
            .security-notice {
                background: #e8f4fd;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #0066cc;
                margin-bottom: 25px;
            }
            .security-notice p {
                margin: 0;
                color: #004d99;
                line-height: 1.5;
            }
            .browser-specific-guide {
                margin-bottom: 25px;
            }
            .browser-specific-guide h4 {
                color: #333;
                margin-bottom: 20px;
                font-weight: 600;
            }
            .quick-steps {
                margin-bottom: 20px;
            }
            .step {
                display: flex;
                align-items: flex-start;
                margin-bottom: 15px;
                padding: 15px;
                background: #f8f9ff;
                border-radius: 8px;
            }
            .step-number {
                background: #667eea;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 0.9rem;
                margin-right: 15px;
                flex-shrink: 0;
            }
            .step-content {
                flex: 1;
            }
            .step-content strong {
                color: #333;
                display: block;
                margin-bottom: 5px;
            }
            kbd {
                background: #f4f4f4;
                border: 1px solid #ccc;
                border-radius: 3px;
                padding: 2px 6px;
                font-family: monospace;
                font-size: 0.9em;
            }
            .edge-tips {
                background: #f0f8ff;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #0078d4;
            }
            .edge-tips h5 {
                margin: 0 0 10px 0;
                color: #0078d4;
                font-weight: 600;
            }
            .edge-tips ul {
                margin: 0;
                padding-left: 20px;
            }
            .edge-tips li {
                margin-bottom: 5px;
                color: #0078d4;
                line-height: 1.4;
            }
            .alternative-methods {
                background: #f8fff8;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #28a745;
            }
            .alternative-methods h4 {
                margin: 0 0 15px 0;
                color: #155724;
                font-weight: 600;
            }
            .alt-method {
                margin-bottom: 12px;
                padding: 10px;
                background: white;
                border-radius: 6px;
                border: 1px solid #d4edda;
            }
            .alt-method strong {
                color: #155724;
            }
            .browser-guidance-modal .modal-footer {
                padding: 20px 25px;
                border-top: 1px solid #eee;
                text-align: center;
                display: flex;
                gap: 15px;
                justify-content: center;
            }
            .browser-guidance-modal .demo-btn,
            .browser-guidance-modal .cancel-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 8px;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .browser-guidance-modal .demo-btn {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }
            .browser-guidance-modal .demo-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
            }
            .browser-guidance-modal .cancel-btn {
                background: #6c757d;
                color: white;
            }
            .browser-guidance-modal .cancel-btn:hover {
                background: #5a6268;
            }
        `;
        
        document.head.appendChild(style);
    }

    async accessChromeHistory() {
        // This would only work in a Chrome extension context
        // For regular web pages, we redirect to the guidance modal
        throw new Error('Extension context required for direct API access');
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
