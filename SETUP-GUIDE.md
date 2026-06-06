# Website Setup & Customization Guide
## A Rai of Sunshine of North Florida Inc.

---

## 📁 Project Structure

```
rai/
├── index.html              # Homepage
├── about.html              # About/Story page
├── services.html           # Services overview
├── contact.html            # Contact form
├── donate.html             # Donation page
├── join.html               # Membership application
├── resources.html          # Resources for families
├── events.html             # Events & gallery
├── styles.css              # All styling
├── script.js               # Interactive functionality
├── pictures/               # Image folder
├── DEPLOYMENT-GUIDE.md     # How to deploy site
└── SETUP-GUIDE.md          # This file
```

---

## 🎨 Design System

### Colors Used:
```css
Primary Orange:   #FF8C42  (warm, welcoming)
Secondary Blue:   #4A90E2  (trust, calm)
Accent Gold:      #FFD700  (sunshine, hope)
Text Dark:        #333333  (readable)
Light Background: #FFF9E6  (soft cream)
```

### Typography:
- **Headings:** Montserrat (weights: 600, 700)
- **Body:** Open Sans (weights: 400, 500, 600, 700)
- **Base Size:** 16-18px for accessibility

### Buttons:
- **Primary:** Orange background, white text
- **Secondary:** White background, orange border
- **Donate:** Gold background (stands out)

---

## 🔧 Quick Customization

### 1. Change Organization Name
**Find & Replace in ALL files:**
- Find: `A Rai of Sunshine of North Florida Inc.`
- Replace: `[Your Organization Name]`

### 2. Update Contact Info
**Edit these in ALL HTML files:**
- Email: `info@araiofsunshine.org`
- Location: `Jefferson County, FL`
- Phone: (add if needed)

### 3. Change Cash App Handle
**In donate.html:**
- Find: `$Araiofsunshine2008`
- Replace with your Cash App handle

### 4. Update Social Media
**In footer of ALL HTML files:**
```html
<a href="https://www.linkedin.com" target="_blank">LinkedIn</a>
<a href="https://www.instagram.com" target="_blank">Instagram</a>
<a href="https://www.youtube.com" target="_blank">YouTube</a>
```
Replace URLs with your actual social media profiles.

### 5. Add Your Logo
**Create logo.png (200x60px recommended) and in all HTML headers:**
```html
<div class="logo">
    <a href="index.html">
        <img src="logo.png" alt="Your Organization" height="60">
    </a>
</div>
```

---

## 📝 Content Management

### Editing Text Content:

1. **Homepage (index.html)**
   - Hero heading & subtitle
   - Mission statement
   - Service cards (3)
   - Testimonials
   - Impact statistics
   - Call-to-action sections

2. **About Page (about.html)**
   - Organization story
   - Why you started
   - Values (3 cards)
   - Testimonials

3. **Services Page (services.html)**
   - Main services (3)
   - Additional programs (4)
   - Who you serve

4. **Resources Page (resources.html)**
   - State resources links
   - Federal resources links
   - Local resources
   - Downloadable guides

5. **Events Page (events.html)**
   - Upcoming events
   - Monthly meeting details
   - Photo gallery
   - Event space rental info

6. **Contact Page (contact.html)**
   - Contact information
   - Form fields
   - Response expectations

7. **Join Page (join.html)**
   - Membership benefits
   - Volunteer opportunities
   - Application form

8. **Donate Page (donate.html)**
   - Giving levels
   - Payment methods
   - Tax information
   - Impact stories

---

## 🖼️ Adding Images

### Where to Add Photos:

1. **Homepage Hero** (index.html):
   ```css
   /* In styles.css, find .hero section */
   background-image: url('pictures/hero-bg.jpg');
   ```

2. **About Page** (about.html):
   - Founder photo
   - Team photos
   - Community photos

3. **Services Page** (services.html):
   - Service photos
   - Program photos

4. **Events Gallery** (events.html):
   - Replace placeholder gallery items:
   ```html
   <div class="gallery-item">
       <img src="pictures/event-1.jpg" alt="Community meeting">
   </div>
   ```

5. **Resources Page** (resources.html):
   - Book cover ("Heaven Sent Me Kevin")
   - Resource materials

### Image Guidelines:
- **File format:** JPG or PNG
- **Hero images:** 1920x1080px
- **Gallery photos:** 800x600px
- **Portraits:** 400x400px (square)
- **Compress before uploading** (use TinyPNG.com)
- **Name descriptively:** `community-meeting-jan-2026.jpg`

---

## 🎯 Navigation Menu

Current menu structure (appears on all pages):
1. About
2. Services
3. Get Involved
4. Resources
5. Contact
6. DONATE NOW (button)

### To Add a New Page:
1. Create new HTML file (copy existing page as template)
2. Add link to navigation in ALL pages:
```html
<nav class="nav-desktop">
    <a href="about.html" class="nav-link">About</a>
    <a href="services.html" class="nav-link">Services</a>
    <a href="join.html" class="nav-link">Get Involved</a>
    <a href="resources.html" class="nav-link">Resources</a>
    <a href="NEW-PAGE.html" class="nav-link">New Page</a> <!-- ADD THIS -->
    <a href="contact.html" class="nav-link">Contact</a>
</nav>
```
3. Also add to mobile navigation
4. Add to footer if relevant

---

## 📧 Form Configuration

### Contact Form (contact.html)

**Current setup:** Simulated submission (for demo)

**To make it work:**

#### Option 1: Formspree (Easiest)
1. Sign up at https://formspree.io
2. Create new form
3. Get form endpoint
4. In `script.js`, replace contact form handler:

```javascript
contactForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const formData = new FormData(this);
    
    fetch('https://formspree.io/f/YOUR_FORM_ID', {
        method: 'POST',
        body: formData,
        headers: {'Accept': 'application/json'}
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('contactMessage').textContent = 
            'Thank you! We will respond within 24-48 hours.';
        document.getElementById('contactMessage').className = 
            'form-message success';
        document.getElementById('contactMessage').style.display = 'block';
        this.reset();
    })
    .catch(error => {
        document.getElementById('contactMessage').textContent = 
            'Oops! There was a problem. Please try again.';
        document.getElementById('contactMessage').className = 
            'form-message error';
        document.getElementById('contactMessage').style.display = 'block';
    });
});
```

#### Option 2: Netlify Forms (If using Netlify)
1. Add `netlify` attribute to form tag:
```html
<form class="contact-form" id="contactForm" name="contact" netlify>
```
2. Add hidden input:
```html
<input type="hidden" name="form-name" value="contact">
```
3. That's it! Netlify handles the rest.

#### Option 3: EmailJS
1. Sign up at https://www.emailjs.com
2. Create email template
3. Add EmailJS SDK to HTML
4. Configure in script.js

### Newsletter Form
Same process as contact form - choose one service above.

### Membership Form (join.html)
Same process - currently simulated, needs backend integration.

---

## 🎨 Styling Customization

### Change Colors:
Open `styles.css` and edit the `:root` section:
```css
:root {
    /* Primary Colors */
    --warm-orange: #FF8C42;    /* Change this */
    --sky-blue: #4A90E2;       /* Change this */
    --sunshine-gold: #FFD700;  /* Change this */
    
    /* Text Colors */
    --text-dark: #333333;
    --medium-gray: #666666;
    --light-gray: #999999;
    
    /* Background Colors */
    --white: #FFFFFF;
    --light-cream: #FFF9E6;    /* Change this */
    
    /* Spacing (adjust for tighter/looser design) */
    --spacing-xs: 8px;
    --spacing-sm: 16px;
    --spacing-md: 24px;
    --spacing-lg: 32px;
    --spacing-xl: 48px;
    --spacing-xxl: 64px;
}
```

### Change Fonts:
1. Choose fonts from Google Fonts: https://fonts.google.com
2. Update in HTML `<head>` of all pages:
```html
<link href="https://fonts.googleapis.com/css2?family=YOUR-FONT:wght@400;600;700&display=swap" rel="stylesheet">
```
3. Update in `styles.css`:
```css
--font-primary: 'YOUR-FONT', sans-serif;
```

### Adjust Button Styles:
In `styles.css`, find `.btn-primary` and `.btn-secondary` classes:
```css
.btn-primary {
    border-radius: 8px;         /* Adjust roundness */
    padding: 14px 32px;         /* Adjust size */
    font-size: 16px;            /* Adjust text size */
}
```

### Change Section Backgrounds:
Find `.section-light` in `styles.css`:
```css
.section-light {
    background-color: var(--light-cream);  /* Change this */
}
```

---

## 🔍 SEO Optimization

### Update Page Titles:
In `<head>` of each HTML file:
```html
<title>Your Page Title | A Rai of Sunshine</title>
```
Make each page unique and descriptive.

### Update Meta Descriptions:
In `<head>` of each HTML file:
```html
<meta name="description" content="Your page description here (150-160 characters)">
```

### Add Favicon:
1. Create 32x32px icon (favicon.png)
2. Add to `<head>` of all pages:
```html
<link rel="icon" type="image/png" href="favicon.png">
```

### Add Open Graph Tags (for social sharing):
Add to `<head>` of all pages:
```html
<meta property="og:title" content="A Rai of Sunshine">
<meta property="og:description" content="Supporting families with disabilities">
<meta property="og:image" content="https://yoursite.com/share-image.jpg">
<meta property="og:url" content="https://yoursite.com">
```

---

## ♿ Accessibility

### Already Included:
✅ Semantic HTML structure
✅ ARIA labels on buttons
✅ Keyboard navigation support
✅ High contrast colors (WCAG AA)
✅ Readable font sizes
✅ Alt text placeholders
✅ Focus indicators

### To Maintain Accessibility:
- Always add alt text to images:
  ```html
  <img src="photo.jpg" alt="Descriptive text">
  ```
- Keep text color contrast high
- Test keyboard navigation (Tab key)
- Use descriptive link text (not "click here")
- Maintain heading hierarchy (h1 > h2 > h3)

---

## 📱 Mobile Responsiveness

Site automatically adjusts for:
- 📱 Phones (< 576px)
- 📱 Tablets (576px - 992px)
- 💻 Laptops (992px - 1200px)
- 🖥️ Desktops (> 1200px)

### Test on Multiple Devices:
- iPhone/Android phone
- iPad/Android tablet
- Desktop computer
- Use browser DevTools (F12) to test different sizes

---

## 🔒 Security Best Practices

1. **Use HTTPS**
   - Free with Netlify/Vercel/GitHub Pages
   - Required for modern browsers

2. **Keep Dependencies Updated**
   - Font Awesome (currently 6.4.0)
   - Google Fonts (auto-updates)

3. **Form Security**
   - Use form services (Formspree, etc.)
   - Don't expose email addresses
   - Add honeypot field for spam

4. **Privacy Policy**
   - Add if collecting user data
   - Required for email collection
   - Link in footer

---

## 🧪 Testing Checklist

Before launching, test:

### Desktop:
- [ ] All pages load correctly
- [ ] All links work (internal & external)
- [ ] Navigation menu works
- [ ] Forms submit successfully
- [ ] Images load properly
- [ ] No JavaScript errors (F12 console)

### Mobile:
- [ ] Hamburger menu opens/closes
- [ ] All text is readable
- [ ] Buttons are tappable
- [ ] Forms work properly
- [ ] Images scale correctly
- [ ] Page loads fast

### Browsers:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### Accessibility:
- [ ] Tab through with keyboard
- [ ] Test with screen reader
- [ ] Check color contrast
- [ ] Verify alt text on images

---

## 💾 Backup Strategy

### Regular Backups:
1. **Weekly:** Download complete site to computer
2. **Before changes:** Make copy before editing
3. **Version control:** Use Git/GitHub (recommended)

### What to Backup:
- All HTML files
- styles.css
- script.js
- pictures/ folder
- Documentation files

---

## 🚀 Performance Optimization

### Speed Tips:
1. **Compress Images**
   - Use https://tinypng.com
   - Aim for < 200KB per image

2. **Minimize Code** (Optional)
   - Minify CSS/JS for production
   - Use online tools or build process

3. **Use CDN**
   - Already using CDN for fonts & icons
   - Hosting on Netlify/Vercel uses global CDN

4. **Lazy Load Images** (Optional)
   ```html
   <img src="photo.jpg" loading="lazy" alt="Description">
   ```

### Test Performance:
- Google PageSpeed Insights: https://pagespeed.web.dev
- GTmetrix: https://gtmetrix.com
- Aim for 90+ score

---

## 📊 Analytics Setup

### Google Analytics (FREE):
1. Create account: https://analytics.google.com
2. Create property for your site
3. Get tracking code
4. Add to ALL pages before `</head>`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Track:
- Page views
- Button clicks (donate, contact, etc.)
- Form submissions
- Download clicks
- Outbound links

---

## 🎯 Future Enhancements

### Nice to Have:
- [ ] Blog section (add blog.html)
- [ ] Email newsletter integration (Mailchimp)
- [ ] Event calendar (Google Calendar embed)
- [ ] Donation tracker/goal meter
- [ ] Member portal (requires backend)
- [ ] Multi-language support (Spanish)
- [ ] Live chat widget (Tawk.to)
- [ ] Testimonial slider
- [ ] Video content (YouTube embeds)

### Advanced Features:
- [ ] Content Management System (CMS)
- [ ] Online payment processing
- [ ] Member database
- [ ] Event registration system
- [ ] Resource library with downloads
- [ ] Discussion forum

---

## 📞 Support Resources

### Documentation:
- **HTML/CSS Help:** https://www.w3schools.com
- **JavaScript Help:** https://developer.mozilla.org
- **Accessibility:** https://www.w3.org/WAI/
- **SEO:** https://developers.google.com/search/docs

### Tools:
- **Image Compression:** https://tinypng.com
- **Color Picker:** https://coolors.co
- **Icon Library:** https://fontawesome.com
- **Font Pairing:** https://fontpair.co

### Need Website Help?
- **Amy's Website Design Co.**
- Email: amyswebsitedesignco@gmail.com
- Phone: (229) 690-8888

---

## ✅ Maintenance Schedule

### Daily:
- Monitor form submissions
- Check for broken links

### Weekly:
- Review analytics
- Update event information
- Check social media mentions

### Monthly:
- Update content
- Add new photos
- Review and respond to feedback
- Backup entire site

### Quarterly:
- Review and update resources
- Check for outdated information
- Update statistics
- Test all forms and features

### Annually:
- Renew domain (if applicable)
- Review and refresh design
- Update copyright year
- Conduct accessibility audit

---

## 🎉 You're All Set!

Your website is:
✅ **Modern** - Clean, professional design
✅ **Accessible** - WCAG AA compliant
✅ **Responsive** - Works on all devices
✅ **Fast** - Optimized for performance
✅ **Easy to Update** - Simple HTML/CSS
✅ **SEO-Ready** - Optimized for search engines

**Ready to make a difference in your community!** 🌞

---

**Questions?** Contact Amy's Website Design Co.  
**Ready to launch?** See DEPLOYMENT-GUIDE.md

---

**Document Version:** 1.0  
**Last Updated:** June 2026  
**Created For:** A Rai of Sunshine of North Florida Inc.
