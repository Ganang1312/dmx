// CẤU HÌNH CHUNG CHO HỆ THỐNG DASHBOARD
const CONFIG = {
    AREA_ID: "78109", // CHỈ CẦN SỬA ID TẠI ĐÂY MỖI THÁNG
    STORE_ID: "3934",
    BASE_URL: "https://bi.thegioididong.com/sieu-thi-con"
};

// Hàm hỗ trợ mở link BI tự động theo cấu hình
function openBILink(tab, rt, autoRunMode) {
    const url = `${CONFIG.BASE_URL}?id=${CONFIG.AREA_ID}&tab=${tab}&rt=${rt}&dm=1&autoRun=${autoRunMode}`;
    window.open(url, '_blank');
}
