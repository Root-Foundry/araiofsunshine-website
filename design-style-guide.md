# Design Style Guide
## A Rai of Sunshine of North Florida Inc.

---

## Brand Colors

### Primary Palette
```css
--sunshine-gold: #FFD700;
--sky-blue: #4A90E2;
--warm-orange: #FF8C42;
--pure-white: #FFFFFF;
--soft-cream: #FFF9E6;
```

### Supporting Colors
```css
--dark-text: #333333;
--medium-gray: #666666;
--light-gray: #F5F5F5;
--success-green: #2ECC71;
--alert-red: #E74C3C;
```

### Accessible Color Combinations
- Dark text (#333333) on white background - **WCAG AAA**
- White text on Sky Blue (#4A90E2) - **WCAG AA**
- Dark text on Soft Cream (#FFF9E6) - **WCAG AAA**

---

## Typography

### Font Families
```css
/* Primary Font Stack */
font-family: 'Open Sans', 'Helvetica Neue', Arial, sans-serif;

/* Heading Font Stack */
font-family: 'Montserrat', 'Arial Black', sans-serif;
```

### Font Sizes
```css
/* Desktop */
--heading-1: 48px;     /* Hero titles */
--heading-2: 36px;     /* Section headers */
--heading-3: 28px;     /* Subsections */
--heading-4: 22px;     /* Card titles */
--body-large: 18px;    /* Intro paragraphs */
--body-text: 16px;     /* Main content */
--small-text: 14px;    /* Captions, footer */

/* Mobile (automatically scales down) */
--heading-1-mobile: 32px;
--heading-2-mobile: 28px;
--heading-3-mobile: 24px;
```

### Line Heights
```css
--heading-line-height: 1.2;
--body-line-height: 1.7;
```

### Font Weights
- **Regular:** 400 (body text)
- **Medium:** 500 (emphasis)
- **Semi-Bold:** 600 (subheadings)
- **Bold:** 700 (headings, CTA buttons)

---

## Spacing System

```css
--spacing-xs: 8px;
--spacing-sm: 16px;
--spacing-md: 24px;
--spacing-lg: 40px;
--spacing-xl: 64px;
--spacing-xxl: 96px;
```

### Usage Guidelines
- **Section Padding:** `--spacing-xl` (top/bottom)
- **Card Padding:** `--spacing-md`
- **Button Padding:** `--spacing-sm` (vertical), `--spacing-lg` (horizontal)
- **Paragraph Spacing:** `--spacing-md`

---

## Button Styles

### Primary Button (Donate, Join)
```css
.btn-primary {
  background-color: #FF8C42; /* warm-orange */
  color: #FFFFFF;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 700;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-primary:hover {
  background-color: #E67A35;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 140, 66, 0.3);
}
```

### Secondary Button (Learn More)
```css
.btn-secondary {
  background-color: transparent;
  color: #4A90E2;
  padding: 14px 28px;
  font-size: 16px;
  font-weight: 600;
  border: 2px solid #4A90E2;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background-color: #4A90E2;
  color: #FFFFFF;
}
```

### Donate Button (Sticky Header)
```css
.btn-donate {
  background-color: #FFD700;
  color: #333333;
  padding: 12px 28px;
  font-size: 15px;
  font-weight: 700;
  border-radius: 25px;
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
  transition: all 0.3s ease;
}

.btn-donate:hover {
  background-color: #FFC700;
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(255, 215, 0, 0.6);
}
```

---

## Card Styles

### Service Card
```css
.service-card {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.service-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.service-card-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 20px;
  color: #FF8C42;
}

.service-card-title {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
  color: #333333;
}

.service-card-description {
  font-size: 16px;
  line-height: 1.6;
  color: #666666;
}
```

---

## Layout Components

### Container Widths
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.container-narrow {
  max-width: 800px;
  margin: 0 auto;
}

.container-wide {
  max-width: 1400px;
  margin: 0 auto;
}
```

### Section Spacing
```css
.section {
  padding: 80px 0;
}

.section-light {
  background-color: #FFF9E6;
}

.section-dark {
  background-color: #4A90E2;
  color: white;
}
```

---

## Header / Navigation

### Desktop Navigation
```css
.header {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-link {
  color: #333333;
  font-size: 16px;
  font-weight: 500;
  padding: 12px 20px;
  text-decoration: none;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #4A90E2;
}

.nav-link-active {
  color: #FF8C42;
  border-bottom: 2px solid #FF8C42;
}
```

---

## Icons

### Recommended Icon Set
- **Font Awesome** (free version)
- **Material Icons**
- Or custom SVG icons

### Service Icons Suggestions
- 👨‍👩‍👧‍👦 Family Support → `fas fa-users` or `fas fa-heart`
- 💼 Entrepreneurship → `fas fa-briefcase` or `fas fa-lightbulb`
- 🤝 Community Meetings → `fas fa-comments` or `fas fa-calendar-alt`

---

## Imagery Guidelines

### Photo Style
- **Authentic:** Real photos from events and community
- **Diverse:** Showing various ages, abilities, backgrounds
- **Warm:** Natural lighting, smiling faces
- **Action-oriented:** People engaged in activities

### Image Dimensions
- **Hero Image:** 1920x800px (desktop), 768x600px (mobile)
- **Service Cards:** 600x400px
- **Team Photos:** 400x400px (square)
- **Gallery Thumbnails:** 300x300px

### Image Optimization
- WebP format with JPEG fallback
- Compressed (max 200KB for hero, 100KB for cards)
- Alt text for accessibility

---

## Accessibility Requirements

### Minimum Standards (WCAG 2.1 AA)
✅ Color contrast ratio 4.5:1 for normal text  
✅ Color contrast ratio 3:1 for large text (18px+)  
✅ All interactive elements keyboard accessible  
✅ Focus indicators visible  
✅ Alt text for images  
✅ Semantic HTML (proper heading hierarchy)  
✅ Form labels properly associated  
✅ Skip to main content link  

### Enhanced Features
- Screen reader testing
- Keyboard navigation testing
- Font size adjustment option
- High contrast mode toggle

---

## Responsive Breakpoints

```css
/* Mobile First Approach */

/* Small phones */
@media (min-width: 320px) { }

/* Phones */
@media (min-width: 576px) { }

/* Tablets */
@media (min-width: 768px) { }

/* Desktop */
@media (min-width: 992px) { }

/* Large Desktop */
@media (min-width: 1200px) { }
```

---

## Animation Guidelines

### Subtle Transitions
```css
/* Use for hover effects */
transition: all 0.3s ease;

/* Use for smooth scrolling */
scroll-behavior: smooth;
```

### Animation Principles
- **Duration:** 200-400ms for most interactions
- **Easing:** Use `ease` or `ease-in-out` for natural feel
- **Respect:** Honor `prefers-reduced-motion` for accessibility

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Footer Design

```css
.footer {
  background-color: #333333;
  color: #FFFFFF;
  padding: 40px 0 20px;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 40px;
  margin-bottom: 32px;
}

.footer-link {
  color: #FFFFFF;
  text-decoration: none;
  font-size: 14px;
  line-height: 2;
}

.footer-link:hover {
  color: #FFD700;
}

.social-icons {
  display: flex;
  gap: 16px;
  font-size: 24px;
}

.social-icon:hover {
  color: #FFD700;
  transform: scale(1.1);
}
```

---

## Do's and Don'ts

### ✅ Do
- Use high contrast for readability
- Keep buttons large and touch-friendly
- Use consistent spacing throughout
- Test on real devices
- Add loading states for buttons
- Optimize images before upload

### ❌ Don't
- Use text smaller than 14px
- Use color alone to convey information
- Create buttons smaller than 44x44px (mobile)
- Autoplay videos with sound
- Use flashing animations
- Forget alt text on images

---

## WordPress Plugin Recommendations

### Essential Plugins
1. **Elementor** or **Beaver Builder** - Page builder
2. **WPForms** - Contact forms
3. **GiveWP** - Donation management
4. **WP Accessibility** - Accessibility features
5. **Smush** - Image optimization
6. **WP Rocket** - Caching and performance
7. **MailChimp for WordPress** - Newsletter integration

---

## Brand Voice & Tone

### Voice Characteristics
- **Warm** - Friendly and approachable
- **Supportive** - Encouraging and helpful
- **Clear** - Simple, jargon-free language
- **Hopeful** - Positive and uplifting

### Writing Guidelines
- Use active voice
- Short sentences and paragraphs
- Bullet points for lists
- Headers to break up content
- Personal stories to connect emotionally

---

## Next Steps for Implementation

1. **Choose WordPress theme** (see site-analysis.md)
2. **Install recommended plugins**
3. **Set up color scheme** (use CSS variables)
4. **Upload optimized images**
5. **Create page templates** based on layouts
6. **Test accessibility** with screen readers
7. **Get feedback** from users with disabilities
8. **Launch and monitor** analytics
