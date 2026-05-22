# Deployment Guide - Making Your Appointment Scheduler Live

This guide will help you deploy your appointment scheduler so it works independently, accessible to anyone, with persistent data storage.

## 🎯 What We'll Do

1. **Set up Supabase** (database) - Store appointments in the cloud
2. **Deploy to Vercel** (hosting) - Make it accessible online
3. **Update code** - Connect to database instead of localStorage
4. **Configure environment** - Set up secure API keys

---

## Step 1: Set Up Supabase (Database)

### 1.1 Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click **"Start your project"** (Free tier is perfect)
3. Sign up with GitHub (recommended) or email
4. Create a new project:
   - **Name**: `tulane-sports-medicine` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to you (US East recommended)
   - Wait ~2 minutes for project setup

### 1.2 Run Database Migration
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy and paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

### 1.3 Get Your API Keys
1. Go to **Settings** → **API** in Supabase dashboard
2. You'll need:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - Save these for Step 3!

---

## Step 2: Deploy to Vercel (Hosting)

### 2.1 Prepare for Deployment
1. Create a GitHub account if you don't have one: [github.com](https://github.com)
2. Install Git if needed: [git-scm.com](https://git-scm.com)

### 2.2 Push to GitHub
Open Terminal/Command Prompt in your project folder:

```bash
cd /Users/emmamorris/Desktop/AT

# Initialize Git repository
git init

# Create .gitignore file
echo "node_modules/
.env
.env.local
.DS_Store" > .gitignore

# Add all files
git add .

# Commit
git commit -m "Initial commit - Tulane Sports Medicine Scheduler"

# Create repository on GitHub, then:
# (Replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/tulane-sports-medicine.git
git branch -M main
git push -u origin main
```

### 2.3 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click **"Add New Project"**
4. Import your repository: `tulane-sports-medicine`
5. Configure:
   - **Framework Preset**: Other
   - **Root Directory**: `./`
   - **Build Command**: (leave empty)
   - **Output Directory**: `./`
6. Click **"Deploy"**

### 2.4 Add Environment Variables
In Vercel project settings:
1. Go to **Settings** → **Environment Variables**
2. Add:
   - `VITE_SUPABASE_URL` = Your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key
3. Redeploy (Vercel will do this automatically)

---

## Step 3: Update Code for Database

### 3.1 Update HTML

Add Supabase SDK and database adapter to `index.html`:

```html
<!-- Add before closing </body> tag, BEFORE script.js -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  // Set your Supabase credentials here (or use environment variables)
  window.__SUPABASE_URL__ = 'https://your-project-id.supabase.co';
  window.__SUPABASE_ANON_KEY__ = 'your-anon-key-here';
</script>
<script src="database-adapter.js"></script>
<script src="script.js"></script>
```

### 3.2 Run Database Migration

1. In Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/002_simplified_schema.sql`
3. Paste and click "Run"

### 3.3 Update script.js Functions

See `CONVERSION_GUIDE.md` for detailed instructions. Main changes:

- Make functions `async` where they use database
- Replace `getAppointments()` with `await getAppointments()`
- Replace `saveAppointments()` with `await addAppointment()` or `await updateAppointment()`
- Update contact form submission to use `await addAppointment()`

---

## Step 4: Test & Share

1. **Test the live site**: Visit your Vercel URL (e.g., `tulane-sports-medicine.vercel.app`)
2. **Book a test appointment** to verify database works
3. **Share the URL** with athletes and trainers!

---

## 🎉 What You Get

✅ **Live URL** - Accessible from anywhere  
✅ **Persistent Storage** - Data saved in cloud database  
✅ **Multi-user** - Works for all athletes/trainers  
✅ **Automatic Backups** - Database handles it  
✅ **Free Hosting** - Vercel free tier is generous  
✅ **Free Database** - Supabase free tier (500MB database)  

---

## 🔒 Security Notes

- The `anon` key is safe to use in frontend code (has Row Level Security)
- Trainer dashboard can be password-protected (we'll add this)
- All data is encrypted in transit (HTTPS)
- Supabase provides automatic backups

---

## 💰 Cost

**FREE** for your use case:
- Vercel: Free tier includes 100GB bandwidth/month
- Supabase: Free tier includes 500MB database, 2GB file storage
- Both are more than enough for a sports medicine scheduler!

---

## 🆘 Troubleshooting

**Issue**: Can't connect to database
- Check environment variables are set correctly in Vercel
- Verify Supabase project is active
- Check browser console for errors

**Issue**: Appointments not saving
- Check Supabase logs: Dashboard → Logs → API Logs
- Verify RLS policies are set correctly
- Check network tab in browser dev tools

**Issue**: Deployment failed
- Check Vercel build logs
- Ensure all files are committed to GitHub
- Verify no syntax errors in code

---

## 📚 Next Steps

1. **Add Authentication** (optional): Secure trainer dashboard with password
2. **Custom Domain** (optional): Use `sports-medicine.tulane.edu` instead of Vercel URL
3. **Email Notifications**: Configure EmailJS with production settings
4. **Backup Strategy**: Set up automatic CSV exports (daily/weekly)

---

**Need Help?** Check Supabase docs: [supabase.com/docs](https://supabase.com/docs)  
**Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)

