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
            button.textContent = 'Opening Smart Guide...';
            button.disabled = true;

            // Detect browser type
            const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
            const isEdge = /Edg/.test(navigator.userAgent);
            const isFirefox = /Firefox/.test(navigator.userAgent);
            const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
            
            console.log('Browser detection:', { isChrome, isEdge, isFirefox, isSafari }); // Debug log
            
            // Try newer web APIs first
            await this.tryModernBrowserAPIs();
            
            // Always show enhanced guidance
            this.showEnhancedBrowserGuidance(isChrome, isEdge, isFirefox, isSafari);
            
        } catch (error) {
            console.error('Browser history access failed:', error);
            // Show guidance anyway - don't alert errors
            this.showEnhancedBrowserGuidance(true, true, true, true);
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    async tryModernBrowserAPIs() {
        // Try to use newer browser APIs for limited history access
        const results = [];
        
        try {
            // Navigation API (limited support but provides some recent navigation info)
            if ('navigation' in window) {
                const entries = window.navigation.entries();
                entries.forEach(entry => {
                    if (entry.url) {
                        results.push({
                            url: entry.url,
                            title: document.title || this.extractDomainFromUrl(entry.url),
                            visit_count: 1,
                            last_visit_time: new Date().toISOString()
                        });
                    }
                });
            }
        } catch (e) {
            console.log('Navigation API not available or failed:', e);
        }

        try {
            // Performance Observer for recently visited resources
            if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.initiatorType === 'navigation') {
                            results.push({
                                url: entry.name,
                                title: document.title || this.extractDomainFromUrl(entry.name),
                                visit_count: 1,
                                last_visit_time: new Date().toISOString()
                            });
                        }
                    });
                });
                observer.observe({ entryTypes: ['navigation', 'resource'] });
                
                // Give it a moment to collect data
                await new Promise(resolve => setTimeout(resolve, 500));
                observer.disconnect();
            }
        } catch (e) {
            console.log('Performance Observer not available or failed:', e);
        }

        try {
            // Check for session/local storage hints
            if (localStorage.length > 0 || sessionStorage.length > 0) {
                // Look for URL-like patterns in storage
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    const value = localStorage.getItem(key);
                    if (value && (value.includes('http://') || value.includes('https://'))) {
                        const urlMatch = value.match(/(https?:\/\/[^\s"'<>]+)/g);
                        if (urlMatch) {
                            urlMatch.forEach(url => {
                                results.push({
                                    url: url,
                                    title: this.extractDomainFromUrl(url),
                                    visit_count: 1,
                                    last_visit_time: new Date().toISOString()
                                });
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.log('Storage analysis failed:', e);
        }

        // If we found any URLs from modern APIs, offer to use them
        if (results.length > 0) {
            const uniqueResults = results.filter((item, index, self) => 
                index === self.findIndex(t => t.url === item.url)
            );
            
            if (uniqueResults.length > 0) {
                const useFound = confirm(`Found ${uniqueResults.length} URLs from browser APIs. Would you like to visualize these?`);
                if (useFound) {
                    this.processHistoryData(uniqueResults);
                    return true;
                }
            }
        }
        
        return false;
    }

    showEnhancedBrowserGuidance(isChrome, isEdge, isFirefox, isSafari) {
        console.log('Showing enhanced browser guidance modal'); // Debug log
        
        let browserName = 'your browser';
        let specificInstructions = '';
        let smartMethods = '';
        
        if (isEdge) {
            browserName = 'Microsoft Edge';
            specificInstructions = `
                <div class="browser-specific-guide">
                    <h4>🌟 Edge Smart Methods (No Export Needed!)</h4>
                    
                    <div class="smart-method-section">
                        <h5>⚡ Super Quick Methods:</h5>
                        <div class="smart-method">
                            <strong>1. 📱 New Tab Recent Sites:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Open a new tab (Ctrl+T)</span>
                                <span class="step-detail">• Copy URLs from your "Top sites" or "Recent activity"</span>
                                <span class="step-detail">• Paste them above using "📋 Paste URLs"</span>
                            </div>
                        </div>
                        
                        <div class="smart-method">
                            <strong>2. 📚 Collections Export:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Open Collections (Ctrl+Shift+Y)</span>
                                <span class="step-detail">• Right-click collection → "Export to Excel" or copy links</span>
                                <span class="step-detail">• Paste the URLs here</span>
                            </div>
                        </div>
                        
                        <div class="smart-method">
                            <strong>3. 🔖 Favorites Quick Export:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Press Ctrl+Shift+O (Favorites manager)</span>
                                <span class="step-detail">• Select multiple favorites and copy</span>
                                <span class="step-detail">• Or export as HTML and extract URLs</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            smartMethods = `
                <div class="edge-smart-tips">
                    <h5>💡 Edge Pro Tips:</h5>
                    <ul>
                        <li><strong>Address Bar Magic:</strong> Type a letter and see your history suggestions - copy the good ones!</li>
                        <li><strong>Sync Data:</strong> Use Edge sync to access history from other devices</li>
                        <li><strong>Workplace/School:</strong> Check if your organization allows history export</li>
                        <li><strong>Reading List:</strong> Export your reading list URLs as a starting point</li>
                    </ul>
                </div>
            `;
        } else if (isChrome) {
            browserName = 'Google Chrome';
            specificInstructions = `
                <div class="browser-specific-guide">
                    <h4>🌟 Chrome Smart Methods (No Export Needed!)</h4>
                    
                    <div class="smart-method-section">
                        <h5>⚡ Super Quick Methods:</h5>
                        <div class="smart-method">
                            <strong>1. 🚀 New Tab Shortcuts:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Open new tab (Ctrl+T)</span>
                                <span class="step-detail">• Copy URLs from "Shortcuts" or "Recently visited"</span>
                                <span class="step-detail">• Right-click shortcuts to copy link address</span>
                            </div>
                        </div>
                        
                        <div class="smart-method">
                            <strong>2. 📱 Address Bar Smart History:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Type any letter in address bar</span>
                                <span class="step-detail">• See your frequent sites in dropdown</span>
                                <span class="step-detail">• Copy the URLs you want to visualize</span>
                            </div>
                        </div>
                        
                        <div class="smart-method">
                            <strong>3. 📊 Chrome's Own Data:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Go to chrome://settings/content</span>
                                <span class="step-detail">• Check "Site settings" for frequently visited sites</span>
                                <span class="step-detail">• Or use chrome://history/ and copy interesting URLs</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            smartMethods = `
                <div class="chrome-smart-tips">
                    <h5>💡 Chrome Pro Tips:</h5>
                    <ul>
                        <li><strong>Google Account:</strong> Use Google Takeout to download your Chrome data</li>
                        <li><strong>Bookmarks Bar:</strong> Your bookmarks are the easiest to export - right-click folder → copy link addresses</li>
                        <li><strong>Recently Closed:</strong> Ctrl+Shift+T shows recently closed tabs - copy from there</li>
                        <li><strong>Mobile Sync:</strong> Access your mobile Chrome history via Google Account</li>
                    </ul>
                </div>
            `;
        } else if (isFirefox) {
            browserName = 'Mozilla Firefox';
            specificInstructions = `
                <div class="browser-specific-guide">
                    <h4>🌟 Firefox Smart Methods (No Export Needed!)</h4>
                    
                    <div class="smart-method-section">
                        <h5>⚡ Super Quick Methods:</h5>
                        <div class="smart-method">
                            <strong>1. 🏠 Firefox Home Quick Access:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Open new tab to see Firefox Home</span>
                                <span class="step-detail">• Copy URLs from "Top Sites" and "Recent Activity"</span>
                                <span class="step-detail">• Right-click tiles to copy link location</span>
                            </div>
                        </div>
                        
                        <div class="smart-method">
                            <strong>2. 📚 Library Power User:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Press Ctrl+Shift+H (Library)</span>
                                <span class="step-detail">• Right-click entries → "Copy Link Location"</span>
                                <span class="step-detail">• Select multiple with Ctrl+Click</span>
                            </div>
                        </div>
                        
                        <div class="smart-method">
                            <strong>3. 🔖 Bookmark Export:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Ctrl+Shift+O (Bookmark manager)</span>
                                <span class="step-detail">• Import and Backup → Export HTML</span>
                                <span class="step-detail">• Open HTML file and copy the URLs</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            smartMethods = `
                <div class="firefox-smart-tips">
                    <h5>💡 Firefox Pro Tips:</h5>
                    <ul>
                        <li><strong>Awesome Bar:</strong> Type in address bar to see history suggestions</li>
                        <li><strong>Sync Account:</strong> Access history from other devices via Firefox Sync</li>
                        <li><strong>Private Data:</strong> Firefox focuses on privacy - check what data you've allowed to be stored</li>
                        <li><strong>Sessions:</strong> Firefox saves session data - check recently closed windows/tabs</li>
                    </ul>
                </div>
            `;
        } else if (isSafari) {
            browserName = 'Safari';
            specificInstructions = `
                <div class="browser-specific-guide">
                    <h4>🌟 Safari Smart Methods (No Export Needed!)</h4>
                    
                    <div class="smart-method-section">
                        <h5>⚡ Super Quick Methods:</h5>
                        <div class="smart-method">
                            <strong>1. 📱 Start Page Shortcuts:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Open new tab to see Start Page</span>
                                <span class="step-detail">• Copy URLs from "Frequently Visited" tiles</span>
                                <span class="step-detail">• Right-click tiles to copy link</span>
                            </div>
                        </div>
                        
                        <div class="smart-method">
                            <strong>2. 📚 History Menu:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Go to History menu → Show All History</span>
                                <span class="step-detail">• Right-click entries to copy URL</span>
                                <span class="step-detail">• Use search to find specific sites</span>
                            </div>
                        </div>
                        
                        <div class="smart-method">
                            <strong>3. 🔖 Reading List & Bookmarks:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Check your Reading List (sidebar)</span>
                                <span class="step-detail">• Export bookmarks via File → Export</span>
                                <span class="step-detail">• Copy URLs from Top Hits in address bar</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            smartMethods = `
                <div class="safari-smart-tips">
                    <h5>💡 Safari Pro Tips:</h5>
                    <ul>
                        <li><strong>iCloud Sync:</strong> Access history from all your Apple devices</li>
                        <li><strong>Privacy Focus:</strong> Safari limits tracking - check what history is available</li>
                        <li><strong>Top Hits:</strong> Safari's address bar shows your most visited sites first</li>
                        <li><strong>Tab Groups:</strong> Export your organized tab groups as URL lists</li>
                    </ul>
                </div>
            `;
        } else {
            // Universal browser guidance
            browserName = 'your browser';
            specificInstructions = `
                <div class="browser-specific-guide">
                    <h4>🌟 Universal Smart Methods (Works in Any Browser!)</h4>
                    
                    <div class="smart-method-section">
                        <h5>⚡ Super Quick Methods:</h5>
                        <div class="smart-method">
                            <strong>1. 🏠 New Tab Magic:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Open a new tab (Ctrl+T)</span>
                                <span class="step-detail">• Look for "Most visited", "Top sites", or "Shortcuts"</span>
                                <span class="step-detail">• Right-click tiles and copy link addresses</span>
                            </div>
                        </div>
                        
                        <div class="smart-method">
                            <strong>2. 📝 Address Bar Intelligence:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Type a single letter in your address bar</span>
                                <span class="step-detail">• Your browser will suggest frequently visited sites</span>
                                <span class="step-detail">• Copy the URLs you want to map</span>
                            </div>
                        </div>
                        
                        <div class="smart-method">
                            <strong>3. 🔖 Bookmark Export:</strong>
                            <div class="method-steps">
                                <span class="step-detail">• Find bookmark manager (usually Ctrl+Shift+O)</span>
                                <span class="step-detail">• Export bookmarks as HTML</span>
                                <span class="step-detail">• Open the HTML file and copy URLs</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            smartMethods = `
                <div class="universal-smart-tips">
                    <h5>💡 Universal Pro Tips:</h5>
                    <ul>
                        <li><strong>Recently Closed:</strong> Use Ctrl+Shift+T to see recently closed tabs</li>
                        <li><strong>Downloads Page:</strong> Your downloads often contain website URLs</li>
                        <li><strong>Email/Messages:</strong> Check sent emails for shared links</li>
                        <li><strong>Mobile Apps:</strong> Most browsers sync between mobile and desktop</li>
                    </ul>
                </div>
            `;
        }

        try {
            const modal = document.createElement('div');
            modal.className = 'browser-guidance-modal enhanced-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>🚀 Smart History Access for ${browserName}</h3>
                        <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="no-export-notice">
                            <p><strong>✨ No Export Required!</strong> These methods work instantly without downloading or exporting any files. Just copy and paste!</p>
                        </div>
                        
                        ${specificInstructions}
                        
                        ${smartMethods}
                        
                        <div class="instant-methods">
                            <h4>🎯 Instant Access Alternatives:</h4>
                            <div class="instant-method-grid">
                                <div class="instant-method">
                                    <span class="instant-icon">📱</span>
                                    <div class="instant-content">
                                        <strong>Mobile History:</strong> Use browser sync to access mobile browsing history
                                    </div>
                                </div>
                                <div class="instant-method">
                                    <span class="instant-icon">🔍</span>
                                    <div class="instant-content">
                                        <strong>Search History:</strong> Google "my activity" to see your search history
                                    </div>
                                </div>
                                <div class="instant-method">
                                    <span class="instant-icon">📧</span>
                                    <div class="instant-content">
                                        <strong>Email Links:</strong> Check sent emails for shared website links
                                    </div>
                                </div>
                                <div class="instant-method">
                                    <span class="instant-icon">💬</span>
                                    <div class="instant-content">
                                        <strong>Social Links:</strong> Copy URLs from your social media shares
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="convenience-tools">
                            <h4>🛠️ Convenience Tools:</h4>
                            <div class="tool-buttons">
                                <button onclick="window.open('https://takeout.google.com', '_blank')" class="tool-btn">
                                    📊 Google Takeout
                                </button>
                                <button onclick="this.openHistoryInstructions()" class="tool-btn">
                                    📖 Browser History (Ctrl+H)
                                </button>
                                <button onclick="this.openNewTabDemo()" class="tool-btn">
                                    🏠 New Tab Demo
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button onclick="this.openPasteArea(); this.parentElement.parentElement.parentElement.remove();" class="primary-btn">📋 Open Paste Area</button>
                        <button onclick="this.openQuickDemo(); this.parentElement.parentElement.parentElement.remove();" class="demo-btn">🚀 Try Quick Demo</button>
                        <button onclick="this.parentElement.parentElement.parentElement.remove()" class="cancel-btn">Got it!</button>
                    </div>
                </div>
            `;

            // Add enhanced modal styles
            if (!document.querySelector('#enhanced-modal-styles')) {
                this.addEnhancedModalStyles();
            }
            
            // Add helper methods to modal buttons
            modal.querySelector('.modal-footer').addEventListener('click', (e) => {
                if (e.target.classList.contains('primary-btn')) {
                    document.getElementById('pasteUrls').click();
                } else if (e.target.classList.contains('demo-btn')) {
                    this.loadDemoData();
                }
            });
            
            document.body.appendChild(modal);
            console.log('Enhanced modal added to page'); // Debug log
            
        } catch (error) {
            console.error('Error creating enhanced modal:', error);
            // Fallback to improved alert
            alert(`🚀 Quick Access Guide for ${browserName}:\n\n` +
                  `✨ NO EXPORT NEEDED! Try these instant methods:\n\n` +
                  `1. 📱 Open new tab - copy URLs from "Most visited" tiles\n` +
                  `2. 📝 Type in address bar - copy suggested URLs\n` +
                  `3. 🔖 Export bookmarks - copy URLs from HTML file\n` +
                  `4. 📋 Use "Paste URLs" button above for easy input\n\n` +
                  `No files to download or export! Just copy and paste! 🎉`);
        }
    }

    addEnhancedModalStyles() {
        const style = document.createElement('style');
        style.id = 'enhanced-modal-styles';
        style.textContent = `
            .enhanced-modal {
                font-family: 'Poppins', sans-serif;
            }
            .enhanced-modal .modal-content {
                background: white;
                border-radius: 20px;
                max-width: 800px;
                width: 95%;
                max-height: 90vh;
                overflow-y: auto;
                animation: modalSlideIn 0.4s ease-out;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            .enhanced-modal .modal-header {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 30px;
                border-radius: 20px 20px 0 0;
                position: relative;
                overflow: hidden;
            }
            .enhanced-modal .modal-header::before {
                content: '';
                position: absolute;
                top: -50%;
                right: -20px;
                width: 100px;
                height: 200%;
                background: rgba(255,255,255,0.1);
                transform: rotate(15deg);
            }
            .enhanced-modal .modal-header h3 {
                margin: 0;
                font-weight: 700;
                font-size: 1.4rem;
                position: relative;
                z-index: 1;
            }
            .enhanced-modal .close-modal {
                position: relative;
                z-index: 2;
                background: rgba(255,255,255,0.2);
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 50%;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .enhanced-modal .close-modal:hover {
                background: rgba(255,255,255,0.3);
                transform: rotate(90deg);
            }
            .enhanced-modal .modal-body {
                padding: 30px;
                line-height: 1.6;
            }
            .no-export-notice {
                background: linear-gradient(135deg, #e8f5e8, #f0fff0);
                padding: 20px;
                border-radius: 12px;
                border-left: 5px solid #28a745;
                margin-bottom: 30px;
                position: relative;
                overflow: hidden;
            }
            .no-export-notice::before {
                content: '✨';
                position: absolute;
                top: 15px;
                right: 20px;
                font-size: 2rem;
                opacity: 0.3;
            }
            .no-export-notice p {
                margin: 0;
                color: #155724;
                font-weight: 600;
                font-size: 1.1rem;
            }
            .smart-method-section {
                margin-bottom: 30px;
            }
            .smart-method-section h5 {
                color: #333;
                margin-bottom: 20px;
                font-weight: 700;
                font-size: 1.1rem;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .smart-method {
                background: #f8f9ff;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 15px;
                border-left: 4px solid #667eea;
                transition: all 0.3s ease;
            }
            .smart-method:hover {
                transform: translateX(5px);
                box-shadow: 0 5px 20px rgba(102, 126, 234, 0.1);
            }
            .smart-method strong {
                color: #333;
                display: block;
                margin-bottom: 12px;
                font-size: 1.05rem;
            }
            .method-steps {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .step-detail {
                color: #555;
                font-size: 0.95rem;
                padding-left: 20px;
                position: relative;
            }
            .step-detail::before {
                content: '→';
                position: absolute;
                left: 0;
                color: #667eea;
                font-weight: bold;
            }
            .edge-smart-tips, .chrome-smart-tips, .firefox-smart-tips, .safari-smart-tips, .universal-smart-tips {
                background: #f0f8ff;
                padding: 20px;
                border-radius: 12px;
                border-left: 4px solid #0078d4;
                margin-bottom: 25px;
            }
            .edge-smart-tips h5, .chrome-smart-tips h5, .firefox-smart-tips h5, .safari-smart-tips h5, .universal-smart-tips h5 {
                margin: 0 0 15px 0;
                color: #0078d4;
                font-weight: 700;
            }
            .edge-smart-tips ul, .chrome-smart-tips ul, .firefox-smart-tips ul, .safari-smart-tips ul, .universal-smart-tips ul {
                margin: 0;
                padding-left: 0;
                list-style: none;
            }
            .edge-smart-tips li, .chrome-smart-tips li, .firefox-smart-tips li, .safari-smart-tips li, .universal-smart-tips li {
                margin-bottom: 10px;
                color: #0078d4;
                line-height: 1.5;
                padding-left: 25px;
                position: relative;
            }
            .edge-smart-tips li::before, .chrome-smart-tips li::before, .firefox-smart-tips li::before, .safari-smart-tips li::before, .universal-smart-tips li::before {
                content: '💡';
                position: absolute;
                left: 0;
                top: 0;
            }
            .instant-methods {
                background: #fff8e1;
                padding: 25px;
                border-radius: 12px;
                border-left: 4px solid #ffc107;
                margin-bottom: 25px;
            }
            .instant-methods h4 {
                margin: 0 0 20px 0;
                color: #e65100;
                font-weight: 700;
            }
            .instant-method-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 15px;
            }
            .instant-method {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                background: white;
                padding: 15px;
                border-radius: 10px;
                border: 1px solid #ffecb3;
                transition: all 0.3s ease;
            }
            .instant-method:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(255, 193, 7, 0.2);
            }
            .instant-icon {
                font-size: 1.5rem;
                flex-shrink: 0;
            }
            .instant-content {
                flex: 1;
            }
            .instant-content strong {
                color: #e65100;
                display: block;
                margin-bottom: 5px;
            }
            .convenience-tools {
                background: #f3e5f5;
                padding: 25px;
                border-radius: 12px;
                border-left: 4px solid #9c27b0;
                margin-bottom: 20px;
            }
            .convenience-tools h4 {
                margin: 0 0 20px 0;
                color: #6a1b9a;
                font-weight: 700;
            }
            .tool-buttons {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
            }
            .tool-btn {
                background: linear-gradient(135deg, #9c27b0, #673ab7);
                color: white;
                border: none;
                padding: 12px 20px;
                border-radius: 25px;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-block;
            }
            .tool-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(156, 39, 176, 0.3);
                background: linear-gradient(135deg, #8e24aa, #5e35b1);
            }
            .enhanced-modal .modal-footer {
                padding: 25px 30px;
                border-top: 1px solid #eee;
                display: flex;
                gap: 15px;
                justify-content: center;
                flex-wrap: wrap;
            }
            .enhanced-modal .primary-btn,
            .enhanced-modal .demo-btn,
            .enhanced-modal .cancel-btn {
                padding: 15px 25px;
                border: none;
                border-radius: 25px;
                font-size: 0.95rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                min-width: 140px;
            }
            .enhanced-modal .primary-btn {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
            }
            .enhanced-modal .primary-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
            }
            .enhanced-modal .demo-btn {
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
            }
            .enhanced-modal .demo-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
            }
            .enhanced-modal .cancel-btn {
                background: #6c757d;
                color: white;
            }
            .enhanced-modal .cancel-btn:hover {
                background: #5a6268;
                transform: translateY(-1px);
            }
            
            /* Mobile responsiveness for enhanced modal */
            @media (max-width: 768px) {
                .enhanced-modal .modal-content {
                    width: 98%;
                    margin: 10px;
                }
                .enhanced-modal .modal-body {
                    padding: 20px;
                }
                .instant-method-grid {
                    grid-template-columns: 1fr;
                }
                .enhanced-modal .modal-footer {
                    flex-direction: column;
                    align-items: stretch;
                }
                .enhanced-modal .primary-btn,
                .enhanced-modal .demo-btn,
                .enhanced-modal .cancel-btn {
                    width: 100%;
                    margin-bottom: 10px;
                }
                .tool-buttons {
                    flex-direction: column;
                }
                .tool-btn {
                    width: 100%;
                    text-align: center;
                }
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
        
        // Show browser-specific suggestion
        const suggestion = this.suggestBestMethod();
        const suggestionElement = document.getElementById('suggestionText');
        if (suggestionElement) {
            suggestionElement.textContent = suggestion;
        }
        
        // Try to auto-detect clipboard URLs
        setTimeout(() => {
            this.checkClipboardForUrls();
        }, 500);
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

    // Add convenience methods for easier history access
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

    addPopularSitesToPaste() {
        const textarea = document.getElementById('urlTextarea');
        const currentValue = textarea.value.trim();
        const popularSites = [
            'https://google.com',
            'https://youtube.com',
            'https://github.com',
            'https://stackoverflow.com',
            'https://reddit.com'
        ];
        
        const newValue = currentValue ? 
            currentValue + '\n' + popularSites.join('\n') : 
            popularSites.join('\n');
            
        textarea.value = newValue;
        textarea.focus();
    }

    // Enhanced clipboard detection and assistance
    async checkClipboardForUrls() {
        try {
            if (navigator.clipboard && navigator.clipboard.readText) {
                const clipboardText = await navigator.clipboard.readText();
                if (clipboardText) {
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const urls = clipboardText.match(urlRegex);
                    
                    if (urls && urls.length > 0) {
                        const useClipboard = confirm(
                            `Found ${urls.length} URLs in your clipboard. Would you like to use them?`
                        );
                        
                        if (useClipboard) {
                            const textarea = document.getElementById('urlTextarea');
                            textarea.value = urls.join('\n');
                            this.showUrlPasteArea();
                            return true;
                        }
                    }
                }
            }
        } catch (error) {
            console.log('Clipboard access not available:', error);
        }
        return false;
    }

    // Auto-detect and suggest browser history methods
    suggestBestMethod() {
        const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
        const isEdge = /Edg/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        
        let suggestion = '';
        
        if (isChrome) {
            suggestion = "Chrome detected! Try: New tab → copy from 'Shortcuts' section";
        } else if (isEdge) {
            suggestion = "Edge detected! Try: New tab → copy from 'Top sites' or use Collections";
        } else if (isFirefox) {
            suggestion = "Firefox detected! Try: New tab → copy from 'Top Sites' tiles";
        } else if (isSafari) {
            suggestion = "Safari detected! Try: New tab → copy from 'Frequently Visited'";
        } else {
            suggestion = "Try: Open new tab and copy URLs from your browser's start page";
        }
        
        return suggestion;
    }
}

// Initialize the application when the page loads
let browserHistoryMap;
document.addEventListener('DOMContentLoaded', () => {
    browserHistoryMap = new BrowserHistoryMap();
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
