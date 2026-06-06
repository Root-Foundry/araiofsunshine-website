// Mobile Menu Toggle
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navMobile = document.querySelector('.nav-mobile');
    
    if (mobileMenuToggle && navMobile) {
        mobileMenuToggle.addEventListener('click', function() {
            navMobile.classList.toggle('active');
            
            // Update aria-expanded attribute for accessibility
            const isExpanded = navMobile.classList.contains('active');
            mobileMenuToggle.setAttribute('aria-expanded', isExpanded);
            
            // Change icon
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                if (isExpanded) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
        
        // Close mobile menu when clicking on a link
        const mobileLinks = document.querySelectorAll('.nav-link-mobile');
        mobileLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMobile.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
    }
});

// Smooth Scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href');
        
        // Don't prevent default if it's just "#"
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            e.preventDefault();
            
            // Get header height for offset
            const header = document.querySelector('.header');
            const headerHeight = header ? header.offsetHeight : 0;
            
            const targetPosition = targetElement.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Newsletter Form Submission
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const emailInput = this.querySelector('.newsletter-input');
        const submitButton = this.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('newsletterMessage');
        const email = emailInput.value;
        
        // Basic email validation
        if (!isValidEmail(email)) {
            if (messageDiv) {
                messageDiv.textContent = 'Please enter a valid email address.';
                messageDiv.className = 'form-message error';
                messageDiv.style.display = 'block';
            }
            return;
        }
        
        // Disable button and show loading state
        submitButton.disabled = true;
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Subscribing...';
        
        // Simulate API call (replace with actual form service)
        setTimeout(() => {
            if (messageDiv) {
                messageDiv.textContent = 'Thank you for subscribing! Check your email for confirmation.';
                messageDiv.className = 'form-message success';
                messageDiv.style.display = 'block';
            }
            emailInput.value = '';
            
            // Reset button
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }, 1500);
    });
}

// Contact Form Submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const messageDiv = document.getElementById('formMessage');
        const formData = new FormData(this);
        
        // Validate form
        const firstName = formData.get('firstName');
        const lastName = formData.get('lastName');
        const email = formData.get('email');
        const subject = formData.get('subject');
        const message = formData.get('message');
        const privacy = formData.get('privacy');
        
        if (!firstName || !lastName || !email || !subject || !message) {
            if (messageDiv) {
                messageDiv.textContent = 'Please fill in all required fields.';
                messageDiv.className = 'form-message error';
                messageDiv.style.display = 'block';
            }
            return;
        }
        
        if (!isValidEmail(email)) {
            if (messageDiv) {
                messageDiv.textContent = 'Please enter a valid email address.';
                messageDiv.className = 'form-message error';
                messageDiv.style.display = 'block';
            }
            return;
        }
        
        if (!privacy) {
            if (messageDiv) {
                messageDiv.textContent = 'Please accept the privacy policy.';
                messageDiv.className = 'form-message error';
                messageDiv.style.display = 'block';
            }
            return;
        }
        
        // Disable button and show loading state
        submitButton.disabled = true;
        const originalText = submitButton.innerHTML;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        
        // Simulate API call (replace with actual form service like Formspree, Basin, or Netlify Forms)
        setTimeout(() => {
            if (messageDiv) {
                messageDiv.textContent = 'Thank you for your message! We\'ll get back to you within 24-48 hours.';
                messageDiv.className = 'form-message success';
                messageDiv.style.display = 'block';
            }
            
            // Reset form
            contactForm.reset();
            
            // Reset button
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
            
            // Scroll to message
            messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 1500);
        
        // INTEGRATION NOTE: Replace the setTimeout above with actual form submission
        // Option 1: Formspree (https://formspree.io) - Free tier available
        // Option 2: Basin (https://usebasin.com) - Free tier available
        // Option 3: Netlify Forms (if hosting on Netlify) - Free
        // Option 4: EmailJS (https://www.emailjs.com) - Free tier available
        
        /* Example Formspree integration:
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
            } else {
                messageDiv.textContent = 'Oops! There was a problem.';
                messageDiv.className = 'form-message error';
            }
            messageDiv.style.display = 'block';
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        });
        */
    });
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Header scroll effect (optional - adds shadow on scroll)
let lastScroll = 0;
const header = document.querySelector('.header');

window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 50) {
        header.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    } else {
        header.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
    }
    
    lastScroll = currentScroll;
});

// Animate elements on scroll (optional)
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe service cards, impact stats, etc.
document.addEventListener('DOMContentLoaded', function() {
    const animateElements = document.querySelectorAll('.service-card, .impact-stat, .testimonial');
    
    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
});

// Accessibility: Keyboard navigation improvements
document.addEventListener('keydown', function(e) {
    // Escape key closes mobile menu
    if (e.key === 'Escape') {
        const navMobile = document.querySelector('.nav-mobile');
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        
        if (navMobile && navMobile.classList.contains('active')) {
            navMobile.classList.remove('active');
            if (mobileMenuToggle) {
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                mobileMenuToggle.focus(); // Return focus to toggle button
                
                const icon = mobileMenuToggle.querySelector('i');
                if (icon) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        }
    }
});

// Print current year in footer (if you have a year placeholder)
const currentYearElements = document.querySelectorAll('.current-year');
if (currentYearElements.length > 0) {
    const currentYear = new Date().getFullYear();
    currentYearElements.forEach(element => {
        element.textContent = currentYear;
    });
}

// Handle external links (optional - open in new tab)
document.querySelectorAll('a[href^="http"]').forEach(link => {
    const currentDomain = window.location.hostname;
    const linkDomain = new URL(link.href).hostname;
    
    if (linkDomain !== currentDomain) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        
        // Add visual indicator for external links (optional)
        // link.innerHTML += ' <i class="fas fa-external-link-alt" style="font-size: 0.8em;"></i>';
    }
});

// WordPress-specific: Wait for DOM to be fully loaded
if (typeof jQuery !== 'undefined') {
    jQuery(document).ready(function($) {
        // jQuery-specific code for WordPress integration
        console.log('jQuery loaded and ready');
        
        // Example: AJAX form submission for WordPress
        $('.newsletter-form').on('submit', function(e) {
            e.preventDefault();
            
            const form = $(this);
            const email = form.find('.newsletter-input').val();
            
            // WordPress AJAX call example
            // $.ajax({
            //     url: wpAjax.ajaxUrl, // WordPress localized AJAX URL
            //     type: 'POST',
            //     data: {
            //         action: 'subscribe_newsletter',
            //         email: email,
            //         nonce: wpAjax.nonce
            //     },
            //     success: function(response) {
            //         if (response.success) {
            //             alert('Successfully subscribed!');
            //         }
            //     }
            // });
        });
    });
}
