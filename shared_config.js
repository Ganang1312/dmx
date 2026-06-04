// CẤU HÌNH CHUNG CHO HỆ THỐNG DASHBOARD
const CONFIG = {
    AREA_ID: "78109", // CHỈ CẦN SỬA ID TẠI ĐÂY MỖI THÁNG
    STORE_ID: "3934",
    BASE_URL: "https://bi.thegioididong.com/sieu-thi-con"
};

// Tự động đồng bộ AREA_ID từ URL hoặc từ bộ nhớ lưu trữ (localStorage / window.name)
(function syncAreaId() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        let idParam = urlParams.get('id');
        
        if (idParam) {
            idParam = idParam.trim();
            CONFIG.AREA_ID = idParam;
            try { localStorage.setItem('gas_area_id', idParam); } catch(e) {}
            try {
                let wName = window.name || "";
                let cache = {};
                if (wName.startsWith("GAS_CACHE_STORE:")) {
                    cache = JSON.parse(wName.substring("GAS_CACHE_STORE:".length));
                }
                cache.gas_area_id = idParam;
                window.name = "GAS_CACHE_STORE:" + JSON.stringify(cache);
            } catch(e) {}
        } else {
            let savedId = null;
            try { savedId = localStorage.getItem('gas_area_id'); } catch(e) {}
            
            if (!savedId) {
                try {
                    let wName = window.name || "";
                    if (wName.startsWith("GAS_CACHE_STORE:")) {
                        const cache = JSON.parse(wName.substring("GAS_CACHE_STORE:".length));
                        if (cache.gas_area_id) savedId = cache.gas_area_id;
                    }
                } catch(e) {}
            }
            
            if (savedId) {
                CONFIG.AREA_ID = savedId.trim();
            }
        }
        console.log("📍 Cấu hình Area ID hiện tại:", CONFIG.AREA_ID);
    } catch(e) {
        console.warn("Lỗi khi đồng bộ AREA_ID:", e);
    }
})();

// Nghe message từ extension content script để cập nhật AREA_ID trực tiếp
window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SYNC_AREA_ID') {
        const newId = event.data.areaId;
        if (newId && newId !== "undefined" && newId !== "null") {
            CONFIG.AREA_ID = newId.trim();
            try { localStorage.setItem('gas_area_id', CONFIG.AREA_ID); } catch(e) {}
            try {
                let wName = window.name || "";
                let cache = {};
                if (wName.startsWith("GAS_CACHE_STORE:")) {
                    cache = JSON.parse(wName.substring("GAS_CACHE_STORE:".length));
                }
                cache.gas_area_id = CONFIG.AREA_ID;
                window.name = "GAS_CACHE_STORE:" + JSON.stringify(cache);
            } catch(e) {}
            console.log("⚡ Đã đồng bộ AREA_ID từ Extension:", CONFIG.AREA_ID);
        }
    }
});

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
    window.location.href = url;
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
            // Loại bỏ các tham số cache-buster/làm mới để đồng bộ hóa khóa cache cục bộ
            url.searchParams.delete('t');
            url.searchParams.delete('fresh');
            url.searchParams.delete('reload');
            
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

// Tự động inject CSS cho nút Copy Ảnh & Ẩn nút khi chụp
(function injectStyles() {
    const css = `
        .section-copy-btn {
            position: absolute;
            top: 15px;
            right: 15px;
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
            color: white;
            border: none;
            padding: 6px 12px;
            font-size: 13px;
            font-weight: 800;
            border-radius: 8px;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            z-index: 99;
            transition: all 0.2s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-family: 'Nunito', sans-serif;
        }
        .section-copy-btn:hover {
            opacity: 0.9;
            transform: translateY(-1px);
            box-shadow: 0 6px 12px rgba(14, 165, 233, 0.3);
        }
        .section-copy-btn:active {
            transform: translateY(1px);
        }
        [data-theme="dark"] .section-copy-btn {
            background: linear-gradient(135deg, #0ea5e9, #0284c7);
        }
        body.rendering-canvas .no-capture,
        body.rendering-canvas .section-copy-btn,
        body.rendering-canvas [data-html2canvas-ignore="true"] {
            display: none !important;
        }
    `;
    const style = document.createElement('style');
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
})();

// Hàm sao chép ảnh vào clipboard từ data URL
async function copyImageToClipboard(dataUrl) {
    try {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob
            })
        ]);
        return true;
    } catch (err) {
        console.error("Lỗi sao chép ảnh:", err);
        return false;
    }
}

// Hàm chụp và sao chép ảnh của một phần (section) chỉ định
async function copySectionImage(elementId, btnEl) {
    if (btnEl) {
        btnEl.disabled = true;
        btnEl.innerHTML = "⏳ Đang chụp...";
    }
    
    // Thêm class rendering-canvas để ẩn các nút và phần tử không cần thiết
    document.body.classList.add('rendering-canvas');
    
    // Ẩn tạm thời các nút copy và phần tử no-capture bằng style trực tiếp đề phòng CSS chưa render kịp
    const noCaps = document.querySelectorAll('.no-capture, .section-copy-btn, [data-html2canvas-ignore="true"]');
    const originalStyles = [];
    noCaps.forEach((el) => {
        originalStyles.push({ el: el, display: el.style.display });
        el.style.display = 'none';
    });
    
    let el = document.getElementById(elementId);
    if (!el && elementId.startsWith('.')) {
        el = document.querySelector(elementId);
    }
    if (!el) {
        console.error("Không tìm thấy element:", elementId);
        document.body.classList.remove('rendering-canvas');
        originalStyles.forEach(item => item.el.style.display = item.display);
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.innerHTML = "❌ Không tìm thấy";
        }
        return;
    }

    // Xử lý tiền xử lý đặc biệt cho các trường hợp cụ thể (ví dụ: baocao_nhanvien.html)
    let originalWidth = null;
    let restorePart3 = null;
    const isNhanVienPage = window.location.pathname.includes('baocao_nhanvien.html') || window.location.href.includes('baocao_nhanvien.html');
    
    if (isNhanVienPage && elementId === 'part1') {
        const tableScroll = el.querySelector('#thi-dua-tables-container > div');
        originalWidth = el.style.width;
        if (tableScroll) {
            const table = tableScroll.querySelector('table');
            if (table) {
                el.style.width = (table.offsetWidth + 60) + "px";
            }
        }
    } else if (isNhanVienPage && elementId === 'part3') {
        const grid = document.getElementById('performance-grid');
        if (grid) {
            const origPart3Width = el.style.width;
            const origGridDisplay = grid.style.display;
            const origGridTemplateColumns = grid.style.gridTemplateColumns;
            const origGridGap = grid.style.gap;
            const origGridWidth = grid.style.width;
            const origGridFlexDirection = grid.style.flexDirection;
            const cards = Array.from(grid.querySelectorAll('.perf-card'));
            const origCardStyles = cards.map(card => ({
                card: card,
                width: card.style.width,
                flex: card.style.flex
            }));
            
            let n = cards.length;
            let rowSizes = [];
            if (n <= 4) {
                rowSizes = [n];
            } else {
                let q = Math.floor(n / 4);
                let rem = n % 4;
                if (rem === 0) rowSizes = Array(q).fill(4);
                else if (rem === 3) rowSizes = Array(q).fill(4).concat([3]);
                else if (rem === 2) rowSizes = (q === 1) ? [3, 3] : Array(q).fill(4).concat([2]);
                else if (rem === 1) rowSizes = (q === 1) ? [3, 2] : (q === 2) ? [3, 3, 3] : Array(q - 2).fill(4).concat([3, 3, 3]);
            }
            
            grid.style.display = 'flex';
            grid.style.flexDirection = 'column';
            grid.style.gap = '15px';
            grid.style.width = '100%';
            
            let maxCardsInARow = Math.max(...rowSizes);
            let tempContainerWidth = maxCardsInARow * 470 + (maxCardsInARow - 1) * 15;
            el.style.width = tempContainerWidth + 'px';
            
            grid.innerHTML = '';
            let cardIdx = 0;
            rowSizes.forEach(size => {
                let rowContainer = document.createElement('div');
                rowContainer.style.display = 'flex';
                rowContainer.style.gap = '15px';
                rowContainer.style.justifyContent = 'center';
                rowContainer.style.width = '100%';
                for (let i = 0; i < size; i++) {
                    if (cardIdx < cards.length) {
                        let card = cards[cardIdx++];
                        card.style.width = '470px';
                        card.style.flex = '0 0 470px';
                        rowContainer.appendChild(card);
                    }
                }
                grid.appendChild(rowContainer);
            });
            
            restorePart3 = () => {
                grid.innerHTML = '';
                origCardStyles.forEach(item => {
                    item.card.style.width = item.width;
                    item.card.style.flex = item.flex;
                    grid.appendChild(item.card);
                });
                grid.style.display = origGridDisplay;
                grid.style.gridTemplateColumns = origGridTemplateColumns;
                grid.style.gap = origGridGap;
                grid.style.width = origGridWidth;
                grid.style.flexDirection = origGridFlexDirection;
                el.style.width = origPart3Width;
            };
        }
    }
    
    // Đợi 100ms để trình duyệt cập nhật lại layout trước khi render canvas
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        const activeTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const themeBg = activeTheme === 'dark' ? '#1e222b' : '#e9ecef';
        
        let dataUrl = await htmlToImage.toPng(el, {
            pixelRatio: 2.5,
            cacheBust: true,
            backgroundColor: themeBg
        });
        
        const success = await copyImageToClipboard(dataUrl);
        if (success) {
            if (btnEl) btnEl.innerHTML = "✅ Đã Copy Ảnh!";
        } else {
            if (btnEl) btnEl.innerHTML = "❌ Lỗi Copy";
            alert("Trình duyệt không hỗ trợ sao chép ảnh trực tiếp. Vui lòng cấp quyền clipboard.");
        }
    } catch (e) {
        console.error("Lỗi chụp ảnh:", e);
        if (btnEl) btnEl.innerHTML = "❌ Lỗi";
        alert("Lỗi khi chụp và sao chép ảnh: " + e.message);
    } finally {
        // Phục hồi lại layout ban đầu
        if (originalWidth !== null) {
            el.style.width = originalWidth;
        }
        if (restorePart3 !== null) {
            restorePart3();
        }
        
        // Hiện lại các phần tử bị ẩn
        document.body.classList.remove('rendering-canvas');
        originalStyles.forEach(item => {
            item.el.style.display = item.display;
        });
        
        if (btnEl) {
            setTimeout(() => {
                btnEl.disabled = false;
                btnEl.innerHTML = "📋 Copy Ảnh";
            }, 2000);
        }
    }
}
