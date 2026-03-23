/* Auto-refresh logic for MMCP Dashboard */

(function() {
    let lastUpdate = null;
    const el = document.getElementById('last-updated');

    function updateTimestamp() {
        if (!lastUpdate || !el) return;
        const secs = Math.floor((Date.now() - lastUpdate) / 1000);
        if (secs < 60) el.textContent = secs + 's ago';
        else el.textContent = Math.floor(secs / 60) + 'm ago';
    }

    setInterval(updateTimestamp, 5000);

    // Health dot
    fetch('/api/v1/health')
        .then(r => r.json())
        .then(d => {
            const dot = document.getElementById('health-dot');
            if (dot && d.system_status) {
                dot.className = 'status-dot ' + d.system_status.toLowerCase();
            }
        })
        .catch(() => {});

    // Expose for pages
    window.setupAutoRefresh = function(url, intervalMs, callback) {
        function doFetch() {
            fetch(url)
                .then(r => r.json())
                .then(data => {
                    lastUpdate = Date.now();
                    callback(data);
                })
                .catch(err => console.warn('Refresh failed:', err));
        }

        // Only refresh when tab is visible
        let timer = setInterval(doFetch, intervalMs);
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                clearInterval(timer);
                timer = null;
            } else if (!timer) {
                doFetch();
                timer = setInterval(doFetch, intervalMs);
            }
        });
    };
})();
