# How to Deploy Your Website
## A Rai of Sunshine - Static Website Deployment Guide

---

## 🎉 Your Website is Ready!

You now have a fully functional, production-ready website built with HTML, CSS, and JavaScript. This guide will show you how to deploy it to the internet.

---

## 🚀 Best Deployment Options (FREE & EASY)

### Option 1: **Netlify** ⭐ EASIEST & RECOMMENDED

**Cost:** FREE  
**Time:** 5-10 minutes  
**Best For:** Instant deployment, automatic SSL, forms

#### Steps:

1. **Sign up for Netlify**
   - Go to https://www.netlify.com
   - Click "Sign up" (use GitHub, GitLab, Bitbucket, or email)

2. **Deploy Your Site**
   - **Method A: Drag & Drop (Easiest)**
     - On Netlify dashboard, drag your entire `rai` folder to the deployment area
     - Wait 30 seconds
     - Your site is live!
   
   - **Method B: Manual Upload**
     - Click "Add new site" > "Deploy manually"
     - Drag your `rai` folder
     - Done!

3. **Custom Domain** (Optional)
   - Click "Domain settings"
   - Add your custom domain (e.g., araiofsunshine.org)
   - Follow DNS instructions
   - SSL certificate automatically enabled

4. **Set Up Contact Forms**
   - Netlify includes form handling for FREE
   - Your contact form will automatically work
   - View submissions in Netlify dashboard

#### Netlify Advantages:
- ✅ Completely FREE for static sites
- ✅ Automatic SSL (HTTPS)
- ✅ Global CDN (fast loading worldwide)
- ✅ Form handling included
- ✅ Automatic deployments
- ✅ Custom domains
- ✅ No credit card required

---

### Option 2: **Vercel** 

**Cost:** FREE  
**Time:** 5-10 minutes  
**Best For:** Great performance, developer-friendly

#### Steps:

1. **Sign up for Vercel**
   - Go to https://vercel.com
   - Click "Sign up" (use GitHub, GitLab, or Bitbucket)

2. **Deploy**
   - Click "Add New Project"
   - Upload your `rai` folder
   - Click "Deploy"
   - Your site is live!

3. **Custom Domain**
   - Go to Project Settings > Domains
   - Add your custom domain
   - Follow DNS instructions

#### Vercel Advantages:
- ✅ FREE hosting
- ✅ Excellent performance
- ✅ Automatic SSL
- ✅ Global CDN
- ✅ Analytics included

---

### Option 3: **GitHub Pages**

**Cost:** FREE  
**Time:** 10-15 minutes  
**Best For:** Version control, open source

#### Steps:

1. **Create GitHub Account**
   - Go to https://github.com
   - Sign up for free account

2. **Create Repository**
   - Click "New repository"
   - Name it: `araiofsunshine-website`
   - Choose "Public"
   - Click "Create repository"

3. **Upload Files**
   - Click "uploading an existing file"
   - Drag all files from `rai` folder
   - Click "Commit changes"

4. **Enable GitHub Pages**
   - Go to Settings > Pages
   - Source: Deploy from a branch
   - Branch: main (or master)
   - Click "Save"
   - Wait 1-2 minutes
   - Your site will be at: `https://yourusername.github.io/araiofsunshine-website`

5. **Custom Domain** (Optional)
   - In Settings > Pages
   - Add custom domain
   - Update DNS settings

#### GitHub Pages Advantages:
- ✅ FREE hosting
- ✅ Version control built-in
- ✅ Easy updates via Git
- ✅ Reliable

---

## 💻 Option 4: Traditional Web Hosting

**Cost:** $3-10/month  
**Time:** 15-30 minutes  
**Best For:** Full control, email hosting

### Recommended Hosts:
- **Bluehost** - $2.95/month (non-profit discount available)
- **SiteGround** - $3.99/month (excellent support)
- **HostGator** - $2.75/month (budget-friendly)

#### Steps:

1. **Purchase Hosting Plan**
   - Sign up for shared hosting plan
   - Register domain or connect existing one

2. **Upload Files**
   - Log into cPanel or hosting control panel
   - Go to File Manager
   - Navigate to `public_html` folder
   - Upload all files from `rai` folder

3. **Test Your Site**
   - Visit your domain
   - Check all pages work
   - Test contact form

4. **Set Up Email** (if included)
   - Create email accounts in cPanel
   - Set up forwarding for forms

---

## 📧 Setting Up Contact Forms

Your contact forms need a backend service to receive submissions. Here are your options:

### Option 1: **Formspree** (Recommended - FREE)

1. Go to https://formspree.io
2. Sign up for free account
3. Create new form
4. Get your form endpoint
5. Update `contact.html` and `join.html` with the endpoint

**In script.js, replace the setTimeout with:**
```javascript
fetch('https://formspree.io/f/YOUR_FORM_ID', {
    method: 'POST',
    body: formData,
    headers: {
        'Accept': 'application/json'
    }
}).then(response => {
    if (response.ok) {
        messageDiv.textContent = 'Thank you for your message!';
        messageDiv.className = 'form-message success';
        contactForm.reset();
    }
});
```

### Option 2: **Basin** (FREE tier)
- https://usebasin.com
- Simple setup
- Email notifications
- Free for 100 submissions/month

### Option 3: **Netlify Forms** (If using Netlify)
- Automatically works
- Just add `netlify` attribute to forms
- View submissions in Netlify dashboard

### Option 4: **EmailJS** (FREE tier)
- https://www.emailjs.com
- Sends directly from browser
- Free for 200 emails/month

---

## 🔧 Customization Guide

### Adding Your Own Content:

#### 1. **Add Photos**
   - Place photos in the `pictures` folder (already exists)
   - Replace image placeholders in HTML files
   - Example:
     ```html
     <img src="pictures/community-meeting.jpg" alt="Community meeting">
     ```

#### 2. **Update Contact Information**
   - Edit all HTML files
   - Search for: "info@araiofsunshine.org"
   - Replace with actual email
   - Add phone number if desired

#### 3. **Update Social Media Links**
   - Find social media icons in footer
   - Replace `https://www.linkedin.com` with actual URLs
   - Same for Instagram and YouTube

#### 4. **Change Colors** (Optional)
   - Open `styles.css`
   - Find `:root` section (top of file)
   - Change color values:
     ```css
     --warm-orange: #FF8C42;  /* Change this */
     --sky-blue: #4A90E2;     /* Change this */
     ```

#### 5. **Add Your Logo**
   - Create logo image (PNG, 200x60px recommended)
   - Save as `logo.png` in main folder
   - Update header in all HTML files:
     ```html
     <div class="logo">
         <a href="index.html">
             <img src="logo.png" alt="A Rai of Sunshine logo" height="60">
         </a>
     </div>
     ```

---

## 📝 Content Updates

### To Update Text:
1. Open the HTML file in any text editor (Notepad, VS Code, etc.)
2. Find the text you want to change
3. Edit it directly
4. Save the file
5. Re-upload to your host (or push to GitHub)

### To Add New Pages:
1. Copy an existing HTML file
2. Rename it (e.g., `new-page.html`)
3. Update the content
4. Add link to navigation menu in all pages

---

## ✅ Pre-Launch Checklist

Before going live, check these items:

### Content:
- [ ] Replace placeholder text with actual content
- [ ] Add real photos to `pictures` folder
- [ ] Update all "Add photo here" placeholders
- [ ] Replace example email addresses
- [ ] Add social media links
- [ ] Check all spelling and grammar

### Functionality:
- [ ] Test all navigation links
- [ ] Submit test contact form
- [ ] Test donate button (Cash App link)
- [ ] Try newsletter signup
- [ ] Check mobile menu works
- [ ] Test on mobile device

### SEO & Performance:
- [ ] Add your logo (logo.png)
- [ ] Create favicon.png (16x16px icon)
- [ ] Compress all images
- [ ] Test loading speed
- [ ] Check all pages have proper titles

### Legal:
- [ ] Add Privacy Policy page (if needed)
- [ ] Update copyright year
- [ ] Verify 501(c)(3) status mentioned

---

## 🎨 Optional Enhancements

### Add Google Analytics:
1. Create Google Analytics account
2. Get tracking code
3. Add to all HTML files before `</head>`:
   ```html
   <!-- Google Analytics -->
   <script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'YOUR-ID');
   </script>
   ```

### Add Facebook Pixel (for ads):
1. Create Facebook Business account
2. Get pixel code
3. Add to all pages

### Add Live Chat:
Options:
- **Tawk.to** (FREE) - https://www.tawk.to
- **Tidio** (FREE tier) - https://www.tidio.com
- Just add their widget code to your pages

---

## 🆘 Troubleshooting

### Site not loading?
- Check DNS settings (can take 24-48 hours)
- Clear browser cache
- Try different browser
- Check hosting status

### Contact form not working?
- Verify form service (Formspree, Basin, etc.) is set up
- Check form endpoint URL
- Look for JavaScript console errors
- Test email delivery

### Images not showing?
- Check file paths are correct
- Verify images are in `pictures` folder
- Check file extensions (.jpg, .png)
- Ensure filenames match exactly (case-sensitive)

### Mobile menu not opening?
- Check JavaScript is loading
- View browser console for errors
- Clear cache and reload
- Test on different device

---

## 📊 Monitoring Your Site

### Track These Metrics:
- **Page views** - How many people visit
- **Bounce rate** - How many leave immediately
- **Top pages** - Which pages are most popular
- **Traffic sources** - Where visitors come from
- **Form submissions** - How many people contact you
- **Donation clicks** - How many click donate button

### Tools to Use:
- **Google Analytics** - FREE (web traffic)
- **Google Search Console** - FREE (SEO monitoring)
- **Netlify Analytics** - $9/month (if using Netlify)

---

## 🔄 Updating Your Site

### Using Netlify/Vercel:
1. Edit files locally
2. Drag updated files to deployment area
3. Site automatically updates

### Using GitHub Pages:
1. Edit files locally
2. Commit changes to GitHub
3. Push to repository
4. Site automatically updates

### Using Traditional Hosting:
1. Edit files locally
2. Use FTP client (FileZilla - FREE)
3. Upload changed files
4. Site updates immediately

---

## 💡 Pro Tips

1. **Backup Regularly**
   - Download complete copy of site monthly
   - Keep local backup of all files

2. **Test Before Deploying**
   - Open `index.html` locally in browser
   - Click through all links
   - Test forms

3. **Mobile First**
   - Always check how site looks on phone
   - Most visitors use mobile devices

4. **Keep It Simple**
   - Don't add features just because you can
   - Focus on user experience

5. **Update Content Regularly**
   - Add new photos monthly
   - Update event information
   - Share success stories

---

## 📞 Need Help?

### Resources:
- **Netlify Support**: https://www.netlify.com/support/
- **Vercel Support**: https://vercel.com/support
- **GitHub Docs**: https://docs.github.com
- **Web Dev Help**: https://stackoverflow.com

### For Website Design:
- Amy's Website Design Co.
- Email: amyswebsitedesignco@gmail.com
- Phone: (229) 690-8888

---

## 🎉 You're Ready to Launch!

### Quick Start (Netlify):
1. Go to https://netlify.com
2. Sign up (free)
3. Drag your `rai` folder to Netlify
4. Your site is LIVE in 30 seconds!

### Next Steps After Launch:
1. ✅ Test everything
2. ✅ Share with your team
3. ✅ Announce on social media
4. ✅ Update Google My Business
5. ✅ Tell your community!
6. ✅ **Celebrate!** 🎊

---

**Your new website is:**
- ✅ Fast and modern
- ✅ Mobile-responsive
- ✅ Accessibility-focused
- ✅ Easy to update
- ✅ FREE to host
- ✅ Ready to help families!

**Congratulations on your new website!** 🌞

---

**Created:** June 2026  
**For:** A Rai of Sunshine of North Florida Inc.  
**Version:** 1.0
