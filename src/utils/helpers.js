import { STRAPI_URL } from './constants';

// =========================================
// 3. HELPER FUNCTIONS
// =========================================
export const getImageUrl = (photoField) => {
    if (!photoField) return null;
    let photoData = photoField;
    if (photoData.data) photoData = photoData.data;
    if (photoData.attributes) photoData = photoData.attributes;

    if (!photoData || !photoData.url) return null;
    if (photoData.url.startsWith('http')) return photoData.url;
    return `${STRAPI_URL}${photoData.url}`;
};

export const formatCurrency = (amount, currencyCode) => {
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).format(amount);
    } catch { return `${currencyCode} ${amount}`; }
};

export const getSynopsisText = (synopsis) => {
    if (!synopsis) return '';
    if (typeof synopsis === 'string') return synopsis;
    if (Array.isArray(synopsis)) {
        return synopsis.map(block => block.children ? block.children.map(c => c.text).join(' ') : '').join(' ');
    }
    return '';
};

export const generateTicketCode = () => {
    const prefix = "TKT";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNum}`;
};

export const maskEmail = (email) => {
    if (!email) return '';
    const [name, domain] = email.split('@');
    const maskedName = name.length > 2 ? `${name.substring(0, 2)}***` : `${name[0]}***`;
    return `${maskedName}@${domain}`;
};

export const maskPhone = (phone) => {
    if (!phone) return '';
    return `*******${phone.slice(-4)}`;
};

export const formatTimeWithAMPM = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours));
    date.setMinutes(parseInt(minutes));
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};