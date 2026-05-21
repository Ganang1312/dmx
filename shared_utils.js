// CÁC HÀM TIỆN ÍCH DÙNG CHUNG CHO HỆ THỐNG BÁO CÁO CỤM SAVICO

const parseVnNumber = (val) => {
  if (val == null || val === '') return 0;
  if (typeof val === 'number') {
      if (Math.abs(val) >= 1000000) return val / 1000000;
      return val;
  }
  let str = String(val).trim().replace(/\s/g, ''); 
  // Xử lý dấu phân cách hàng nghìn/thập phân kiểu VN
  if (str.includes(',') && str.includes('.')) {
      str = (str.lastIndexOf(',') > str.lastIndexOf('.')) ? str.replace(/\./g, '').replace(',', '.') : str.replace(/,/g, '');
  } else if (str.includes(',')) {
      let parts = str.split(',');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3 && parseInt(parts[0]) > 0)) {
          str = str.replace(/,/g, '');
      } else {
          str = str.replace(',', '.');
      }
  } else if (str.includes('.')) {
      if ((str.match(/\./g) || []).length > 1) {
          str = str.replace(/\./g, '');
      }
  }
  let num = parseFloat(str);
  if (isNaN(num)) return 0;
  if (Math.abs(num) >= 1000000) return num / 1000000;
  return num;
};

const formatMoney = (val) => {
    return Math.round(val).toLocaleString('vi-VN');
};

const formatPercent = (val) => {
    return (val * 100).toLocaleString('vi-VN', {minimumFractionDigits: 1, maximumFractionDigits: 1}) + '%';
};

const getKey = (obj, ...names) => {
    let keys = Object.keys(obj);
    for(let n of names){
        let m = keys.find(k => k.trim().toLowerCase() === n.toLowerCase());
        if(m) return obj[m];
    }
    return undefined;
};

const getColorClass = (percent) => {
    if (percent >= 1) return "#10b981"; 
    if (percent >= 0.8) return "#3b82f6"; 
    if (percent >= 0.5) return "#f59e0b"; 
    return "#ef4444"; 
};

function getEmoji(name) {
    let n = String(name).toUpperCase();
    if (n.includes("QUẠT")) return "🎐";
    if (n.includes("ĐIỆN TỬ") || n.includes("TIVI") || n.includes("SONY")) return "📺";
    if (n.includes("GIẶT") || n.includes("SẤY")) return "🧺";
    if (n.includes("PIN") || n.includes("SẠC")) return "🔋";
    if (n.includes("LAPTOP")) return "💻";
    if (n.includes("TỦ LẠNH") || n.includes("ĐÔNG") || n.includes("MÁT")) return "❄️";
    if (n.includes("KHÔNG KHÍ") || n.includes("MLKK")) return "🌀";
    if (n.includes("LỌC") || n.includes("NƯỚC") || n.includes("MLN")) return "🚰";
    if (n.includes("GIA DỤNG")) return "🍳";
    if (n.includes("ĐIỆN THOẠI") || n.includes("SMARTPHONE") || n.includes("PHONE") || n.includes("FLAGSHIP")) return "📱";
    if (n.includes("CAMERA")) return "📷";
    if (n.includes("MÁY LẠNH") || n.includes("ĐIỀU HÒA") || n.includes("LẠNH ĐẶC QUYỀN")) return "🌡️";
    if (n.includes("ĐỒNG HỒ") || n.includes("THỜI TRANG")) return "⌚";
    if (n.includes("BẢO HIỂM") || n.includes("FINANCE") || n.includes("CREDIT") || n.includes("VÍ") || n.includes("CAKE") || n.includes("HC")) return "💳";
    if (n.includes("SIM")) return "📶";
    if (n.includes("PHỤ KIỆN")) return "🎧";
    return "📦";
}

function downloadURI(uri, name) {
    let link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
