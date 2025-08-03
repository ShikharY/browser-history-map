// Content script for Browser History Map Exporter
// This script detects if the user is on the Browser History Map web app
// and can automatically import data from the extension

(function() {
  'use strict';

  // Check if we're on the Browser History Map web app
  const isHistoryMapApp = window.location.hostname.includes('github.io') && 
                         (window.location.pathname.includes('browser-history-map') || 
                          document.title.includes('Browser History Map'));

  if (isHistoryMapApp) {
    console.log('Browser History Map Exporter: Detected web app');
    
    // Wait for the page to fully load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeExtensionIntegration);
    } else {
      initializeExtensionIntegration();
    }
  }

  function initializeExtensionIntegration() {
    // Check if extension data is available
    chrome.storage.local.get(['historyMapData', 'dataTimestamp'], (result) => {
      if (result.historyMapData && result.dataTimestamp) {
        const dataAge = Date.now() - result.dataTimestamp;
        const maxAge = 5 * 60 * 1000; // 5 minutes
        
        if (dataAge < maxAge) {
          // Data is fresh, offer to import it
          showImportDialog(result.historyMapData);
        }
      }
    });

    // Add extension indicator
    addExtensionIndicator();
  }

  function showImportDialog(data) {
    // Create import dialog
    const dialog = document.createElement('div');
    dialog.className = 'extension-import-dialog';
    dialog.innerHTML = `
      <div class="import-dialog-content">
        <div class="import-header">
          <h3>🚀 Browser Extension Data Available</h3>
          <button class="close-dialog" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
        </div>
        <div class="import-body">
          <p>Your Browser History Map Exporter extension has prepared ${data.data.length} history entries for visualization.</p>
          <div class="import-stats">
            <div class="stat">
              <strong>${data.data.length}</strong>
              <span>History entries</span>
            </div>
            <div class="stat">
              <strong>${data.summary.timeRange}</strong>
              <span>Time range</span>
            </div>
          </div>
        </div>
        <div class="import-footer">
          <button id="importExtensionData" class="import-btn">📊 Import & Visualize</button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" class="cancel-btn">Maybe Later</button>
        </div>
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .extension-import-dialog {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        font-family: 'Poppins', sans-serif;
      }
      .import-dialog-content {
        background: white;
        border-radius: 15px;
        max-width: 450px;
        width: 90%;
        animation: slideIn 0.3s ease-out;
      }
      @keyframes slideIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .import-header {
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        padding: 20px;
        border-radius: 15px 15px 0 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .import-header h3 {
        margin: 0;
        font-size: 1.2rem;
      }
      .close-dialog {
        background: rgba(255,255,255,0.2);
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
      }
      .import-body {
        padding: 25px;
        text-align: center;
      }
      .import-stats {
        display: flex;
        justify-content: space-around;
        margin: 20px 0;
      }
      .stat {
        text-align: center;
      }
      .stat strong {
        display: block;
        font-size: 1.5rem;
        color: #667eea;
      }
      .stat span {
        font-size: 0.9rem;
        color: #666;
      }
      .import-footer {
        padding: 20px;
        border-top: 1px solid #eee;
        display: flex;
        gap: 10px;
        justify-content: center;
      }
      .import-btn {
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .import-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(40, 167, 69, 0.3);
      }
      .cancel-btn {
        background: #6c757d;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        cursor: pointer;
      }
    `;
    document.head.appendChild(style);

    // Add event listener for import button
    dialog.addEventListener('click', (e) => {
      if (e.target.id === 'importExtensionData') {
        importData(data);
        dialog.remove();
      }
    });

    document.body.appendChild(dialog);
  }

  function importData(data) {
    try {
      // Check if browserHistoryMap exists and use it
      if (window.browserHistoryMap && typeof window.browserHistoryMap.processHistoryData === 'function') {
        window.browserHistoryMap.processHistoryData(data.data);
        
        // Show success notification
        showNotification('✅ Successfully imported ' + data.data.length + ' history entries from extension!', 'success');
        
        // Clear the stored data
        chrome.storage.local.remove(['historyMapData', 'dataTimestamp']);
      } else {
        // Fallback: store data for manual import
        localStorage.setItem('extensionHistoryData', JSON.stringify(data));
        showNotification('📋 Data stored! Please refresh the page or use the "Load Extension Data" option.', 'info');
      }
    } catch (error) {
      console.error('Error importing extension data:', error);
      showNotification('❌ Error importing data: ' + error.message, 'error');
    }
  }

  function addExtensionIndicator() {
    // Add a small indicator that the extension is active
    const indicator = document.createElement('div');
    indicator.className = 'extension-indicator';
    indicator.innerHTML = '🔗 Extension Active';
    indicator.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      z-index: 9999;
      opacity: 0.8;
      transition: opacity 0.3s ease;
      font-family: 'Poppins', sans-serif;
    `;
    
    indicator.addEventListener('mouseenter', () => {
      indicator.style.opacity = '1';
    });
    
    indicator.addEventListener('mouseleave', () => {
      indicator.style.opacity = '0.8';
    });
    
    document.body.appendChild(indicator);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.opacity = '0';
        setTimeout(() => {
          if (indicator.parentNode) {
            indicator.remove();
          }
        }, 300);
      }
    }, 10000);
  }

  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `extension-notification notification-${type}`;
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

  // Listen for messages from extension
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'importData' && request.data) {
      importData(request.data);
      sendResponse({ success: true });
    }
  });

})();
