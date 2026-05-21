// CẤU HÌNH CHUNG CHO HỆ THỐNG DASHBOARD
const CONFIG = {
    AREA_ID: "78109", // CHỈ CẦN SỬA ID TẠI ĐÂY MỖI THÁNG
    STORE_ID: "3934",
    BASE_URL: "https://bi.thegioididong.com/sieu-thi-con"
};

// Hàm hỗ trợ mở link BI tự động theo cấu hình
function openBILink(tab, rt, autoRunMode) {
    let parentUrl = window.location.href;
    try {
        if (window.parent && window.parent.location) {
            parentUrl = window.parent.location.href;
        }
    } catch(e) {}
    
    // Tìm đường dẫn thư mục hiện tại để chuyển đến dashboard.html
    let base = parentUrl.split('?')[0].split('#')[0];
    let dir = base.substring(0, base.lastIndexOf('/'));
    let dashboardUrl = dir + "/dashboard.html";
    
    // Tùy theo autoRunMode để quyết định tab đích
    let targetTab = "realtime";
    if (autoRunMode.includes("luyke")) targetTab = "luyke";
    else if (autoRunMode.includes("nhanvien")) targetTab = "nhanvien";
    
    let redirect = `${dashboardUrl}?tab=${targetTab}`;
    if (autoRunMode.endsWith("_auto")) {
        redirect += "&auto=true";
    }
    
    const url = `${CONFIG.BASE_URL}?id=${CONFIG.AREA_ID}&tab=${tab}&rt=${rt}&dm=1&autoRun=${autoRunMode}&redirect=${encodeURIComponent(redirect)}`;
    window.open(url, '_blank');
}
