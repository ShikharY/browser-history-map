// Popup script for Browser History Map Exporter
document.addEventListener('DOMContentLoaded', function() {
  const exportToFileBtn = document.getElementById('exportToFile');
  const sendToWebAppBtn = document.getElementById('sendToWebApp');
  const timeRangeSelect = document.getElementById('timeRange');
  const statusDiv = document.getElementById('status');
  const mainContent = document.getElementById('main-content');
  const loadingDiv = document.getElementById('loading');

  // Export to file functionality
  exportToFileBtn.addEventListener('click', async () => {
    const timeRange = timeRangeSelect.value;
    await exportHistoryToFile(timeRange);
  });

  // Send to web app functionality
  sendToWebAppBtn.addEventListener('click', async () => {
    const timeRange = timeRangeSelect.value;
    await sendHistoryToWebApp(timeRange);
  });

  async function exportHistoryToFile(timeRange) {
    try {
      showLoading(true);
      showStatus('Exporting your browsing history...', 'info');

      const response = await chrome.runtime.sendMessage({
        action: 'exportHistory',
        timeRange: timeRange
      });

      if (response.success) {
        // Create and download file
        const blob = new Blob([JSON.stringify(response.data, null, 2)], {
          type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const filename = `browser-history-${timeRange === 'all' ? 'all-time' : timeRange + 'days'}-${new Date().toISOString().split('T')[0]}.json`;
        
        // Use chrome.downloads API for better UX
        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: true
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            showStatus('Error downloading file: ' + chrome.runtime.lastError.message, 'error');
          } else {
            showStatus(`✅ Successfully exported ${response.data.data.length} history entries!`, 'success');
            
            // Add instructions
            setTimeout(() => {
              showStatus('📋 Upload the downloaded file to the Browser History Map web app to visualize your data.', 'info');
            }, 2000);
          }
          URL.revokeObjectURL(url);
        });
      } else {
        showStatus('❌ Error: ' + response.error, 'error');
      }
    } catch (error) {
      showStatus('❌ Unexpected error: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  async function sendHistoryToWebApp(timeRange) {
    try {
      showLoading(true);
      showStatus('Preparing data for web app...', 'info');

      const response = await chrome.runtime.sendMessage({
        action: 'exportHistory',
        timeRange: timeRange
      });

      if (response.success) {
        // Store data for the web app to access
        await chrome.storage.local.set({
          'historyMapData': response.data,
          'dataTimestamp': Date.now()
        });

        // Open web app
        await chrome.runtime.sendMessage({ action: 'openWebApp' });
        
        showStatus(`✅ Data prepared! Opening web app with ${response.data.data.length} entries...`, 'success');
        
        // Close popup after a delay
        setTimeout(() => {
          window.close();
        }, 1500);
      } else {
        showStatus('❌ Error: ' + response.error, 'error');
      }
    } catch (error) {
      showStatus('❌ Unexpected error: ' + error.message, 'error');
    } finally {
      showLoading(false);
    }
  }

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status status-${type}`;
    statusDiv.style.display = 'block';
  }

  function showLoading(show) {
    if (show) {
      mainContent.style.display = 'none';
      loadingDiv.style.display = 'block';
    } else {
      mainContent.style.display = 'block';
      loadingDiv.style.display = 'none';
    }
  }

  // Check if we have any quick export data
  chrome.storage.local.get(['quickExportList'], (result) => {
    if (result.quickExportList && result.quickExportList.length > 0) {
      const quickBtn = document.createElement('button');
      quickBtn.className = 'btn btn-secondary';
      quickBtn.innerHTML = '<span class="icon">⚡</span>Export Quick List (' + result.quickExportList.length + ')';
      quickBtn.addEventListener('click', () => exportQuickList());
      
      document.querySelector('.export-options').appendChild(quickBtn);
    }
  });

  async function exportQuickList() {
    try {
      const result = await chrome.storage.local.get(['quickExportList']);
      const quickList = result.quickExportList || [];
      
      if (quickList.length === 0) {
        showStatus('No sites in quick export list', 'info');
        return;
      }

      const exportData = {
        summary: {
          totalEntries: quickList.length,
          timeRange: 'quick-list',
          exportDate: new Date().toISOString(),
          generatedBy: 'Browser History Map Exporter v1.0.0 (Quick List)'
        },
        data: quickList
      };

      // Store for web app
      await chrome.storage.local.set({
        'historyMapData': exportData,
        'dataTimestamp': Date.now()
      });

      // Open web app
      await chrome.runtime.sendMessage({ action: 'openWebApp' });
      
      showStatus(`✅ Quick list exported! Opening web app with ${quickList.length} sites...`, 'success');
      
      setTimeout(() => {
        window.close();
      }, 1500);
    } catch (error) {
      showStatus('❌ Error exporting quick list: ' + error.message, 'error');
    }
  }
});
