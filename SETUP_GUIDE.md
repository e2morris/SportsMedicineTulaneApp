# Setup Guide - AT Appointment Scheduler

## Quick Start

1. **Open the website**: Simply open `index.html` in your web browser
2. **Start booking**: Athletes can immediately start booking appointments
3. **View dashboard**: Click "Trainer Dashboard" to see all appointments

## Features Included

✅ **Appointment Booking**
- Simple form with name, email, phone
- Date and time range selection
- Appointment reason dropdown (New Injury, Rehab, etc.)
- Automatic conflict detection (no double-booking)

✅ **Trainer Dashboard**
- View all appointments
- Search by name, email, or phone
- Filter by date range and reason
- Statistics (total, upcoming, today)
- Delete appointments
- Export to CSV

✅ **Data Storage**
- All data stored in browser's localStorage
- No backend required
- Data persists between sessions

✅ **Email Reminders** (Optional - requires setup)
- 24-hour reminder emails
- 2-hour reminder emails
- Free email service (EmailJS)

---

## Setting Up Email Reminders (Optional but Recommended)

Email reminders are **optional**. The system works perfectly without them, but they make it much better!

### Step 1: Create EmailJS Account (Free)

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Sign up for a free account (200 emails/month free)
3. Verify your email address

### Step 2: Create Email Service

1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail recommended)
4. Follow the setup instructions
5. **Copy your Service ID** (you'll need this)

### Step 3: Create Email Template

1. Go to **Email Templates** in EmailJS
2. Click **Create New Template**
3. Use this template:

```
Subject: Athletic Training Appointment Reminder

Hello {{to_name}},

This is a reminder that you have an athletic training appointment scheduled:

Date: {{appointment_date}}
Time: {{appointment_time}}
Reason: {{appointment_reason}}

{{message}}

If you need to cancel or reschedule, please contact your athletic trainer.

Thank you!
```

4. **Copy your Template ID** (you'll need this)

### Step 4: Get Your Public Key

1. Go to **Account** → **General**
2. Find your **Public Key**
3. Copy it

### Step 5: Update script.js

Open `script.js` and find these lines (around line 2-3):

```javascript
// EmailJS.init("YOUR_PUBLIC_KEY"); // Uncomment and add your key
```

Replace with:

```javascript
EmailJS.init("YOUR_PUBLIC_KEY_HERE");
```

Then find the email sending function (around line 150) and update:

```javascript
await emailjs.send(
  "YOUR_SERVICE_ID",      // Replace with your Service ID
  "YOUR_TEMPLATE_ID",     // Replace with your Template ID
  templateParams
);
```

### Step 6: Test It!

1. Book a test appointment
2. Check your email (and the athlete's email if different)
3. Reminders will be sent automatically 24 hours and 2 hours before

---

## Data Management

### Exporting Data

1. Go to **Trainer Dashboard**
2. Click **Export to CSV**
3. File will download automatically
4. Open in Excel or Google Sheets

### Backing Up Data

Since data is stored in browser localStorage:

**Option 1: Regular Exports**
- Export to CSV weekly/monthly
- Keep backups in a safe place

**Option 2: Multiple Browsers**
- Data is stored per browser
- Consider using a dedicated browser/computer for the trainer

**Option 3: Future Enhancement**
- Could add cloud sync (Google Sheets, etc.)
- Could add database backend

### Clearing Data

If you need to clear all appointments:
1. Open browser console (F12)
2. Type: `localStorage.removeItem('at_appointments')`
3. Press Enter
4. Refresh the page

---

## Customization

### Change Appointment Reasons

Edit `index.html`, find the `<select id="appointment-reason">` section and modify the options:

```html
<option value="new-injury">New Injury</option>
<option value="rehab">Rehabilitation</option>
<!-- Add more options here -->
```

Then update the `getReasonLabel()` function in `script.js` to match.

### Change Colors

Edit `styles.css`, find the `:root` section at the top:

```css
:root {
    --primary-color: #6366f1;  /* Change this */
    --secondary-color: #8b5cf6; /* Change this */
    /* ... */
}
```

### Change Logo/Title

Edit `index.html`, find:
```html
<div class="logo">AT Scheduler</div>
```

Change to your school/trainer name.

---

## Browser Compatibility

Works on:
- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

**Note**: Data is stored per browser. If you use Chrome at school and Firefox at home, they won't share data.

---

## Troubleshooting

### Appointments Not Saving
- Check browser console for errors (F12)
- Make sure JavaScript is enabled
- Try a different browser

### Email Reminders Not Working
- Check EmailJS setup (see above)
- Check browser console for errors
- Verify EmailJS account is active
- Check spam folder

### Can't See Dashboard
- Make sure you're clicking "Trainer Dashboard" in navigation
- Check browser console for errors

### Data Lost After Clearing Browser
- localStorage is cleared when you clear browser data
- Always export to CSV regularly as backup
- Consider using a dedicated browser profile

---

## Future Enhancements (Optional)

Ideas for future improvements:

1. **Cloud Storage**: Sync with Google Sheets or database
2. **SMS Reminders**: Add text message reminders (requires paid service)
3. **Recurring Appointments**: Weekly treatment sessions
4. **Athlete Login**: Athletes can view/edit their own appointments
5. **Calendar Integration**: Export to Google Calendar
6. **Multi-Trainer**: Support multiple trainers
7. **Reporting**: Advanced statistics and reports

---

## Support

If you need help:
1. Check this guide first
2. Check browser console for errors (F12)
3. Make sure all files are in the same folder
4. Try a different browser

---

## Privacy Note

- All data is stored locally in the browser
- No data is sent to external servers (except EmailJS if configured)
- EmailJS only sends reminder emails, doesn't store appointment data
- For sensitive medical information, consider additional security measures

---

**Enjoy your new appointment scheduling system! 🎉**

