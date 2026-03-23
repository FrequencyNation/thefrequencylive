import { supabase, checkRateLimitAtomic } from '../../src/lib/supabase.js';
import { 
    getClientIp, 
    sanitize, 
    validateEmail,
    validateContactPreference,
    formatWhatsApp,
    checkHoneypot,
    setCorsHeaders 
} from '../../src/lib/auth.js';
import { isIpBlocked } from '../../src/lib/rateLimiter.js';

export default async function handler(req, res) {
    if (setCorsHeaders(res, req)) return;
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const body = req.body;
        
        if (checkHoneypot(body)) {
            return res.status(200).json({ 
                success: true, 
                message: 'Testimony submitted for review' 
            });
        }
        
        const {
            submitter_name,
            email,
            phone,
            contact_preference,
            location,
            testimony_text,
            category,
            consent
        } = body;
        
        if (!submitter_name || submitter_name.length < 2) {
            return res.status(400).json({ error: 'Name is required' });
        }
        
        if (submitter_name.length > 100) {
            return res.status(400).json({ error: 'Name too long (max 100 characters)' });
        }
        
        if (!testimony_text || testimony_text.length < 20) {
            return res.status(400).json({ error: 'Testimony must be at least 20 characters' });
        }
        
        if (testimony_text.length > 5000) {
            return res.status(400).json({ error: 'Testimony too long (max 5000 characters)' });
        }
        
        if (!consent) {
            return res.status(400).json({ error: 'You must consent to sharing your testimony' });
        }
        
        if (email && !validateEmail(email)) {
            return res.status(400).json({ error: 'Invalid email address' });
        }
        
        if (contact_preference && !validateContactPreference(contact_preference)) {
            return res.status(400).json({ error: 'Invalid contact preference' });
        }
        
        const whatsappNumber = phone ? formatWhatsApp(phone) : null;
        const ip = getClientIp(req);
        
        const allowed = await checkRateLimitAtomic(ip, 'testimony', 3, 1);
        if (!allowed) {
            return res.status(429).json({ error: 'Too many submissions. Please try again later.' });
        }
        
        const blocked = await isIpBlocked(ip);
        if (blocked) {
            return res.status(403).json({ error: 'Your IP has been blocked.' });
        }
        
        const { data, error } = await supabase
            .from('testimonies')
            .insert({
                submitter_name: sanitize(submitter_name, 100),
                email: sanitize(email, 255),
                phone: sanitize(phone, 50),
                whatsapp_number: whatsappNumber,
                contact_preference: contact_preference || 'none',
                location: sanitize(location, 100),
                testimony_text: sanitize(testimony_text, 5000),
                category: category || 'Other',
                consent: true,
                status: 'pending',
                ip_address: ip,
                user_agent: sanitize(req.headers['user-agent'], 500)
            })
            .select()
            .single();
            
        if (error) throw error;
        
        return res.status(200).json({
            success: true,
            message: 'Testimony submitted for review'
        });
        
    } catch (error) {
        console.error('Submit testimony error:', error);
        return res.status(500).json({ error: 'Failed to submit testimony' });
    }
}