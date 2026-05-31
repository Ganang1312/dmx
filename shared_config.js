// CẤU HÌNH CHUNG CHO HỆ THỐNG DASHBOARD
const CONFIG = {
    AREA_ID: "78109", // CHỈ CẦN SỬA ID TẠI ĐÂY MỖI THÁNG
    STORE_ID: "3934",
    BASE_URL: "https://bi.thegioididong.com/sieu-thi-con"
};

// Khởi tạo theme ngay khi load script để tránh chớp màn hình (flash)
(function() {
    let savedTheme = 'light';
    try {
        savedTheme = localStorage.getItem('theme');
    } catch(e) {}
    
    if (!savedTheme) {
        try {
            if (window.name && window.name.startsWith("GAS_CACHE_STORE:")) {
                const jsonStr = window.name.substring("GAS_CACHE_STORE:".length);
                const data = JSON.parse(jsonStr);
                if (data._app_theme) savedTheme = data._app_theme;
            }
        } catch(e) {}
    }
    
    if (savedTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }
})();

// Hàm hỗ trợ mở link BI tự động theo cấu hình
function openBILink(tab, rt, autoRunMode) {
    const returnUrl = encodeURIComponent(window.location.href);
    const url = `${CONFIG.BASE_URL}?id=${CONFIG.AREA_ID}&tab=${tab}&rt=${rt}&dm=1&autoRun=${autoRunMode}&returnUrl=${returnUrl}`;
    window.open(url, '_blank');
}

// Bộ nhớ đệm dự phòng trong RAM nếu localStorage bị trình duyệt chặn (như khi chạy file://)
const memoryCache = {};

// Khôi phục cache từ window.name hoặc localStorage
(function initCache() {
    // Kiểm tra nếu URL có tham số fresh=true hoặc reload=true thì xóa cache ngay lập tức trước khi tải
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('fresh') === 'true' || urlParams.get('reload') === 'true') {
            // 1. Xóa cache trong localStorage
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key && key.startsWith('gas_cache_')) {
                    localStorage.removeItem(key);
                }
            }
            
            // 2. Xóa cache trong window.name
            if (window.name && window.name.startsWith("GAS_CACHE_STORE:")) {
                try {
                    const jsonStr = window.name.substring("GAS_CACHE_STORE:".length);
                    const data = JSON.parse(jsonStr);
                    const newData = {};
                    for (let k in data) {
                        if (!k.startsWith('gas_cache_')) {
                            newData[k] = data[k];
                        }
                    }
                    window.name = "GAS_CACHE_STORE:" + JSON.stringify(newData);
                } catch(e) {
                    window.name = "";
                }
            }
            
            // 3. Xóa các tham số khỏi URL mà không load lại trang
            urlParams.delete('fresh');
            urlParams.delete('reload');
            const newSearch = urlParams.toString();
            const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
            window.history.replaceState({}, '', newUrl);
            console.log("🧹 Đã phát hiện yêu cầu làm mới dữ liệu. Đã xóa cache thành công.");
        }
    } catch (e) {
        console.warn("Lỗi khi xử lý tham số làm mới URL:", e);
    }

    // 1. Thử đọc từ window.name
    try {
        if (window.name && window.name.startsWith("GAS_CACHE_STORE:")) {
            const jsonStr = window.name.substring("GAS_CACHE_STORE:".length);
            const data = JSON.parse(jsonStr);
            for (let k in data) {
                memoryCache[k] = data[k];
            }
            console.log("🎒 Đã khôi phục cache từ window.name:", Object.keys(memoryCache).length, "keys");
            return;
        }
    } catch (e) {
        console.warn("Không thể đọc cache từ window.name:", e);
    }

    // 2. Thử đọc từ localStorage nếu window.name trống
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('gas_cache_')) {
                memoryCache[key] = localStorage.getItem(key);
            }
        }
        console.log("🎒 Đã khôi phục cache từ localStorage:", Object.keys(memoryCache).length, "keys");
    } catch (e) {
        console.warn("Không thể đọc cache từ localStorage:", e);
    }
})();

function saveMemoryCacheToWindowName() {
    try {
        window.name = "GAS_CACHE_STORE:" + JSON.stringify(memoryCache);
    } catch (e) {
        console.error("Không thể ghi cache vào window.name:", e);
    }
}

const safeStorage = {
    getItem: function(key) {
        try {
            const localVal = localStorage.getItem(key);
            if (localVal !== null) return localVal;
        } catch (e) {}
        return memoryCache[key] || null;
    },
    setItem: function(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {}
        memoryCache[key] = value;
        saveMemoryCacheToWindowName();
    },
    removeItem: function(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {}
        delete memoryCache[key];
        saveMemoryCacheToWindowName();
    },
    getAllCacheKeys: function() {
        const keysSet = new Set();
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('gas_cache_')) {
                    keysSet.add(key);
                }
            }
        } catch (e) {}
        for (let key in memoryCache) {
            if (key.startsWith('gas_cache_')) {
                keysSet.add(key);
            }
        }
        return Array.from(keysSet);
    }
};

function clearGasCacheAndReload() {
    const keysToRemove = safeStorage.getAllCacheKeys();
    keysToRemove.forEach(key => safeStorage.removeItem(key));
    window.location.reload();
}

// BỘ ĐỆM DỮ LIỆU GOOGLE APPS SCRIPT (PERSISTENT LOCAL STORAGE CACHE LAYER)
(function() {
    const originalFetch = window.fetch;
    
    // Chuẩn hóa tham số 'sheets' để chia sẻ cache giữa các trang
    function normalizeGasUrl(urlStr) {
        try {
            const url = new URL(urlStr, window.location.href);
            const sheetsParam = url.searchParams.get('sheets');
            if (sheetsParam) {
                const sheets = sheetsParam.split(',')
                    .map(s => s.trim())
                    .filter(Boolean)
                    .sort();
                url.searchParams.set('sheets', sheets.join(','));
            }
            return url.toString();
        } catch (e) {
            return urlStr;
        }
    }

    window.fetch = async function(resource, options) {
        const urlString = typeof resource === 'string' ? resource : (resource instanceof URL ? resource.toString() : '');
        const method = (options && options.method) ? options.method.toUpperCase() : 'GET';

        // Chỉ cache các yêu cầu GET đến Apps Script Web App
        if (urlString.includes("script.google.com/macros/s/") && method === 'GET') {
            const normalizedUrl = normalizeGasUrl(urlString);
            const cacheKey = `gas_cache_${normalizedUrl}`;
            
            const cachedData = safeStorage.getItem(cacheKey);

            // Sử dụng dữ liệu lưu cục bộ vĩnh viễn cho đến khi nhấn Làm mới
            if (cachedData) {
                console.log("⚡ [Local Storage Hit] Sử dụng dữ liệu lưu cục bộ cho:", normalizedUrl);
                return new Response(cachedData, {
                    status: 200,
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-From-Cache': 'true'
                    }
                });
            }

            console.log("🌐 [Local Storage Miss] Tải dữ liệu mới từ Apps Script:", normalizedUrl);
            try {
                const response = await originalFetch(resource, options);
                if (response.ok) {
                    const clone = response.clone();
                    const text = await clone.text();
                    safeStorage.setItem(cacheKey, text);
                }
                return response;
            } catch (e) {
                throw e;
            }
        }

        return originalFetch(resource, options);
    };
})();

// Hàm chuyển theme dùng chung
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', targetTheme);
    try {
        localStorage.setItem('theme', targetTheme);
    } catch(e) {}
    
    memoryCache._app_theme = targetTheme;
    saveMemoryCacheToWindowName();
    
    // Cập nhật text/icon của nút theme trên UI
    const iconEl = document.getElementById('theme-icon');
    if (iconEl) iconEl.innerText = targetTheme === 'dark' ? '☀️' : '🌙';
    
    // Tự động cập nhật cấu hình mặc định cho ApexCharts
    if (typeof Apex !== 'undefined') {
        Apex.theme = { mode: targetTheme };
        Apex.chart = {
            foreColor: targetTheme === 'dark' ? '#9ca3af' : '#64748b',
            fontFamily: "'Inter', -apple-system, sans-serif"
        };
    } else if (window.Apex) {
        window.Apex.theme = { mode: targetTheme };
        window.Apex.chart = {
            foreColor: targetTheme === 'dark' ? '#9ca3af' : '#64748b',
            fontFamily: "'Inter', -apple-system, sans-serif"
        };
    }
    
    // Phát sự kiện để các trang redraw biểu đồ nếu cần
    window.dispatchEvent(new Event('themechanged'));
}

// Thiết lập cấu hình mặc định cho ApexCharts khi DOM sẵn sàng
window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const iconEl = document.getElementById('theme-icon');
    if (iconEl) {
        iconEl.innerText = savedTheme === 'dark' ? '☀️' : '🌙';
    }
    
    const chartSettings = {
        theme: { mode: savedTheme },
        chart: {
            foreColor: savedTheme === 'dark' ? '#9ca3af' : '#64748b',
            fontFamily: "'Inter', -apple-system, sans-serif"
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        plotOptions: {
            bar: {
                borderRadius: 6
            }
        }
    };
    
    if (typeof Apex !== 'undefined') {
        Object.assign(Apex, chartSettings);
    } else {
        window.Apex = chartSettings;
    }
});
