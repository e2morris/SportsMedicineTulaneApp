# Code Conversion Guide - localStorage to Supabase

This guide shows exactly how to update your code to use Supabase instead of localStorage.

## Quick Start (Simplified Approach)

### Option 1: Use the Simplified Schema (Easiest)

This uses a simple table structure that matches your current data format.

### Step 1: Run Simplified Migration in Supabase

1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste `supabase/migrations/002_simplified_schema.sql`
3. Click "Run"

### Step 2: Update index.html

Add these scripts BEFORE your existing `script.js`:

```html
<!-- Add before closing </body> tag, BEFORE script.js -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script>
  // Set Supabase credentials (from environment or hardcode for testing)
  window.__SUPABASE_URL__ = 'YOUR_SUPABASE_URL';
  window.__SUPABASE_ANON_KEY__ = 'YOUR_SUPABASE_ANON_KEY';
</script>
<script src="database-adapter.js"></script>
<script src="script.js"></script>
```

### Step 3: Update script.js

Replace these functions in your `script.js`:

**Find this:**
```javascript
// Get appointments from localStorage
function getAppointments() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// Save appointments to localStorage
function saveAppointments(appointments) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
}
```

**Replace with:**
```javascript
// Use async versions from database-adapter.js
// These will automatically use Supabase if available, localStorage as fallback
```

Then update all calls to use async/await:

**Find:**
```javascript
const appointments = getAppointments();
```

**Replace with:**
```javascript
const appointments = await getAppointments();
```

**Find:**
```javascript
saveAppointments(appointments);
```

**Replace with:**
```javascript
await saveAppointments(appointments);
```

---

## Detailed Conversion Steps

### Functions That Need to Be Async

1. `getAppointments()` → `await getAppointments()`
2. `saveAppointments(appointments)` → `await saveAppointments(appointments)`
3. All places that call these functions

### Example Conversion

**Before:**
```javascript
function deleteAppointment(id) {
  const appointments = getAppointments();
  const filtered = appointments.filter((apt) => apt.id !== id);
  saveAppointments(filtered);
  displayDashboard();
}
```

**After:**
```javascript
async function deleteAppointment(id) {
  const appointments = await getAppointments();
  const filtered = appointments.filter((apt) => apt.id !== id);
  await saveAppointments(filtered);
  await displayDashboard();
}
```

### Key Functions to Update

1. **Contact Form Submission** (line ~636)
   - Make async
   - Use `await getAppointments()`
   - Use `await addAppointment(appointment)` instead of push + save

2. **Display Dashboard** (line ~1208)
   - Make async
   - Use `await getAppointments()`

3. **Delete Appointment** (line ~1361)
   - Make async
   - Use `await deleteAppointment(id)` from adapter

4. **Cancel Appointment** (line ~1422)
   - Make async
   - Use `await updateAppointment(id, { status: 'canceled' })`

5. **Get Booked Time Slots** (line ~703)
   - Make async
   - Use `await getAppointments()`

---

## Testing

After conversion:

1. **Test locally first:**
   - Open `index.html` in browser
   - Check console for errors
   - Try booking an appointment
   - Check Supabase dashboard → Table Editor → appointments_simple

2. **Test deployment:**
   - Deploy to Vercel
   - Test booking from live URL
   - Verify data appears in Supabase

---

## Troubleshooting

**Error: "getAppointments is not a function"**
- Make sure `database-adapter.js` is loaded before `script.js`
- Check browser console for loading errors

**Error: "Supabase client not initialized"**
- Verify Supabase URL and key are set correctly
- Check that Supabase SDK script is loaded

**Appointments not saving:**
- Check Supabase dashboard → Logs → API Logs
- Verify RLS policies are set correctly
- Check browser console for error messages

**"Time slot is already booked" error:**
- This is the conflict detection working!
- The trigger prevents double-booking at database level

---

## Next Steps After Conversion

1. **Add Authentication** (optional): Secure trainer dashboard
2. **Migrate Existing Data**: Export from localStorage, import to Supabase
3. **Add Email Notifications**: Use Supabase Edge Functions or keep EmailJS
4. **Set Up Backups**: Supabase has automatic backups, but export CSV regularly

