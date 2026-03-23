# 🌍 The Frequency Live

**Final Authority | The Excellency of God**

A global prayer and discipleship platform designed to receive prayer requests, share testimonies, enable follow-up via phone/email/WhatsApp, and distribute digital spiritual resources.

---

## 🚀 Deployment Guide (Free Tier)

### Architecture
- **Frontend**: Static HTML (Vercel)
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **Automation**: GitHub Actions + Vercel Cron

---

## 📁 Project Structure

---

## 🔐 Security Configuration

### Admin Access
**⚠️ IMPORTANT**: Admin panel is located at `/freqnation77` (not `/admin`)

The previous `/admin` route returns 404 as a security measure against automated scanning.

**Access Credentials**:
- URL: `https://yourdomain.com/freqnation77`
- Secret: Set in environment variables as `ADMIN_SECRET`

### Environment Variables

Create `.env` locally or set in Vercel Dashboard:

```env
# Supabase (Required)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Admin Security (Required)
ADMIN_SECRET=your-secure-random-string-min-32-chars
CRON_SECRET=another-secure-random-string-for-cron

# Site Configuration
SITE_URL=https://thefrequencylive.org
