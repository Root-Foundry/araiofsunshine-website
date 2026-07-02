# Event Calendar & Sponsor Management System - Setup & Usage Guide

## 🎉 System Overview

Your website now has fully functional admin panels for managing:
- **Event calendar** - Add/edit/delete events that appear on the calendar
- **Sponsors** - Add/edit/delete sponsor logos and information
- **Secure admin login** - Firebase Authentication protects admin access
- **Real-time updates** - Changes appear instantly on the public website

---

## 🔐 **STEP 1: Create Admin Account**

You need to create an admin user in Firebase Authentication first.

### Option A: Firebase Console (Recommended)

1. Go to [Firebase Console](https://console.firebase.google.com/project/araiofsunshine/authentication/users)
2. Click **"Authentication"** in the left menu
3. Click **"Get Started"** (if first time)
4. Click **"Add user"** button
5. Enter:
   - **Email:** `admin@araiofsunshine.org` (or your preferred admin email)
   - **Password:** Create a strong password (save it securely!)
6. Click **"Add user"**

### Option B: Command Line

```bash
# Install Firebase tools if needed
npm install -g firebase-tools

# Create admin user (run this command and follow prompts)
firebase auth:import --project araiofsunshine admin-user.json
```

---

## 📅 **STEP 2: Using the Admin Panel**

### Access Admin Login

1. Go to: **https://araiofsunshine.web.app/admin-login**
2. Enter your admin email and password
3. Click **"Sign In"**

### Add a New Event

1. After logging in, you'll see the admin panel
2. Fill out the event form:
   - **Event Title** (required): e.g., "Monthly Support Group Meeting"
   - **Date** (required): Select from calendar picker
   - **Time** (optional): e.g., "3:00 PM"
   - **Location** (optional): e.g., "805 N. Jefferson Street, Monticello, FL"
   - **Description** (optional): Details about the event
3. Click **"Save Event"**
4. The event will appear immediately on the public calendar!

### Edit an Event

1. In the "Upcoming Events" list, click the **pencil icon** (✏️) next to any event
2. The form will populate with the event details
3. Make your changes
4. Click **"Update Event"**

### Delete an Event

1. In the "Upcoming Events" list, click the **trash icon** (🗑️) next to any event
2. Confirm the deletion
3. The event is removed from the database and calendar

### Managing Sponsors

Navigate to the Sponsors admin panel using the navigation bar at the top.

#### Add a New Sponsor

1. Fill out the sponsor form:
   - **Sponsor Name** (required): e.g., "Jefferson County Chamber of Commerce"
   - **Logo URL** (required): Direct link to the sponsor's logo image
     - As you type, a preview will appear below
     - Tip: Use an image hosting service like Imgur or link to their website logo
   - **Website** (optional): e.g., "https://jeffersoncountyfl.gov"
   - **Email** (optional): Contact email for the sponsor
   - **Phone** (optional): Contact phone number
   - **Description** (optional): Brief description of the sponsor
   - **Display Order** (required): Number to control display order (lower numbers appear first)
2. Click **"Add Sponsor"**
3. The sponsor appears in the list immediately!

#### Edit a Sponsor

1. In the "Current Sponsors" list, click the **pencil icon** (✏️) next to any sponsor
2. The form will populate with the sponsor details
3. Make your changes (logo preview updates in real-time)
4. Click **"Update Sponsor"**

#### Delete a Sponsor

1. In the "Current Sponsors" list, click the **trash icon** (🗑️) next to any sponsor
2. Confirm the deletion
3. The sponsor is removed from the database

---

## 🌐 **STEP 3: Viewing Events (Public)**

### Public Calendar

- **URL:** https://araiofsunshine.web.app/events
- Anyone can view the calendar without logging in
- Click on any event to see full details in a popup
- Switch between month view and list view using the buttons

### Features

- **Month View:** See all events in a monthly calendar layout
- **List View:** See events in a chronological list
- **Event Details:** Click any event to see description, time, and location
- **Responsive:** Works perfectly on mobile, tablet, and desktop

---

## 🛡️ **Security**

### What's Secure?

- ✅ Only authenticated admin users can add/edit/delete events
- ✅ Public visitors can **only read** events (cannot modify)
- ✅ Firebase handles all authentication securely
- ✅ API keys are safe to expose (they only work with your security rules)

### Admin Access

- Keep your admin password secure
- Never share admin login credentials
- Can create multiple admin accounts if needed

---

## 🔧 **Technical Details**

### Files Created

- **admin-login.html** - Admin login page
- **admin-events.html** - Admin panel for managing events
- **admin-sponsors.html** - Admin panel for managing sponsors
- **events.html** - Updated with interactive calendar
- **firestore.rules** - Database security rules (events + sponsors)
- **firestore.indexes.json** - Database indexes

### Technologies Used

- **FullCalendar** - Interactive calendar library
- **Firebase Authentication** - Secure admin login
- **Firebase Firestore** - Event database
- **Firebase Hosting** - Website hosting

### Database Structure

```
events (collection)
├── event1 (document)
│   ├── title: string
│   ├── date: string (YYYY-MM-DD)
│   ├── time: string (optional)
│   ├── location: string (optional)
│   └── description: string (optional)
├── event2 (document)
└── ...

sponsors (collection)
├── sponsor1 (document)
│   ├── name: string
│   ├── logoUrl: string
│   ├── website: string (optional)
│   ├── email: string (optional)
│   ├── phone: string (optional)
│   ├── description: string (optional)
│   └── order: number (display order)
├── sponsor2 (document)
└── ...
```

---

## 📱 **Quick Links**

- **Public Calendar:** https://araiofsunshine.web.app/events
- **Public Sponsors:** https://araiofsunshine.web.app/sponsors
- **Admin Login:** https://araiofsunshine.web.app/admin-login
- **Admin Events:** https://araiofsunshine.web.app/admin-events
- **Admin Sponsors:** https://araiofsunshine.web.app/admin-sponsors
- **Firebase Console:** https://console.firebase.google.com/project/araiofsunshine/overview
- **Firestore Database:** https://console.firebase.google.com/project/araiofsunshine/firestore
- **Authentication:** https://console.firebase.google.com/project/araiofsunshine/authentication/users

---

## ❓ **Troubleshooting**

### "Invalid email or password" error

- Make sure you've created the admin user in Firebase Console
- Check that you're using the correct email/password
- Email is case-sensitive

### Events not appearing on calendar

- Make sure you're logged in to the admin panel
- Check the Firebase Console to verify events are in the database
- Clear your browser cache and reload

### Can't access admin panel

- Verify you're using the correct URL: `/admin-login` (not `/admin-login.html`)
- Make sure Firebase Authentication is enabled in Firebase Console
- Check browser console for error messages (F12)

### Need help?

Contact the Root Foundry team for technical support!

---

## 🎯 **Next Steps**

1. ✅ Create your admin account in Firebase Console
2. ✅ Log in to the admin panel
3. ✅ Add your first events!
4. ✅ View them on the public calendar

Your event calendar system is ready to use! 🚀
