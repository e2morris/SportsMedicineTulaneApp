# Quick Start - Going Live in 15 Minutes

This is the fastest path to get your appointment scheduler live and working.

## 🚀 3-Step Process

### 1. Set Up Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) → Sign up (free)
2. Create new project → Wait 2 minutes
3. Go to **SQL Editor** → Click "New query"
4. Copy/paste the contents of `supabase/migrations/002_simplified_schema.sql`
5. Click **"Run"**
6. Go to **Settings** → **API** → Copy:
   - Project URL (looks like `https://xxxxx.supabase.co`)
   - `anon` `public` key (long string starting with `eyJ...`)

### 2. Update Your Code (5 minutes)

**Update `index.html`** - Add before `</body>` tag, BEFORE `script.js`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  window.__SUPABASE_URL__ = 'YOUR_SUPABASE_URL_HERE';
  window.__SUPABASE_ANON_KEY__ = 'YOUR_SUPABASE_KEY_HERE';
</script>
<script src="database-adapter.js"></script>
<script src="script.js"></script>
```

**Update `script.js`** - Make contact form submission async:

Find the contact form submit handler (around line 636) and change:

```javascript
// OLD:
const appointments = getAppointments();
appointments.push(appointment);
saveAppointments(appointments);

// NEW:
const appointments = await getAppointments();
// Check for conflicts
const hasConflict = appointments.some(/* conflict check */);
if (hasConflict) {
  showGlobalError("Time slot already booked");
  return;
}
await addAppointment(appointment);
```

Also make the function async:
```javascript
contactForm.addEventListener("submit", async (e) => {
  // ... existing code ...
});
```

### 3. Deploy to Vercel (5 minutes)

1. Push to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # Create repo on GitHub, then:
   git remote add origin https://github.com/YOUR_USERNAME/tulane-sports-medicine.git
   git push -u origin main
   ```

2. Deploy:
   - Go to [vercel.com](https://vercel.com) → Sign up with GitHub
   - Click "Add New Project" → Import your repo
   - Framework: **Other**
   - Click **"Deploy"**

3. Add Environment Variables:
   - In Vercel project → **Settings** → **Environment Variables**
   - Add: `VITE_SUPABASE_URL` = Your Supabase URL
   - Add: `VITE_SUPABASE_ANON_KEY` = Your Supabase key
   - **Redeploy**

4. **Done!** Visit your Vercel URL and test booking an appointment.

---

## ✅ What Works Automatically

- ✅ Appointments save to cloud database
- ✅ Works from any device/browser
- ✅ No localStorage needed
- ✅ Data persists forever
- ✅ Conflict detection at database level
- ✅ Fallback to localStorage if Supabase unavailable

---

## 🆘 Common Issues

**"Supabase client not initialized"**
→ Check that Supabase URL and key are set correctly in the script tag

**Appointments not showing**
→ Check Supabase Dashboard → Table Editor → appointments_simple table

**"Time slot already booked" error**
→ This is good! It means conflict detection is working.

**Deployment failed**
→ Check Vercel build logs, ensure all files are in GitHub repo

---

## 📝 Next Steps (Optional)

1. **Add Authentication**: Password protect trainer dashboard
2. **Custom Domain**: Use `sports-medicine.tulane.edu` 
3. **Migrate Old Data**: Export from localStorage, import to Supabase
4. **Email Notifications**: Set up EmailJS production account

---

**Need detailed instructions?** See `DEPLOYMENT_GUIDE.md` and `CONVERSION_GUIDE.md`

