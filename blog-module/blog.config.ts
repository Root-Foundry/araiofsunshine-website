import type { BlogConfig } from './core/types';

// Every site-specific setting for the blog lives in this file. To install the
// module on another site, copy the blog-module folder and edit only this file
// (see README.md). It's plain data so Node can also read it directly when the
// admin page is generated (blog-module/scripts/build-admin.mjs).
//
// The header and footer below mirror the ones in index.html (and every other
// public page). If you change the site's nav or footer there, change it here too.

const HEADER_HTML = `
<link rel="stylesheet" href="/fonts/fontawesome-subset.css">
<header class="header">
    <div class="container">
        <div class="header-content">
            <div class="logo">
                <a href="/" class="logo-link">
                    <img src="/cropped-logo.webp" alt="A Rai of Sunshine logo" height="60">
                </a>
            </div>

            <nav class="nav-desktop">
                <a href="/about" class="nav-link">About</a>
                <a href="/services" class="nav-link">Services</a>
                <a href="/join" class="nav-link">Get Involved</a>
                <a href="/resources" class="nav-link">Resources</a>
                <a href="{{basePath}}" class="nav-link" aria-current="page">Blog</a>
                <a href="/directory" class="nav-link">Directory</a>
                <a href="/contact" class="nav-link">Contact</a>
            </nav>

            <div class="header-actions">
                <a href="/member" class="btn-login" aria-label="Log in or sign up"><i class="fas fa-user-circle" aria-hidden="true"></i><span class="btn-login-text">Log In / Sign Up</span></a>
                <a href="/donate" class="btn-donate">DONATE NOW</a>
            </div>

            <button class="mobile-menu-toggle" aria-label="Toggle menu" aria-expanded="false">
                <i class="fas fa-bars"></i>
            </button>
        </div>

        <nav class="nav-mobile">
            <a href="/about" class="nav-link-mobile">About</a>
            <a href="/services" class="nav-link-mobile">Services</a>
            <a href="/join" class="nav-link-mobile">Get Involved</a>
            <a href="/resources" class="nav-link-mobile">Resources</a>
            <a href="{{basePath}}" class="nav-link-mobile" aria-current="page">Blog</a>
            <a href="/directory" class="nav-link-mobile">Directory</a>
            <a href="/member" class="nav-link-mobile">Log In / Sign Up</a>
            <a href="/contact" class="nav-link-mobile">Contact</a>
            <a href="/donate" class="nav-link-mobile btn-mobile-donate">Donate</a>
        </nav>
    </div>
</header>`;

const FOOTER_HTML = `
<footer class="footer">
    <div class="container">
        <div class="footer-content">
            <div class="footer-section">
                <h2 class="footer-title">About Us</h2>
                <p class="footer-text">
                    Supporting families and empowering individuals with disabilities in
                    Jefferson County and beyond.
                </p>
                <div class="social-icons">
                    <a href="https://www.facebook.com/ARaiOfSunshine" class="social-icon" aria-label="Facebook">
                        <i class="fab fa-facebook-f"></i>
                    </a>
                </div>
            </div>

            <div class="footer-section">
                <h2 class="footer-title">Quick Links</h2>
                <ul class="footer-links">
                    <li><a href="/about" class="footer-link">Our Story</a></li>
                    <li><a href="/services" class="footer-link">Services</a></li>
                    <li><a href="/resources" class="footer-link">Resources</a></li>
                    <li><a href="{{basePath}}" class="footer-link">Blog</a></li>
                    <li><a href="/events" class="footer-link">Event Gallery</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h2 class="footer-title">Get Involved</h2>
                <ul class="footer-links">
                    <li><a href="/join" class="footer-link">Become a Member</a></li>
                    <li><a href="/member" class="footer-link">Member Portal</a></li>
                    <li><a href="/directory" class="footer-link">Business Directory</a></li>
                    <li><a href="/donate" class="footer-link">Donate</a></li>
                    <li><a href="/sponsors" class="footer-link">Our Sponsors</a></li>
                </ul>
            </div>

            <div class="footer-section">
                <h2 class="footer-title">Contact</h2>
                <ul class="footer-contact">
                    <li>
                        <i class="fas fa-map-marker-alt"></i>
                        850 N. Jefferson Street, Unit 805, Monticello, FL 32344
                    </li>
                    <li>
                        <i class="fas fa-envelope"></i>
                        <a href="mailto:araiofsunshineofnorthflorida@gmail.com" class="footer-link">araiofsunshineofnorthflorida@gmail.com</a>
                    </li>
                    <li>
                        <i class="fas fa-clock"></i>
                        Monday–Friday, 8:00 AM – 6:00 PM
                    </li>
                </ul>
            </div>
        </div>

        <div class="footer-bottom">
            <p>&copy; {{year}} A Rai of Sunshine of North Florida Inc. All rights reserved.</p>
            <p class="footer-legal"><a href="/privacy" class="footer-link">Privacy Policy</a> · <a href="/terms" class="footer-link">Terms of Use</a> · <a href="/refunds" class="footer-link">Refund &amp; Cancellation Policy</a></p>
            <p class="footer-credit">
                Website made &amp; managed by <a href="https://root-foundry.com" class="footer-link">Root Foundry LLC</a>
            </p>
        </div>
    </div>
</footer>
<script>
// The mobile menu, as script.js runs it on the rest of the site (script.js isn't loaded here).
(function () {
    var toggle = document.querySelector('.mobile-menu-toggle');
    var nav = document.querySelector('.nav-mobile');
    if (!toggle || !nav) return;
    var icon = toggle.querySelector('i');
    function setOpen(open) {
        nav.classList.toggle('active', open);
        toggle.setAttribute('aria-expanded', String(open));
        icon.classList.toggle('fa-bars', !open);
        icon.classList.toggle('fa-times', open);
    }
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('active')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && nav.classList.contains('active')) { setOpen(false); toggle.focus(); }
    });
})();
</script>`;

// Styles for the header and footer above, copied from styles.css. The blog's own
// base styles (core/styles.ts) don't reset margins or link underlines the way
// styles.css does, so those resets are scoped to .header and .footer here.
const CHROME_CSS = `
:root{--sunshine-gold:#FFD700;--sky-blue-text:#2F6DB5;--dark-text:#333333;--medium-gray:#666666;--light-gray:#F5F5F5;--spacing-md:24px;--spacing-lg:40px;--spacing-xl:64px}
.blog-skip:focus{z-index:1100}
:where(.header,.footer) a{text-decoration:none}
:where(.header,.footer) :where(ul,p,h2){margin:0;padding:0}
.container{max-width:1200px;margin:0 auto;padding:0 20px}

.header{background:#fff;box-shadow:0 2px 8px rgba(0,0,0,.05);position:sticky;top:0;z-index:1000;padding:16px 0;font-size:16px;line-height:1.7}
.header-content{display:flex;align-items:center;justify-content:space-between}
.logo img{height:60px;width:auto}
.nav-desktop{display:none;gap:8px}
.nav-link{color:var(--dark-text);font-size:16px;font-weight:500;padding:12px 14px;white-space:nowrap;transition:color .3s ease;border-radius:4px}
.nav-link:hover,.nav-link[aria-current="page"]{color:var(--sky-blue-text);background-color:var(--light-gray)}
.mobile-menu-toggle{display:block;background:none;border:none;padding:0;font-size:24px;color:var(--dark-text);cursor:pointer}
.nav-mobile{display:none;flex-direction:column;margin-top:16px;padding-top:16px;border-top:1px solid var(--light-gray)}
.nav-mobile.active{display:flex}
.nav-link-mobile{color:var(--dark-text);padding:12px 0;font-weight:500;border-bottom:1px solid var(--light-gray)}
.nav-link-mobile[aria-current="page"]{color:var(--sky-blue-text)}
.btn-mobile-donate{background-color:var(--sunshine-gold);color:var(--dark-text);padding:12px;text-align:center;border-radius:8px;margin-top:8px;font-weight:700}
.header-actions{display:flex;align-items:center;gap:12px}
.btn-login{display:none;align-items:center;gap:8px;color:var(--sky-blue-text);border:2px solid var(--sky-blue-text);padding:10px 20px;font-size:15px;font-weight:700;border-radius:25px;white-space:nowrap;transition:all .3s ease}
.btn-login:hover{background-color:var(--sky-blue-text);color:#fff}
.btn-login i{font-size:18px}
.btn-donate{background-color:var(--sunshine-gold);color:var(--dark-text);padding:12px 28px;font-size:15px;font-weight:700;border-radius:25px;box-shadow:0 2px 8px rgba(255,215,0,.4);transition:all .3s ease;display:inline-block;white-space:nowrap}
.btn-donate:hover{background-color:#FFC700;transform:scale(1.05);box-shadow:0 4px 16px rgba(255,215,0,.6);color:var(--dark-text)}
@media (min-width:992px){.nav-desktop{display:flex}.mobile-menu-toggle{display:none}.nav-mobile{display:none!important}.btn-login{display:inline-flex}}
@media (min-width:992px) and (max-width:1199px){.nav-link{padding:12px;font-size:15px}.btn-login{padding:10px 12px}.btn-login-text{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}}

.footer{background-color:var(--dark-text);color:#fff;padding:60px 0 20px;line-height:1.7}
.footer-content{display:grid;grid-template-columns:1fr;gap:var(--spacing-lg);margin-bottom:var(--spacing-xl)}
@media (min-width:768px){.footer-content{grid-template-columns:repeat(2,1fr)}}
@media (min-width:992px){.footer-content{grid-template-columns:repeat(4,1fr)}}
.footer-section{margin-bottom:var(--spacing-md)}
.footer-title{font-family:var(--blog-font-heading);font-weight:700;line-height:1.2;font-size:18px;margin-bottom:var(--spacing-md);color:var(--sunshine-gold)}
.footer-text{font-size:14px;line-height:1.8;color:rgba(255,255,255,.8);margin-bottom:var(--spacing-md)}
.footer-links{list-style:none}
.footer-links li{margin-bottom:8px}
.footer-link{color:rgba(255,255,255,.8);font-size:14px;transition:color .3s ease}
.footer-link:hover{color:var(--sunshine-gold)}
.footer-contact{list-style:none}
.footer-contact li{display:flex;align-items:center;gap:12px;margin-bottom:12px;font-size:14px;color:rgba(255,255,255,.8)}
.footer-contact i{color:var(--sunshine-gold);width:16px}
.social-icons{display:flex;gap:16px;font-size:24px}
.social-icon{color:#fff;transition:all .3s ease;display:inline-block}
.social-icon:hover{color:var(--sunshine-gold);transform:scale(1.1)}
.footer-bottom{border-top:1px solid rgba(255,255,255,.1);padding-top:var(--spacing-md);text-align:center;font-size:14px;color:rgba(255,255,255,.6)}
.footer-bottom p{margin-bottom:var(--spacing-md)}
.footer-bottom .footer-legal{margin:0 0 8px}
.footer-bottom .footer-credit{margin-top:8px}
.footer-credit .footer-link{text-decoration:underline}
`;

const config: BlogConfig = {
  siteName: 'A Rai of Sunshine of North Florida',
  siteUrl: 'https://araiofsunshine.org',
  basePath: '/blog',
  adminPath: '/blog-admin',
  language: 'en-US',
  timeZone: 'America/New_York',

  blogTitle: 'News & Stories',
  blogDescription: 'Updates, event recaps and community stories from A Rai of Sunshine of North Florida.',
  postsPerPage: 10,
  defaultAuthor: 'A Rai of Sunshine',

  contactUrl: 'https://araiofsunshine.org/join',
  logoUrl: 'https://araiofsunshine.org/cropped-logo.png',
  defaultShareImage: 'https://araiofsunshine.org/cropped-logo.png',

  // From the tokens in styles.css.
  brand: {
    colors: {
      background: '#FFFFFF', // --pure-white
      surface: '#FFF9E6', // --soft-cream
      text: '#333333', // --dark-text
      muted: '#666666', // --medium-gray
      accent: '#2F6DB5', // --sky-blue-text (5.3:1 on white; --sky-blue is only 3.3:1)
      accentText: '#FFFFFF',
      border: 'rgba(0, 0, 0, 0.1)',
    },
    fonts: {
      body: "'Open Sans', 'Helvetica Neue', Arial, sans-serif",
      heading: "Montserrat, 'Arial Black', sans-serif",
      googleFontsUrl:
        'https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700&family=Open+Sans:wght@400;500;600;700&display=swap',
    },
    extraCss: CHROME_CSS,
  },

  cta: {
    heading: 'Want to get involved?',
    text: 'Join our community, volunteer, or support our work.',
    buttonLabel: 'Get Involved',
  },

  headerHtml: HEADER_HTML,
  footerHtml: FOOTER_HTML,

  cache: {
    browserMaxAge: 300,
    cdnMaxAge: 300,
  },

  firebase: {
    apiKey: 'AIzaSyD260jUFHNr0Tt_MLC3-ogJn4tJTPYZwSU',
    authDomain: 'araiofsunshine.firebaseapp.com',
    projectId: 'araiofsunshine',
    storageBucket: 'araiofsunshine.firebasestorage.app',
    appId: '1:741022041696:web:336a94177b337cf8e5a505',
  },
};

export default config;
