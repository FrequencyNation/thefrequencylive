// ============================================
// COMPLETE AUTH & VALIDATION HELPERS
// ============================================

// Get client IP from request headers
export function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || '0.0.0.0';
}

// Sanitize input to prevent XSS
export function sanitize(str, maxLength = 1000) {
    if (!str) return null;
    let cleaned = str.replace(/<[^>]*>/g, '');
    cleaned = cleaned.trim();
    return cleaned.substring(0, maxLength);
}

// Validate email format
export function validateEmail(email) {
    if (!email) return true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate phone number
export function validatePhone(phone) {
    if (!phone) return true;
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
}

// Validate contact preference
const validPreferences = ['none', 'email', 'phone', 'whatsapp'];

export function validateContactPreference(preference) {
    if (!preference) return true;
    return validPreferences.includes(preference);
}

// Format phone for WhatsApp
export function formatWhatsApp(phone, defaultCountryCode = '234') {
    if (!phone) return null;
    let clean = phone.replace(/\D/g, '');
    
    if (clean.startsWith('0')) {
        clean = defaultCountryCode + clean.substring(1);
    }
    
    clean = clean.replace(/^\+/, '');
    return clean;
}

// Validate admin token
export function validateAdminToken(req) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    return token === process.env.ADMIN_SECRET;
}

// CORS helper
export function setCorsHeaders(res, req) {
    const allowedOrigins = [
        'https://thefrequencylive.org',
        'https://www.thefrequencylive.org',
        'http://localhost:3000',
        'http://localhost:3001',
        'https://thefrequencylive.vercel.app'
    ];
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV === 'development') {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return true;
    }
    return false;
}

// Honeypot check
export function checkHoneypot(body) {
    const honeypotFields = ['website', 'url', 'phone2', 'address', 'confirm_email', 'website2'];
    for (const field of honeypotFields) {
        if (body[field] && body[field].trim() !== '') {
            return true;
        }
    }
    return false;
}
