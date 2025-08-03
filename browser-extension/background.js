// Background service worker for Browser History Map Exporter
chrome.runtime.onInstalled.addListener(() => {
  console.log('Browser History Map Exporter installed');
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'exportHistory') {
    exportBrowserHistory(request.timeRange)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Required for async response
  }
  
  if (request.action === 'openWebApp') {
    chrome.tabs.create({
      url: 'https://shikhary.github.io/browser-history-map'
    });
    sendResponse({ success: true });
  }
});

async function exportBrowserHistory(timeRange) {
  try {
    const now = Date.now();
    let startTime = 0;
    
    // Calculate start time based on range
    switch (timeRange) {
      case '7':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case '30':
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case '90':
        startTime = now - (90 * 24 * 60 * 60 * 1000);
        break;
      case '365':
        startTime = now - (365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startTime = 0;
        break;
    }

    // Search browser history
    const historyItems = await chrome.history.search({
      text: '',
      startTime: startTime,
      maxResults: 10000 // Reasonable limit
    });

    // Transform data to match expected format
    const exportData = historyItems.map(item => ({
      url: item.url,
      title: item.title || extractDomainFromUrl(item.url),
      visit_count: item.visitCount || 1,
      last_visit_time: new Date(item.lastVisitTime).toISOString()
    }));

    // Filter out invalid entries and group by domain
    const validData = exportData.filter(item => 
      item.url && 
      (item.url.startsWith('http://') || item.url.startsWith('https://'))
    );

    return {
      summary: {
        totalEntries: validData.length,
        timeRange: timeRange,
        exportDate: new Date().toISOString(),
        generatedBy: 'Browser History Map Exporter v1.0.0'
      },
      data: validData
    };
  } catch (error) {
    console.error('Error exporting history:', error);
    throw error;
  }
}

function extractDomainFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// Context menu integration (optional)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'exportCurrentSite',
    title: 'Add to History Map',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'exportCurrentSite') {
    // Add current site to a quick export list
    chrome.storage.local.get(['quickExportList'], (result) => {
      const list = result.quickExportList || [];
      const newEntry = {
        url: tab.url,
        title: tab.title,
        visit_count: 1,
        last_visit_time: new Date().toISOString()
      };
      
      // Avoid duplicates
      if (!list.some(item => item.url === newEntry.url)) {
        list.push(newEntry);
        chrome.storage.local.set({ quickExportList: list });
        
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Added to History Map',
          message: `${tab.title} added to your export list`
        });
      }
    });
  }
});
