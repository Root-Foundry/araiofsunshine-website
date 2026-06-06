# WordPress Implementation Guide
## A Rai of Sunshine Website Redesign

---

## Overview

This guide will help you implement the redesigned website for A Rai of Sunshine of North Florida Inc. using WordPress.

---

## Step 1: Choose a WordPress Theme

### Recommended Themes (in order of preference):

1. **Astra Pro** ⭐ BEST CHOICE
   - Highly customizable
   - Excellent performance
   - Built-in accessibility features
   - Easy to use with page builders
   - **Price:** $59/year
   - **Download:** https://wpastra.com/

2. **Kadence**
   - Modern block-based design
   - Great for non-profits
   - Free version available
   - **Price:** Free (Pro: $129/year)
   - **Download:** https://www.kadencewp.com/

3. **GeneratePress Premium**
   - Lightweight and fast
   - Clean code
   - Accessibility ready
   - **Price:** $59/year
   - **Download:** https://generatepress.com/

---

## Step 2: Install Essential Plugins

### Required Plugins:

1. **Elementor or Beaver Builder** (Page Builder)
   - For drag-and-drop page building
   - Use templates provided in this package
   - **Free Version Available**

2. **WPForms Lite** (Contact Forms)
   - User-friendly form builder
   - GDPR compliant
   - **Free**

3. **GiveWP** (Donation Management)
   - Designed specifically for non-profits
   - Multiple payment gateways
   - Donor management
   - **Free (Pro recommended: $249/year)**

4. **WP Accessibility** (Accessibility Features)
   - Adds accessibility toolbar
   - Skip links, focus indicators
   - **Free**

5. **Smush** (Image Optimization)
   - Compresses images automatically
   - Lazy loading
   - **Free**

6. **MailChimp for WordPress** (Newsletter)
   - Easy newsletter signups
   - Integrates with email services
   - **Free**

### Optional But Recommended:

- **Yoast SEO** - Search engine optimization
- **WP Rocket** - Caching and performance ($59/year)
- **MonsterInsights** - Google Analytics integration
- **The Events Calendar** - For community meetings and events

---

## Step 3: Set Up Your WordPress Site

### A. Install WordPress
If not already installed, contact your hosting provider for one-click WordPress installation.

### B. Install Your Chosen Theme
1. Go to **Appearance > Themes**
2. Click **Add New**
3. Upload theme ZIP file or search for theme name
4. Click **Install** then **Activate**

### C. Install Plugins
1. Go to **Plugins > Add New**
2. Search for each plugin name
3. Click **Install Now** then **Activate**

---

## Step 4: Import Design Assets

### A. Upload Fonts (if using custom fonts)
If you purchased premium fonts:
1. Go to **Appearance > Customize**
2. Find **Typography** settings
3. Upload font files or add Google Fonts

**Recommended Google Fonts:**
- Headings: **Montserrat** (Bold, Semi-Bold)
- Body: **Open Sans** (Regular, Medium, Bold)

### B. Set Up Color Scheme
1. Go to **Appearance > Customize > Colors**
2. Set the following colors:

```
Primary Color: #FF8C42 (Warm Orange)
Secondary Color: #4A90E2 (Sky Blue)
Accent Color: #FFD700 (Sunshine Gold)
Text Color: #333333 (Dark Gray)
Background: #FFFFFF (White)
```

### C. Upload Logo
1. Go to **Appearance > Customize > Site Identity**
2. Upload your logo (recommended size: 200x60px to 300x90px)
3. Add site title and tagline

---

## Step 5: Create Pages

### Required Pages:

1. **Home** (use homepage-template.html as reference)
2. **About / Our Story**
3. **Services** (with sub-pages for each service)
4. **Get Involved**
   - Become a Member
   - Donate
   - Community Grant Giveaway
5. **Resources**
6. **Contact Us**
7. **Event Gallery**
8. **Meet Our Members**
9. **Our Sponsors**

### Creating Pages:
1. Go to **Pages > Add New**
2. Add page title
3. Use page builder (Elementor/Beaver Builder) to design
4. Reference HTML templates provided

---

## Step 6: Set Up Navigation Menu

### A. Create Main Menu
1. Go to **Appearance > Menus**
2. Click **Create a new menu**
3. Name it "Main Menu"
4. Add pages in this order:
   - About
   - Services
   - Get Involved
   - Resources
   - Contact

### B. Organize Sub-menus
Drag pages slightly to the right to create sub-menus:

```
About
Services
   ├─ Support for Families
   ├─ Entrepreneurship
   └─ Community Meetings
Get Involved
   ├─ Become a Member
   ├─ Donate
   └─ Community Grant
Resources
Contact
```

### C. Assign Menu Location
1. Check the box for **Primary Menu** (or Main Navigation)
2. Click **Save Menu**

---

## Step 7: Homepage Setup

### Using Elementor (Recommended):

1. Edit your Home page
2. Click **Edit with Elementor**
3. Create sections based on homepage-template.html:

#### Section 1: Hero
- Add **Section** > Choose **Full Width**
- Add background image
- Add **Heading** widget for title
- Add **Text Editor** for subtitle
- Add **Button** widgets for CTAs
- Set overlay gradient: `#4A90E2` to `#FF8C42` at 75% opacity

#### Section 2: Mission Statement
- Add **Section** > Choose **Boxed**
- Add **Heading** widget: "Our Mission"
- Add **Text Editor** for mission text
- Center align text

#### Section 3: Three Services
- Add **Section** with 3 columns
- In each column:
  - Add **Icon** widget (choose appropriate icon)
  - Add **Heading** (service name)
  - Add **Text Editor** (description)
  - Add **Button** ("Learn More")
- Background: `#FFF9E6` (Soft Cream)

#### Section 4: Testimonial
- Add **Section** > Full Width
- Background: `#4A90E2` (Sky Blue)
- Add **Testimonial** widget or custom HTML
- White text color

#### Section 5: Impact Stats (Optional)
- Add **Section** with 4 columns
- Add **Counter** widgets in each
- Background: `#FFF9E6`

#### Section 6: CTA
- Add **Section** > Full Width
- Gradient background: `#4A90E2` to `#FF8C42`
- Add heading and buttons

#### Section 7: Newsletter
- Add **Section**
- Add **WPForms** widget (create newsletter form first)
- Background: `#FFF9E6`

---

## Step 8: Set Up Donation Page (GiveWP)

### A. Create Donation Form
1. Go to **Donations > Forms**
2. Click **Add Form**
3. Choose **Multi-Level**
4. Set donation levels:
   - $25 - Supporter
   - $50 - Contributor
   - $100 - Champion
   - $250 - Sponsor
   - Custom amount option

### B. Configure Payment Gateways
1. Go to **Donations > Settings > Payment Gateways**
2. Enable:
   - **Stripe** (credit cards)
   - **PayPal** (PayPal payments)
   - **Cash App** (add link in description)

### C. Customize Form Design
1. Match your site colors
2. Add compelling donation impact descriptions
3. Enable recurring donations option

### D. Add Donation Form to Page
1. Create "Donate" page
2. Add GiveWP form shortcode: `[give_form id="XXX"]`
3. Add compelling copy about impact of donations

---

## Step 9: Set Up Contact Forms

### Using WPForms:

1. Go to **WPForms > Add New**
2. Choose **Simple Contact Form** template
3. Customize fields:
   - Name (Required)
   - Email (Required)
   - Phone (Optional)
   - Subject (Required)
   - Message (Required)
   - How Can We Help? (Dropdown with service options)

4. Configure Settings:
   - Set notification email
   - Add confirmation message
   - Enable GDPR agreement checkbox

5. Add form to Contact page using shortcode

---

## Step 10: Set Up Newsletter Integration

### Using MailChimp for WordPress:

1. Create free MailChimp account (if don't have one)
2. Get API key from MailChimp
3. In WordPress: **MC4WP > MailChimp**
4. Enter API key
5. Select mailing list
6. Create form in **MC4WP > Forms**
7. Style form to match website design
8. Add form shortcode to pages/widgets

---

## Step 11: Add Social Media Links

1. Go to **Appearance > Customize**
2. Find **Social Links** or **Widgets**
3. Add social media links:
   - LinkedIn
   - Instagram
   - YouTube
   - Facebook (if applicable)

Or manually add to footer:
1. **Appearance > Widgets**
2. Add **Custom HTML** widget to footer
3. Use Font Awesome icons with links

---

## Step 12: Optimize for Mobile

### Test on Real Devices:
- iPhone (Safari)
- Android phone (Chrome)
- iPad/Tablet

### Mobile Optimizations:
1. In **Elementor**, check **Mobile View** for each section
2. Adjust font sizes (usually 80-90% of desktop)
3. Stack elements vertically
4. Make buttons full-width on mobile
5. Increase touch targets (minimum 44x44px)

---

## Step 13: Accessibility Improvements

### A. Install WP Accessibility Plugin
1. Go to **Settings > WP Accessibility**
2. Enable:
   - Add skip to content link
   - Add outline to keyboard focus
   - Remove title attributes
   - Add post titles to "read more" links

### B. Manual Checks:
- ✅ All images have alt text
- ✅ Color contrast meets WCAG AA (use contrast checker)
- ✅ Can navigate entire site with keyboard (Tab key)
- ✅ Forms have proper labels
- ✅ No automatic audio/video
- ✅ Text can be resized to 200%

### C. Test with Screen Reader:
- Windows: NVDA (free download)
- Mac: VoiceOver (built-in)

---

## Step 14: Performance Optimization

### A. Image Optimization
1. Activate **Smush** plugin
2. Go to **Smush > Bulk Smush**
3. Click **Bulk Smush Now**
4. Enable **Lazy Load** in settings

### B. Caching (if using WP Rocket):
1. Activate **WP Rocket**
2. Go to **Settings > WP Rocket**
3. Enable:
   - Cache preloading
   - File optimization (CSS/JS minification)
   - Media optimization (lazy loading)

### C. Hosting Optimization:
- Use a reliable host (SiteGround, Bluehost, WP Engine)
- Enable SSL certificate (HTTPS)
- Use PHP 8.0 or higher

---

## Step 15: Final Checks Before Launch

### Content Checklist:
- [ ] All pages created and published
- [ ] Navigation menu working correctly
- [ ] All links tested (no broken links)
- [ ] Contact form sends emails properly
- [ ] Donation form processes test donation
- [ ] Newsletter signup works
- [ ] Social media links correct

### Design Checklist:
- [ ] Logo displays correctly
- [ ] Colors match brand guidelines
- [ ] Fonts loading properly
- [ ] Images optimized and loading
- [ ] Mobile responsive on all devices
- [ ] Buttons have hover states

### SEO Checklist:
- [ ] Install Yoast SEO
- [ ] Add meta descriptions to all pages
- [ ] Set up Google Analytics
- [ ] Submit sitemap to Google Search Console
- [ ] Add schema markup for organization

### Legal Checklist:
- [ ] Privacy Policy page
- [ ] Terms of Service (if applicable)
- [ ] Cookie consent (if using tracking)
- [ ] Non-profit disclosure

---

## Step 16: Launch!

### Pre-Launch:
1. Test on multiple browsers (Chrome, Firefox, Safari, Edge)
2. Test on multiple devices
3. Check loading speed (use GTmetrix or Google PageSpeed)
4. Backup entire site

### Launch Day:
1. Remove "Coming Soon" page (if applicable)
2. Announce on social media
3. Send email to mailing list
4. Update Google My Business

### Post-Launch:
1. Monitor analytics daily for first week
2. Check for errors or issues
3. Gather user feedback
4. Make adjustments as needed

---

## Maintenance Schedule

### Daily:
- Monitor donation forms
- Check contact form submissions
- Monitor website uptime

### Weekly:
- Update plugins
- Review analytics
- Backup website

### Monthly:
- Check broken links
- Update content
- Review and respond to comments
- Test all forms
- Review security

### Quarterly:
- Update WordPress core
- Review and renew SSL certificate
- Audit accessibility
- Performance review

---

## Troubleshooting Common Issues

### Issue: Website is slow
**Solutions:**
- Optimize images (compress and resize)
- Enable caching plugin
- Remove unused plugins
- Upgrade hosting plan

### Issue: Mobile menu not working
**Solutions:**
- Clear browser cache
- Check JavaScript errors in browser console
- Deactivate plugins one by one to find conflict

### Issue: Donation form not processing
**Solutions:**
- Check payment gateway settings
- Verify SSL certificate active
- Test with different payment method
- Check GiveWP documentation

### Issue: Images not displaying
**Solutions:**
- Check file permissions (should be 644)
- Verify image paths are correct
- Clear cache
- Re-upload images

---

## Support Resources

### WordPress:
- https://wordpress.org/support/
- https://wordpress.org/documentation/

### Theme Support:
- Check your theme's documentation
- Contact theme support (usually via email/ticket system)

### Plugin Support:
- Each plugin has support forum
- Check plugin documentation first

### Web Design Help:
- Contact Amy's Website Design Co.
- Phone: (229) 690-8888
- Email: amyswebsitedesignco@gmail.com

---

## Additional Resources in This Package

1. **site-analysis.md** - Full analysis and recommendations
2. **design-style-guide.md** - Complete design specifications
3. **homepage-template.html** - HTML template for homepage
4. **styles.css** - CSS stylesheet
5. **script.js** - JavaScript for interactions

---

## Next Steps

1. **Review all documentation** in this package
2. **Choose your WordPress theme** (recommend Astra Pro)
3. **Install WordPress** (if not already done)
4. **Follow this guide step-by-step**
5. **Test thoroughly** before launch
6. **Launch and celebrate!** 🎉

---

## Questions?

If you have questions during implementation:
1. Refer to the documentation files provided
2. Check WordPress Codex
3. Contact your web developer
4. Reach out to Amy's Website Design Co.

Good luck with your website redesign! This new design will better serve your community and make it easier for families to find the support they need.

---

**Created for:** A Rai of Sunshine of North Florida Inc.  
**Date:** June 2026  
**Version:** 1.0
