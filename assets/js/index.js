/**
 * Main JavaScript for Ghost theme
 * Handles:
 * - Article navigation (J/K keys)
 * - Infinite scroll and post filtering
 * - Social sharing functionality
 * - Responsive sidenotes
 * - Accessibility features
 *
 * Dependencies:
 * - Isotope (for grid layout)
 * - CSS: ../css/index.css
 */

////////// Import CSS //////////
import '../css/index.css';

// Enhanced Input Validation
const InputValidator = {
    patterns: {
        email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        url: /^https?:\/\/[a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?$/,
        text: /^[\p{L}\p{N}\s\-_.,!?]{1,500}$/u,
        numeric: /^\d{1,10}$/
    },

    validate(value, type) {
        if (!value || !type || !this.patterns[type]) {
            return false;
        }
        const sanitized = this.sanitize(value);
        return this.patterns[type].test(sanitized);
    },

    sanitize(value) {
        return String(value)
            .trim()
            .replace(/[^\p{L}\p{N}\s\-_.,!?@]/gu, '');
    }
};

const RateLimiter = {
    getKey(action) {
        // Create a key based on the current minute
        const now = Math.floor(Date.now() / 1000 / 60);
        return `rateLimit_${action}_${now}`;
    },

    increment(action, limit) {
        const key = this.getKey(action);
        // Get current count or start at 0
        let count = parseInt(sessionStorage.getItem(key) || '0');
        count++;
        // Store updated count
        sessionStorage.setItem(key, count.toString());
        return count <= limit;
    },

    checkLimit(action, limit = 60, windowMs = 60000) {
        // Clean up old entries first
        this.cleanup();
        return this.increment(action, limit);
    },

    cleanup() {
        const now = Math.floor(Date.now() / 1000 / 60);
        // Iterate through all storage items
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('rateLimit_')) {
                const timeKey = parseInt(key.split('_')[2]);
                // Remove entries older than 5 minutes
                if (now - timeKey > 5) {
                    sessionStorage.removeItem(key);
                }
            }
        }
    }
};

////////// Enhanced Security Utilities //////////
const SECURITY = {
    urlPatterns: {
        dangerous: /javascript:|data:|vbscript:|file:|blob:|ftp:|ws:|wss:/i,
        symbols: /[<>'"`{}()\[\]]/
    },
    inputPatterns: {
        text: /^[a-zA-Z0-9\s\-_.,!?]*$/,
        email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
        numeric: /^\d+$/
    }
};

////////// Accessibility Constants //////////
const KEYS = {
    TAB: 'Tab',
    ENTER: 'Enter',
    ESCAPE: 'Escape',
    SPACE: ' ',
    UP: 'ArrowUp',
    DOWN: 'ArrowDown',
    LEFT: 'ArrowLeft',
    RIGHT: 'ArrowRight',
    HOME: 'Home',
    END: 'End',
    J: 'j',  // Next article
    K: 'k',  // Previous article
    N: 'n',  // Next article (alternative)
    P: 'p'  // Previous article (alternative)
};

const ARIA_ATTRS = {
    EXPANDED: 'aria-expanded',
    HIDDEN: 'aria-hidden',
    CONTROLS: 'aria-controls',
    CHECKED: 'aria-checked',
    SELECTED: 'aria-selected',
    LABEL: 'aria-label',
    LABELLEDBY: 'aria-labelledby',
    LISTBOX: 'listbox',
    OPTION: 'option'
};

////////// Sidenotes Configuration //////////
const SIDENOTES_CONFIG = {
    articleSelector: 'article',
    contentSelector: '.article-content',
    footerSelector: 'footer',
    notesWrapperClass: 'sidenotes-wrapper',
    mobileBreakpoint: 1040,
    mobileNotesClass: 'mobile-sidenotes'
};

////////// Infinite Carousel Configuration //////////
const CAROUSEL_CONFIG = {
    trackClass: 'carousel-track',
    cardClass: 'article-card'
};

////////// Post Filter Configuration //////////
const FILTER_CONFIG = {
    containerId: 'post-type-filter',
    types: [
        { id: 'all', label: 'All Posts' },
        { id: 'article', label: 'Articles' },
        { id: 'bookmarks', label: 'Bookmarks' },
        { id: 'notes', label: 'Notes' },
        { id: 'quotes', label: 'Quotes' }
    ]
};

////////// Related Articles Panel Configuration //////////
const RELATED_PANEL_CONFIG = {
    triggerButtonClass: 'related-trigger',
    panelClass: 'related-panel',
    overlayClass: 'panel-overlay',
    closeBtnClass: 'close-panel',
    activeClass: 'active',
    panelOpenClass: 'panel-open',
    maxOpenAttempts: 10,
    timeWindowMs: 60000, // 1 minute
    focusableSelectors: [
        'button:not([disabled])',
        '[href]:not([href*="javascript:"])',  // Prevent javascript: URLs
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
    ].join(',')
};

////////// Testimonials Configuration //////////
const TESTIMONIALS_CONFIG = {
    updateInterval: 7000,
    fadeTransitionMs: 500,
    testimonials: [
        {
            quote: "Newsletters suck. This one sucks the most.",
            author: "John Bender",
            avatar: "media/avatars/bender.webp",
            link: "https://thebreakfastclub.fandom.com/wiki/John_Bender"
        },
        {
            quote: "I ain't got time to read this crap",
            author: "Blain Cooper",
            avatar: "media/avatars/blain.webp",
            link: "https://avp.fandom.com/wiki/Blain_Cooper"
        },
        {
            quote: "My life's been one long, glorious ‘sitting on beach earning twenty percent' vibe-fest since becoming a member of You Can't Be Serious.",
            author: "Hans Gruber",
            avatar: "media/avatars/hans.webp",
            link: "https://en.wikipedia.org/wiki/Hans_Gruber"
        },
        {
            quote: "I pity the fool who don't support You Can't Be Serious.",
            author: "Clubber Lang",
            avatar: "media/avatars/clubber.webp",
            link: "https://en.wikipedia.org/wiki/Clubber_Lang"
        },
        {
            quote: "This site was, is, and will always be nada",
            author: "Steff McKee",
            avatar: "media/avatars/steff.webp",
            link: "https://en.wikipedia.org/wiki/Pretty_in_Pink"
        },
        {
            quote: "You're God Damn right I read You Can't Be Serious.",
            author: "Colonel Nathan R. Jessup",
            avatar: "media/avatars/jessup.webp",
            link: "https://villains.fandom.com/wiki/Colonel_Nathan_R._Jessup"
        },
        {
            quote: "These people are a stain on the internet. It's best to go about your daily routine and forget they exist.",
            author: "Mildred Ratched",
            avatar: "media/avatars/mildred.webp",
            link: "https://en.wikipedia.org/wiki/Nurse_Ratched"
        },
        {
            quote: "So this newsletter right. It’s 90% bullshit, but it’s entertaining. That’s why I read it because it entertains me.",
            author: "Alonzo Harris",
            avatar: "media/avatars/alonzo.webp",
            link: "https://villains.fandom.com/wiki/Alonzo_Harris"
        },
        {
            quote: "All I need are some tasty waves, a cool buzz, You Can't Be Serious, and I'm fine.",
            author: "Jeff Spicoli",
            avatar: "media/avatars/spicoli.webp",
            link: "https://www.theringer.com/2020/08/26/movies/spicoli-fast-times-ridgemont-high-teen-movie"
        },
        {
            quote: "Listen, I don't bother nobody and nobody bothers me but these brothers are pretty cool. They see \u2018em you know.",
            author: "Frank",
            avatar: "media/avatars/frank.webp",
            link: "https://en.wikipedia.org/wiki/They_Live"
        },
        {
            quote: "You Can't Be Serious? Those dudes talk shit, saying they'll make it rain good times and all that. The only rain you'll be catching from them is a light drizzle of dickwater.",
            author: "Reggie Hammond",
            avatar: "media/avatars/reggie.webp",
            link: "https://www.cracked.com/article_36231_48-hrs-at-40-how-eddie-murphys-first-movie-birthed-the-buddy-cop-comedy.html"
        },
        {
            quote: "My God, it's full of bullshit.",
            author: "David Bowman",
            avatar: "media/avatars/bowman.webp",
            link: "https://2001.fandom.com/wiki/David_Bowman"
        },
        {
            quote: "I'd rather have my eyelids stapled shut than read this trash.",
            author: "Regina George",
            avatar: "media/avatars/regina.webp",
            link: "https://en.wikipedia.org/wiki/Regina_George_(Mean_Girls)"
        },
        {
            quote: "Hey man, I don't wanna rain on their parade, but these guys won't last seventeen days. Easy. Game over for them man.",
            author: "Private First Class William L. Hudson",
            avatar: "media/avatars/hudson.webp",
            link: "https://en.wikipedia.org/wiki/Hudson_%28Aliens%29"
        },
        {
            quote: "This quitting thing, it's a hard habit to break once you start, but one thing I'll never quit is this website.",
            author: "Morris Buttermaker",
            avatar: "media/avatars/buttermaker.webp",
            link: "https://en.wikipedia.org/wiki/The_Bad_News_Bears"
        },
        {
            quote: "Blogs are teeming petri dishes of malignant mediocrity. Written by mental maggots consuming their own predigested pablum. You Can't Be Serious is the excretion.",
            author: "Lydia Tár",
            avatar: "media/avatars/tar.webp",
            link: "https://en.wikipedia.org/wiki/T%C3%A1r"
        }
    ]
};

const WEATHER_ICONS = {
    sunny: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="weather-icon inline-icon" fill="none" stroke="currentColor">
            <path d="M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  stroke-width="2" stroke-linecap="round"/>
        </svg>`,
    cloudy: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="weather-icon inline-icon" fill="none" stroke="currentColor">
            <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"
                  stroke-width="2" stroke-linecap="round"/>
        </svg>`,
    'partly cloudy': `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="weather-icon inline-icon" fill="none" stroke="currentColor">
            <path d="M12 4a4 4 0 100 8 4 4 0 000-8zM18 10h-1.26A4 4 0 109 20h9a5 5 0 000-10z"
                  stroke-width="2" stroke-linecap="round"/>
        </svg>`,
    rainy: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="weather-icon inline-icon" fill="none" stroke="currentColor">
            <path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25M8 13v8M16 13v8M12 15v8"
                  stroke-width="2" stroke-linecap="round"/>
        </svg>`,
    drizzle: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="weather-icon inline-icon" fill="none" stroke="currentColor">
            <path d="M20 16.58A5 5 0 0018 7h-1.26A8 8 0 104 15.25M8 13v8M16 13v8M12 15v8"
                  stroke-width="2" stroke-linecap="round"/>
        </svg>`,
    snow: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="weather-icon inline-icon" fill="none" stroke="currentColor">
            <path d="M20 17.58A5 5 0 0018 8h-1.26A8 8 0 104 16.25M8 16h.01M8 20h.01M12 18h.01M12 22h.01M16 16h.01M16 20h.01"
                  stroke-width="2" stroke-linecap="round"/>
        </svg>`,
    foggy: `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="weather-icon inline-icon" fill="none" stroke="currentColor">
            <path d="M3 8h18M3 12h18M3 16h18"
                  stroke-width="2" stroke-linecap="round"/>
        </svg>`
};

////////// Initialize Content Security Policy //////////
if (window.trustedTypes && trustedTypes.createPolicy) {
    trustedTypes.createPolicy('default', {
        createHTML: string => string,
        createScriptURL: string => string,
        createScript: string => string
    });
}

// Async Operation Timeout Protection
function withTimeout(promise, ms = 5000) {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error('Operation timed out'));
        }, ms);
    });

    return Promise.race([
        promise,
        timeoutPromise
    ]).finally(() => {
        clearTimeout(timeoutId);
    });
}

function sanitizeHTML(html) {
    // Create a temporary div element
    const div = document.createElement('div');
    // Safely convert HTML to text
    div.textContent = html;
    // Get the sanitized HTML and remove dangerous patterns
    return div.innerHTML
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
        .replace(/on\w+="[^"]*"/g, '') // Remove event handlers
        .replace(/href="javascript:[^"]*"/g, '') // Remove javascript: URLs
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/data:/gi, '') // Remove data: URLs
        .replace(/vbscript:/gi, ''); // Remove vbscript: protocol
}

////////// Accessibility Utilities //////////
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function handleTabKey(e) {
        if (e.key !== KEYS.TAB) return;

        if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
        } else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
        }
    }

    element.addEventListener('keydown', handleTabKey);
    return () => element.removeEventListener('keydown', handleTabKey);
}

function manageTabIndex(elements, selectedIndex) {
    elements.forEach((element, index) => {
        element.setAttribute('tabindex', index === selectedIndex ? '0' : '-1');
    });
}

////////// Enhanced URL Validation //////////
function isValidUrl(url) {
    try {
        // Create URL object (will throw if invalid)
        const urlObj = new URL(url);

        // Decode the URL to check for encoded malicious content
        const decodedUrl = decodeURIComponent(url);

        // List of allowed file extensions
        const allowedExtensions = [
            '.html', '.htm', '.php', '.asp',
            '.aspx', '.jsp', '.json'
        ];

        // Check if the URL ends with an allowed extension
        const hasValidExtension = allowedExtensions.some(ext =>
            urlObj.pathname.toLowerCase().endsWith(ext)
        );

        // Combined security checks
        return (
            // Check origin matches current site
            urlObj.origin === window.location.origin &&
            // Check protocol matches current site
            urlObj.protocol === window.location.protocol &&
            // Ensure no credentials in URL
            !urlObj.username &&
            !urlObj.password &&
            // Check for dangerous characters
            !/[<>'"`{}()\[\]]/.test(decodedUrl) &&
            // Check for dangerous protocols
            !/javascript:|data:|vbscript:|file:|blob:|ftp:|ws:|wss:/i
                .test(decodedUrl) &&
            // Verify file extension
            hasValidExtension
        );
    } catch {
        // If URL parsing fails, return false
        return false;
    }
}

////////// Optimized Input Validation //////////
function validateInput(input, type) {
    if (!input || !type) return false;
    return SECURITY.inputPatterns[type]?.test(input) ?? false;
}

////////// Performance-Optimized Throttle //////////
function throttle(func, limit) {
    let lastRun, timeout;
    return function(...args) {
        if (!lastRun) {
            func.apply(this, args);
            lastRun = Date.now();
        } else {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                if ((Date.now() - lastRun) >= limit) {
                    func.apply(this, args);
                    lastRun = Date.now();
                }
            }, limit - (Date.now() - lastRun));
        }
    };
}

////////// Optimized Debounce //////////
function debounce(func, wait, immediate = false) {
    let timeout;
    return function(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func.apply(this, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(this, args);
    };
}

////////// Enhanced Text Sanitization //////////
function sanitizeText(text, maxLength = 150) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.textContent
        .slice(0, maxLength)
        .replace(SECURITY.urlPatterns.dangerous, '')
        .replace(SECURITY.urlPatterns.symbols, '');
}

////////// Sidenotes Implementation //////////
function initSidenotes() {
    function processContent() {
        console.log('Processing content');
        const article = document.querySelector(SIDENOTES_CONFIG.articleSelector);
        if (!article) {
            console.log('No article found');
            return;
        }

        const content = article.querySelector(SIDENOTES_CONFIG.contentSelector);
        if (!content) {
            console.log('No content found');
            return;
        }

        // Get all paragraphs
        const paragraphs = Array.from(content.getElementsByTagName('p'));
        const footnotes = {};

        // Regex patterns - will match [[n]] where n is any number of digits
        const footnoteRegex = /^\[\[(\d+)\]\]\s*(.+)$/;
        const referenceRegex = /\[\[(\d+)\]\]/g;

        // First pass: collect footnotes
        paragraphs.forEach((p, index) => {
            const text = p.textContent.trim();
            const match = text.match(footnoteRegex);

            if (match) {
                const [_, number, noteContent] = match;
                footnotes[number] = {
                    content: noteContent,
                    element: p
                };
                p.style.display = 'none'; // Hide the footnote paragraph
            }
        });

        // Second pass: replace references and create sidenotes
        if (Object.keys(footnotes).length > 0) {
            // Create sidenotes container
            const sidenoteContainer = document.createElement('div');
            sidenoteContainer.className = SIDENOTES_CONFIG.notesWrapperClass;

            // Create mobile sidenotes container
            const mobileSidenoteContainer = document.createElement('div');
            mobileSidenoteContainer.className = SIDENOTES_CONFIG.mobileNotesClass;
            mobileSidenoteContainer.style.display = 'none';

            // Process references
            paragraphs.forEach(p => {
                const text = p.innerHTML;
                if (text.includes('[[')) {
                    p.innerHTML = text.replace(referenceRegex, (match, num) => {
                        if (footnotes[num]) {
                            return `<sup class="footnote-ref" id="ref-${num}">${num}</sup>`;
                        }
                        return match;
                    });
                }
            });

            // Create and position sidenotes
            Object.entries(footnotes).forEach(([num, data]) => {
                // Create desktop sidenote
                const sidenote = createSidenote(num, data.content);
                sidenoteContainer.appendChild(sidenote);

                // Create mobile sidenote (clone)
                const mobileSidenote = createSidenote(num, data.content);
                mobileSidenote.classList.add('mobile');
                mobileSidenoteContainer.appendChild(mobileSidenote);
            });

            content.appendChild(sidenoteContainer);

            // Insert mobile container before footer
            const footer = article.querySelector(SIDENOTES_CONFIG.footerSelector);
            if (footer) {
                article.insertBefore(mobileSidenoteContainer, footer);
            }

            // Initial positioning and display
            handleResponsiveLayout();
            positionSidenotes();
        }
    }

    function createSidenote(num, content) {
        const sidenote = document.createElement('aside');
        sidenote.className = 'sidenote';
        sidenote.id = `note-${num}`;
        sidenote.innerHTML = `
            <div class="note-content">
                <span class="note-number">${num}</span>
                <div class="note-text">${content}</div>
            </div>
        `;
        return sidenote;
    }

    function positionSidenotes() {
        const content = document.querySelector(SIDENOTES_CONFIG.contentSelector);
        const sidenotes = document.querySelectorAll(`.${SIDENOTES_CONFIG.notesWrapperClass} .sidenote`);

        if (window.innerWidth <= SIDENOTES_CONFIG.mobileBreakpoint) return;

        sidenotes.forEach((sidenote, index) => {
            const num = sidenote.id.replace('note-', '');
            const ref = document.getElementById(`ref-${num}`);

            if (ref && content) {
                const refRect = ref.getBoundingClientRect();
                const contentRect = content.getBoundingClientRect();
                let topPosition = refRect.top - contentRect.top - 12;

                // Adjust position if there's overlap with previous sidenote
                if (index > 0) {
                    const prevSidenote = sidenotes[index - 1];
                    const prevRect = prevSidenote.getBoundingClientRect();
                    const minGap = 12;

                    if (topPosition < prevRect.bottom - contentRect.top + minGap) {
                        topPosition = prevRect.bottom - contentRect.top + minGap;
                    }
                }

                sidenote.style.top = `${Math.round(topPosition)}px`;
            }
        });
    }

    function handleResponsiveLayout() {
        const desktopNotes = document.querySelector(`.${SIDENOTES_CONFIG.notesWrapperClass}`);
        const mobileNotes = document.querySelector(`.${SIDENOTES_CONFIG.mobileNotesClass}`);

        if (!desktopNotes || !mobileNotes) return;

        if (window.innerWidth <= SIDENOTES_CONFIG.mobileBreakpoint) {
            desktopNotes.style.display = 'none';
            mobileNotes.style.display = 'block';
        } else {
            desktopNotes.style.display = 'block';
            mobileNotes.style.display = 'none';
        }
    }

    // Initialize with a slight delay to ensure content is loaded
    setTimeout(processContent, 500);

    // Handle window resize
    window.addEventListener('resize', debounce(() => {
        handleResponsiveLayout();
        requestAnimationFrame(positionSidenotes);
    }, 100));

    // Add click handler for highlighting and scrolling
    document.addEventListener('click', (e) => {
        if (e.target.matches('.footnote-ref')) {
            const num = e.target.id.replace('ref-', '');

            // Remove highlights from all sidenotes
            document.querySelectorAll('.sidenote').forEach(note => {
                note.classList.remove('highlight');
            });

            // Specifically target the mobile sidenote if in mobile view
            if (window.innerWidth <= SIDENOTES_CONFIG.mobileBreakpoint) {
                const mobileSidenote = document.querySelector(`.${SIDENOTES_CONFIG.mobileNotesClass} #note-${num}`);
                if (mobileSidenote) {
                    mobileSidenote.classList.add('highlight');
                    mobileSidenote.offsetHeight; // Force a reflow
                    mobileSidenote.style.backgroundColor = '#ffeb99';
                    requestAnimationFrame(() => {
                        mobileSidenote.style.backgroundColor = '#fffdf0';
                    });
                    setTimeout(() => {
                        mobileSidenote.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center'
                        });
                    }, 50);
                }
            } else {
                // Desktop view - highlight both instances
                const sidenotes = document.querySelectorAll(`#note-${num}`);
                sidenotes.forEach(sidenote => {
                    if (sidenote) {
                        sidenote.classList.add('highlight');
                    }
                });
            }
        }
    });
}

function createFilterDropdown() {
    // Define icons for each filter type
    const FILTER_ICONS = {
        all: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layout-grid"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
        article: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`,
        bookmarks: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bookmark"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
        notes: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sticky-note"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>`,
        quotes: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-quote"><path d="M16 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/><path d="M5 3a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2 1 1 0 0 1 1 1v1a2 2 0 0 1-2 2 1 1 0 0 0-1 1v2a1 1 0 0 0 1 1 6 6 0 0 0 6-6V5a2 2 0 0 0-2-2z"/></svg>`
    };

    const container = document.createElement('div');
    container.id = FILTER_CONFIG.containerId;
    container.className = 'post-type-filter';

    const button = document.createElement('button');
    button.className = 'filter-button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-haspopup', 'listbox');

    const staticText = document.createElement('span');
    staticText.className = 'filter-static-text';
    staticText.textContent = 'Filter Articles By: ';

    const dynamicText = document.createElement('span');
    dynamicText.className = 'filter-button-text';
    dynamicText.textContent = 'All Posts';

    const buttonIcon = document.createElement('span');
    buttonIcon.className = 'filter-button-icon';
    buttonIcon.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
    `;

    button.appendChild(staticText);
    button.appendChild(dynamicText);
    button.appendChild(buttonIcon);

    const dropdown = document.createElement('div');
    dropdown.className = 'filter-dropdown';
    dropdown.setAttribute('role', 'listbox');
    dropdown.setAttribute('aria-hidden', 'true');
    dropdown.style.display = 'none';

    const ul = document.createElement('ul');
    FILTER_CONFIG.types.forEach(type => {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.setAttribute('data-value', type.id);
        li.setAttribute('tabindex', '-1');

        // Add icon and text wrapper
        const iconSpan = document.createElement('span');
        iconSpan.className = 'filter-option-icon';
        iconSpan.innerHTML = FILTER_ICONS[type.id] || FILTER_ICONS['all'];

        const textSpan = document.createElement('span');
        textSpan.className = 'filter-option-text';
        textSpan.textContent = type.label;

        li.appendChild(iconSpan);
        li.appendChild(textSpan);

        if (type.id === 'all') {
            li.setAttribute('aria-selected', 'true');
        }
        ul.appendChild(li);
    });

    dropdown.appendChild(ul);
    container.appendChild(button);
    container.appendChild(dropdown);

    return container;
}

function initPostFilter(iso) {
const articleList = document.querySelector('.article-list');
if (!articleList) return;

// Create filter dropdown
const filter = createFilterDropdown();

// Set initial styles
Object.assign(filter.style, {
    opacity: '0',
    visibility: 'hidden',
    transition: 'opacity 0.3s ease-out',
    height: '100%'
});

// Insert filter after the header-dropdown
const headerDropdown = document.querySelector('.header-dropdown');
if (headerDropdown) {
    headerDropdown.after(filter);
}

// Function to check scroll position and toggle filter visibility
function checkScrollPosition() {
    // Get article list position and calculate trigger point
    const articleListPosition = articleList.getBoundingClientRect().top + window.scrollY;
    // Trigger 300px before reaching the article list
    const scrollTriggerPoint = articleListPosition - 200;

    if (window.scrollY > scrollTriggerPoint) {
        filter.style.visibility = 'visible';
        requestAnimationFrame(() => {
            filter.style.opacity = '1';
        });
    } else {
        filter.style.opacity = '0';
        setTimeout(() => {
            if (filter.style.opacity === '0') {
                filter.style.visibility = 'hidden';
            }
        }, 300);
    }
}

// Add scroll listener with debounce for performance
window.addEventListener('scroll', debounce(checkScrollPosition, 10));

// Also recalculate on window resize
window.addEventListener('resize', debounce(checkScrollPosition, 100));

// Initial check
checkScrollPosition();

// Get filter elements
const filterButton = filter.querySelector('.filter-button');
const filterDropdown = filter.querySelector('.filter-dropdown');
const filterOptions = filter.querySelectorAll('li');
const buttonText = filter.querySelector('.filter-button-text');

    // Position dropdown function
    const positionDropdown = () => {
        const buttonRect = filterButton.getBoundingClientRect();
        filterDropdown.style.position = 'fixed';
        filterDropdown.style.top = `${buttonRect.bottom + 8}px`; // 8px gap
        filterDropdown.style.left = `${buttonRect.left}px`;
        filterDropdown.style.width = `${Math.max(buttonRect.width, 200)}px`; // At least 200px wide
    };

    // Toggle dropdown
    const toggleDropdown = (show) => {
        if (show) {
            filterDropdown.style.display = 'block';
            positionDropdown();
        } else {
            filterDropdown.style.display = 'none';
        }
        filterButton.setAttribute(ARIA_ATTRS.EXPANDED, show.toString());
        filterDropdown.setAttribute(ARIA_ATTRS.HIDDEN, (!show).toString());
    };

    // Handle filter selection
const handleFilterSelect = (typeId) => {
        filterOptions.forEach(option => {
            option.setAttribute('aria-selected', option.dataset.value === typeId);
        });

        // Update button text
        const selectedType = FILTER_CONFIG.types.find(t => t.id === typeId);
        buttonText.textContent = selectedType.label;

        // Add/remove active indicator
        filterButton.classList.toggle('filter-active', typeId !== 'all');

        // Add accessibility announcement
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.className = 'visually-hidden';
        announcement.textContent = `Showing ${selectedType.label}`;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);

        toggleDropdown(false);
        localStorage.setItem('selectedPostType', typeId);

        if (iso) {
            if (typeId === 'all') {
                iso.arrange({ filter: '*' });
            } else {
                iso.arrange({ filter: `.${typeId}` });
            }
        }
    };

    // Event Listeners
    filterButton.addEventListener('click', () => {
        const isExpanded = filterButton.getAttribute(ARIA_ATTRS.EXPANDED) === 'true';
        toggleDropdown(!isExpanded);
    });

    filterOptions.forEach(option => {
        option.addEventListener('click', () => {
            handleFilterSelect(option.dataset.value);
        });
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!filter.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Handle keyboard navigation
    filter.addEventListener('keydown', (e) => {
        const isExpanded = filterButton.getAttribute(ARIA_ATTRS.EXPANDED) === 'true';

        switch (e.key) {
            case KEYS.ESCAPE:
                if (isExpanded) {
                    toggleDropdown(false);
                    filterButton.focus();
                }
                break;
            case KEYS.ENTER:
            case KEYS.SPACE:
                if (e.target.tagName === 'LI') {
                    handleFilterSelect(e.target.dataset.value);
                }
                break;
            case KEYS.UP:
            case KEYS.DOWN:
                if (isExpanded) {
                    e.preventDefault();
                    const currentOption = document.activeElement;
                    const options = Array.from(filterOptions);
                    const currentIndex = options.indexOf(currentOption);
                    let nextIndex;

                    if (e.key === KEYS.UP) {
                        nextIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
                    } else {
                        nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
                    }

                    options[nextIndex].focus();
                }
                break;
        }
    });

    // Update position on scroll/resize
    window.addEventListener('scroll', () => {
        if (filterButton.getAttribute(ARIA_ATTRS.EXPANDED) === 'true') {
            positionDropdown();
        }
    }, { passive: true });

    window.addEventListener('resize', debounce(() => {
        if (filterButton.getAttribute(ARIA_ATTRS.EXPANDED) === 'true') {
            positionDropdown();
        }
    }, 100));

    // Restore previous selection
    const savedType = localStorage.getItem('selectedPostType');
    if (savedType) {
        handleFilterSelect(savedType);
    }

    return handleFilterSelect;
}

////////// Testimonials Implementation //////////
function initTestimonials() {
    const testimonialElement = document.getElementById('testimonal');
    if (!testimonialElement) return;

    // Create a shuffled array of indices
    let indices = Array.from({ length: TESTIMONIALS_CONFIG.testimonials.length }, (_, i) => i);
    let currentIndex = 0;

    // Fisher-Yates shuffle algorithm
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Initial shuffle
    indices = shuffleArray(indices);

// Keep your existing HTML creation function
function createTestimonialHTML(testimonial) {
    // Sanitize the input data
    const sanitizedQuote = sanitizeHTML(testimonial.quote);
    const sanitizedAuthor = sanitizeHTML(testimonial.author);
    const sanitizedLink = sanitizeHTML(testimonial.link);
    // Construct the correct asset path by prepending /assets/
    const avatarPath = `/assets/${testimonial.avatar}`;
    const sanitizedAvatar = sanitizeHTML(avatarPath);

    // Replace straight apostrophes with curly ones
    const withCurlyApostrophes = sanitizedQuote.replaceAll("'", "\u2019");

    return `<div class="testimonial-content">
            <q>${withCurlyApostrophes}</q>
            <cite><img class="rounded-full inline mr-1"
                 src="${sanitizedAvatar}"
                 width="45"
                 height="45"
                 alt="${sanitizedAuthor}'s avatar"
                 onerror="this.style.display='none'">
                 <a href="${sanitizedLink}">${sanitizedAuthor}<svg xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.25"
                      stroke-linecap="round"
                      stroke-linejoin="round">
                      <path d="M5 12h14"/>
                      <path d="m12 5 7 7-7 7"/>
                 </svg></a>
            </cite>
        </div>`;
}

    function updateTestimonial() {
        if (!testimonialElement) return;

        const content = testimonialElement.querySelector('.testimonial-content');
        if (content) {
            content.style.opacity = '0';
            content.style.transform = 'translate(-50%, -40%)';

            setTimeout(() => {
                // Get testimonial using shuffled index
                const testimonial = TESTIMONIALS_CONFIG.testimonials[indices[currentIndex]];

                // Add debugging
                console.log('Loading testimonial:', {
                    author: testimonial.author,
                    avatarPath: `/assets/${testimonial.avatar}`
                });

                testimonialElement.innerHTML = createTestimonialHTML(testimonial);
                const newContent = testimonialElement.querySelector('.testimonial-content');
                if (newContent) {
                    newContent.style.opacity = '1';
                    newContent.style.transform = 'translate(-50%, -50%)';
                }

                // Increment index and reshuffle if we've shown all quotes
                currentIndex = (currentIndex + 1) % indices.length;
                if (currentIndex === 0) {
                    indices = shuffleArray(indices);
                }
            }, TESTIMONIALS_CONFIG.fadeTransitionMs);
        }
    }

    // Initialize with first testimonial
    updateTestimonial();

    // Set up interval for testimonial rotation
    setInterval(updateTestimonial, TESTIMONIALS_CONFIG.updateInterval);
}

function initWeatherDisplay() {
    const tempElement = document.getElementById('current-temp');
    const conditionElement = document.getElementById('current-condition');
    if (!tempElement || !conditionElement) return;

    // Map WMO weather codes to simple words
    // https://open-meteo.com/en/docs#weathervariables
    const weatherMap = {
        'sunny': [0, 1],
        'partly cloudy': [2],
        'cloudy': [3],
        'foggy': [45, 48],
        'drizzle': [51, 53, 55],
        'rain': [61, 63, 65, 80, 81, 82],
        'snow': [71, 73, 75, 77, 85, 86],
        'thunderstorm': [95, 96, 99]
    };

    function getOneWordWeather(code) {
        for (const [word, codes] of Object.entries(weatherMap)) {
            if (codes.includes(code)) return word;
        }
        return 'cloudy'; // Default fallback
    }

    function updateWeatherIcon(condition) {
        const iconTemplate = WEATHER_ICONS[condition] || WEATHER_ICONS.cloudy;
        const tempLi = tempElement.closest('li');
        const existingIcon = tempLi.querySelector('.weather-icon');

        if (existingIcon) {
            existingIcon.parentElement.remove();
        }

        const iconContainer = document.createElement('span');
        iconContainer.className = 'weather-icon-container';
        iconContainer.innerHTML = iconTemplate;

        tempLi.insertBefore(iconContainer, tempLi.firstChild);
    }

async function getWeatherData() {
        try {
            // Clear existing cache first
            localStorage.removeItem('weather_cache');

            const lat = 43.66147;
            const lon = -70.25533;
            const url = new URL('https://api.open-meteo.com/v1/forecast');
            url.searchParams.set('latitude', lat);
            url.searchParams.set('longitude', lon);
            url.searchParams.set('current', 'temperature_2m,weather_code');
            url.searchParams.set('temperature_unit', 'fahrenheit');
            url.searchParams.set('_cb', Math.random());

            const response = await fetch(url);
            if (!response.ok) throw new Error('Weather API request failed');

            const data = await response.json();

            // Use ISO string for timestamp
            const result = {
                temp: Math.round(data.current.temperature_2m),
                condition: getOneWordWeather(data.current.weather_code),
                lastUpdated: new Date().toISOString()
            };

            console.log('Weather update:', {
                temp: result.temp,
                condition: result.condition,
                lastUpdated: result.lastUpdated,
                localTime: new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })
            });

            localStorage.setItem('weather_cache', JSON.stringify(result));

            return {
                temp: result.temp,
                condition: result.condition
            };

        } catch (error) {
            console.error('Error fetching weather:', error);
            return { temp: '--', condition: 'cloudy' };
        }
    }

    async function updateDisplay() {
        try {
            // Clear any existing interval when we start a new update
            if (window.weatherUpdateInterval) {
                clearInterval(window.weatherUpdateInterval);
            }

            const updateWeatherDisplay = async () => {
                try {
                    const weather = await getWeatherData();

                    if (!tempElement || !conditionElement) {
                        console.error('Weather elements not found');
                        return;
                    }

                    tempElement.textContent = `${weather.temp}°F`;
                    conditionElement.textContent = ` ${weather.condition}`;
                    updateWeatherIcon(weather.condition);

                    tempElement.setAttribute('aria-label',
                        `Current temperature is ${weather.temp} degrees Fahrenheit and ${weather.condition}`
                    );
                } catch (error) {
                    console.error('Error updating weather display:', error);
                }
            };

            // Initial update
            await updateWeatherDisplay();

            // Set up periodic updates every 3 hours
            const threeHours = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
            window.weatherUpdateInterval = setInterval(updateWeatherDisplay, threeHours);

            // Clean up interval when page is hidden
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && window.weatherUpdateInterval) {
                    clearInterval(window.weatherUpdateInterval);
                } else if (!document.hidden && !window.weatherUpdateInterval) {
                    // Check when was the last update
                    const cached = localStorage.getItem('weather_cache');
                    if (cached) {
                        const data = JSON.parse(cached);
                        const lastUpdate = new Date(data.lastUpdated);
                        const threeHoursAgo = new Date(Date.now() - threeHours);

                        // Only update if last update was more than 3 hours ago
                        if (lastUpdate < threeHoursAgo) {
                            updateWeatherDisplay();
                            window.weatherUpdateInterval = setInterval(updateWeatherDisplay, threeHours);
                        }
                    } else {
                        // No cache exists, do an update
                        updateWeatherDisplay();
                        window.weatherUpdateInterval = setInterval(updateWeatherDisplay, threeHours);
                    }
                }
            });

        } catch (error) {
            console.error('Error in weather update system:', error);
        }
    }

    // Start the weather display system
    updateDisplay();
}

////////// Knicks Championship Counter //////////
function initKnicksCounter() {
    const counterElement = document.getElementById('knicks-counter');
    if (!counterElement) return;

    function calculateDays() {
        const championship = new Date('1973-05-10T00:00:00-05:00'); // EST timezone
        const now = new Date();
        const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const diff = est - championship;
        const daysSince = Math.floor(diff / (1000 * 60 * 60 * 24));
        counterElement.textContent = `${daysSince.toLocaleString()} Days Ago`;
    }

    // Calculate initial days
    calculateDays();

    // Calculate time until next midnight EST
    function setMidnightUpdate() {
        const now = new Date();
        const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
        const tomorrow = new Date(est);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        const msUntilMidnight = tomorrow - est;

        // Update at midnight
        setTimeout(() => {
            calculateDays();
            // After first midnight, update every 24 hours
            setInterval(calculateDays, 24 * 60 * 60 * 1000);
        }, msUntilMidnight);
    }

    setMidnightUpdate();
}

function initRelatedArticlesPanel() {
    // Securely query elements using trusted class names
    const elements = {
        trigger: document.querySelector(`.${CSS.escape(RELATED_PANEL_CONFIG.triggerButtonClass)}`),
        panel: document.querySelector(`.${CSS.escape(RELATED_PANEL_CONFIG.panelClass)}`),
        overlay: document.querySelector(`.${CSS.escape(RELATED_PANEL_CONFIG.overlayClass)}`),
        closeBtn: document.querySelector(`.${CSS.escape(RELATED_PANEL_CONFIG.closeBtnClass)}`)
    };

    // Validate all required elements exist
    if (!Object.values(elements).every(Boolean)) {
        console.error('Required elements not found for related articles panel');
        return;
    }

    // Rate limiting setup
    const rateLimiter = {
        attempts: 0,
        lastReset: Date.now(),

        checkLimit() {
            const now = Date.now();
            if (now - this.lastReset > RELATED_PANEL_CONFIG.timeWindowMs) {
                this.attempts = 0;
                this.lastReset = now;
            }

            if (this.attempts >= RELATED_PANEL_CONFIG.maxOpenAttempts) {
                return false;
            }

            this.attempts++;
            return true;
        }
    };

    // Secure class manipulation
    function togglePanelClasses(isOpen) {
        const { activeClass, panelOpenClass } = RELATED_PANEL_CONFIG;

        try {
            if (isOpen) {
                elements.panel.classList.add(activeClass);
                elements.overlay.classList.add(activeClass);
                document.body.classList.add(panelOpenClass);
            } else {
                elements.panel.classList.remove(activeClass);
                elements.overlay.classList.remove(activeClass);
                document.body.classList.remove(panelOpenClass);
            }
        } catch (error) {
            console.error('Error toggling panel classes:', error);
            // Ensure panel is closed on error
            elements.panel.classList.remove(activeClass);
            elements.overlay.classList.remove(activeClass);
            document.body.classList.remove(panelOpenClass);
        }
    }

    // Secure ARIA attribute management
    function updateAriaAttributes(isOpen) {
        try {
            elements.trigger.setAttribute('aria-expanded', String(isOpen));
            elements.panel.setAttribute('aria-hidden', String(!isOpen));
            elements.overlay.setAttribute('aria-hidden', String(!isOpen));
        } catch (error) {
            console.error('Error updating ARIA attributes:', error);
            // Reset to safe state on error
            elements.trigger.setAttribute('aria-expanded', 'false');
            elements.panel.setAttribute('aria-hidden', 'true');
            elements.overlay.setAttribute('aria-hidden', 'true');
        }
    }

    function openPanel() {
        if (!rateLimiter.checkLimit()) {
            console.warn('Rate limit exceeded for panel opening');
            return;
        }

        togglePanelClasses(true);
        updateAriaAttributes(true);

        // Secure focus management
        setTimeout(() => elements.closeBtn.focus(), 100);
    }

    function closePanel() {
        togglePanelClasses(false);
        updateAriaAttributes(false);

        // Secure focus management
        setTimeout(() => elements.trigger.focus(), 100);
    }

    // Secure event listener cleanup
    const removeEventListeners = new Set();

    // Secure event handlers
    function addSecureEventListener(element, event, handler, options = {}) {
        const secureHandler = (e) => {
            try {
                handler(e);
            } catch (error) {
                console.error(`Error in ${event} handler:`, error);
                closePanel(); // Ensure panel closes on error
            }
        };

        element.addEventListener(event, secureHandler, options);
        removeEventListeners.add(() => {
            element.removeEventListener(event, secureHandler, options);
        });
    }

    // Add event listeners with error boundaries
    addSecureEventListener(elements.trigger, 'click', openPanel);
    addSecureEventListener(elements.closeBtn, 'click', closePanel);
    addSecureEventListener(elements.overlay, 'click', closePanel);

    // Secure keyboard navigation
    addSecureEventListener(document, 'keydown', (e) => {
        if (e.key === 'Escape' &&
            elements.panel.classList.contains(RELATED_PANEL_CONFIG.activeClass)) {
            closePanel();
        }
    });

    // Secure focus trap
    addSecureEventListener(elements.panel, 'keydown', (e) => {
        if (e.key !== 'Tab') return;

        // Safely query focusable elements
        const focusableElements = Array.from(
            elements.panel.querySelectorAll(RELATED_PANEL_CONFIG.focusableSelectors)
        ).filter(el => !el.hasAttribute('disabled') &&
                      el.getAttribute('tabindex') !== '-1' &&
                      el.offsetParent !== null); // Check visibility

        if (focusableElements.length === 0) return;

        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        const isFirstElement = document.activeElement === firstFocusable;
        const isLastElement = document.activeElement === lastFocusable;

        if (e.shiftKey && isFirstElement) {
            e.preventDefault();
            lastFocusable.focus();
        } else if (!e.shiftKey && isLastElement) {
            e.preventDefault();
            firstFocusable.focus();
        }
    });

    // Cleanup function
    return function cleanup() {
        removeEventListeners.forEach(remove => remove());
        removeEventListeners.clear();
    };
}

////////// Related Articles Panel Interactions //////////
function initRelatedArticleInteractions() {
    const stacks = document.querySelectorAll('.article-stack');

    stacks.forEach(stack => {
        const cards = stack.querySelectorAll('.panel-article-card');

        cards.forEach((card, index) => {
            // Set initial z-indexes explicitly
            if (index === 0) card.style.zIndex = '3';
            if (index === 1) card.style.zIndex = '2';
            if (index === 2) card.style.zIndex = '1';

            card.addEventListener('click', () => {
                // Get clicked card index
                const clickedIndex = Array.from(cards).indexOf(card);

                // Only proceed if not the top card
                if (clickedIndex !== 0) {
                    // Find the current top card
                    const topCard = stack.querySelector('.panel-article-card:first-child');

                    // Swap z-indexes
                    const clickedZIndex = card.style.zIndex;
                    card.style.zIndex = topCard.style.zIndex;
                    topCard.style.zIndex = clickedZIndex;
                }
            });
        });
    });
}

////////// Tag Scroll Implementation //////////
function initTagScroll() {
    const container = document.querySelector('.filter-btns');
    const leftBtn = document.querySelector('.scroll-left');
    const rightBtn = document.querySelector('.scroll-right');

    if (!container || !leftBtn || !rightBtn) return;

    // Variables for drag scrolling
    let isMouseDown = false;
    let startX;
    let scrollLeft;

    // Touch and mouse event handlers
    function handleDragStart(e) {
        isMouseDown = true;
        container.style.cursor = 'grabbing';
        container.style.userSelect = 'none';

        // Get starting position (works for both mouse and touch)
        startX = (e.pageX || e.touches[0].pageX) - container.offsetLeft;
        scrollLeft = container.scrollLeft;
    }

    function handleDragEnd() {
        isMouseDown = false;
        container.style.cursor = 'grab';
        container.style.removeProperty('user-select');
    }

    function handleDragMove(e) {
        if (!isMouseDown) return;
        e.preventDefault();

        // Calculate new position (works for both mouse and touch)
        const x = (e.pageX || e.touches[0].pageX) - container.offsetLeft;
        const walk = (x - startX) * 2; // Multiply by 2 for faster scrolling
        container.scrollLeft = scrollLeft - walk;
    }

    // Add mouse event listeners for desktop
    container.addEventListener('mousedown', handleDragStart);
    container.addEventListener('mouseleave', handleDragEnd);
    container.addEventListener('mouseup', handleDragEnd);
    container.addEventListener('mousemove', handleDragMove);

    // Add touch event listeners for mobile
    container.addEventListener('touchstart', handleDragStart);
    container.addEventListener('touchend', handleDragEnd);
    container.addEventListener('touchmove', handleDragMove);

    // Your existing scroll button code
    function checkScroll() {
        const { scrollLeft, scrollWidth, clientWidth } = container;
        leftBtn.classList.toggle('visible', scrollLeft > 0);
        rightBtn.classList.toggle('visible', scrollLeft < scrollWidth - clientWidth - 1);
    }

    function scroll(direction) {
        const scrollAmount = 200;
        container.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth'
        });
    }

    checkScroll();
    container.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    leftBtn.addEventListener('click', () => scroll('left'));
    rightBtn.addEventListener('click', () => scroll('right'));
}

function initHeaderDropdown() {
    const dropdown = document.querySelector('.header-dropdown');
    const button = dropdown.querySelector('.header-dropdown-button');
    const content = dropdown.querySelector('.header-dropdown-content');
    const overlay = dropdown.querySelector('.header-dropdown-overlay');
    const backdrop = dropdown.querySelector('.header-dropdown-backdrop');

    let isOpen = false;
    let timeoutId = null;

    function closeDropdown() {
        isOpen = false;
        dropdown.classList.remove('active');
        button.setAttribute('aria-expanded', 'false');
        content.setAttribute('aria-hidden', 'true');
        overlay.style.display = 'none';
        backdrop.style.display = 'none';
    }

    function openDropdown() {
        isOpen = true;
        dropdown.classList.add('active');
        button.setAttribute('aria-expanded', 'true');
        content.setAttribute('aria-hidden', 'false');
        overlay.style.display = 'block';
        backdrop.style.display = 'block';
    }

    // Toggle on button click
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });

    // Handle mouse interactions with both content and overlay
    function handleMouseLeave() {
        if (isOpen) {
            timeoutId = setTimeout(closeDropdown, 100);
        }
    }

    function handleMouseEnter() {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    }

    // Apply mouse events to both dropdown and content
    [dropdown, content].forEach(element => {
        element.addEventListener('mouseleave', handleMouseLeave);
        element.addEventListener('mouseenter', handleMouseEnter);
    });

    // Close when clicking overlay or outside
    [overlay, backdrop].forEach(element => {
        element.addEventListener('click', closeDropdown);
        element.addEventListener('mouseover', handleMouseLeave);
    });

    // Close when clicking anywhere outside
    document.addEventListener('click', (e) => {
        if (isOpen && !dropdown.contains(e.target)) {
            closeDropdown();
        }
    });

    // Handle keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) {
            closeDropdown();
        }
    });
}

class InfiniteCarousel {
    constructor(containerId = 'carousel-container') {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.track = this.container.querySelector('.carousel-track');
        if (!this.track) return;

        this.scrollPosition = 0;
        this.isHovered = false;
        this.animationFrame = null;
        this.init();
    }

    init() {
        this.setupCarousel();
        this.addEventListeners();
        setTimeout(() => {
            this.track.classList.add('loaded');
            this.startAnimation();
        }, 100);
    }

    setupCarousel() {
        const originalCards = Array.from(this.track.querySelectorAll('.article-card'));
        if (!originalCards.length) return;

        // Add performance optimizations
        this.track.style.willChange = 'transform';
        this.track.style.backfaceVisibility = 'hidden';
        this.track.style.transform = 'translate3d(0, 0, 0)';

        const cardWidth = originalCards[0].offsetWidth;
        const gapWidth = 24;
        const setWidth = originalCards.length * (cardWidth + gapWidth);

        // Clone sets for more buffer
        for (let i = 0; i < 4; i++) {
            const cloneSet = originalCards.map(card => card.cloneNode(true));
            cloneSet.forEach(card => this.track.appendChild(card));
        }

        this.totalWidth = setWidth;
        this.resetPoint = -(setWidth * 3);
    }

    startAnimation() {
        let lastTime = performance.now();

        const animate = (currentTime) => {
            const deltaTime = (currentTime - lastTime) / 16; // Normalize to ~60fps
            lastTime = currentTime;

            const speed = this.isHovered ? 0.5 : 1.3;
            this.scrollPosition -= speed * deltaTime;

            if (this.scrollPosition <= this.resetPoint) {
                this.scrollPosition += this.totalWidth;
            }

            this.track.style.transform = `translate3d(${this.scrollPosition}px, 0, 0)`;
            this.animationFrame = requestAnimationFrame(animate);
        };

        animate(performance.now());
    }

    addEventListeners() {
        // Mouse events
        this.track.addEventListener('mouseenter', () => {
            this.isHovered = true;
        });

        this.track.addEventListener('mouseleave', () => {
            this.isHovered = false;
        });

        // Touch events for mobile
        if ('ontouchstart' in window) {
            this.track.addEventListener('touchstart', () => {
                this.isHovered = true;
            });

            this.track.addEventListener('touchend', () => {
                this.isHovered = false;
            });
        }

        // Window resize handling
        window.addEventListener('resize', () => {
            cancelAnimationFrame(this.animationFrame);
            this.setupCarousel();
            this.startAnimation();
        });

        // Visibility change handling
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                cancelAnimationFrame(this.animationFrame);
            } else {
                this.startAnimation();
            }
        });
    }
}

function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const SCROLL_THRESHOLD = 10;
    let ticking = false;

    function updateHeader() {
        const scrolled = window.scrollY > SCROLL_THRESHOLD;
        header.classList.toggle('scrolled', scrolled);
        ticking = false;
    }

    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(() => {
                updateHeader();
            });
            ticking = true;
        }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateHeader();
}

document.addEventListener('DOMContentLoaded', () => {
    initSkipLink();
    initGlobalHandlers();
    window.__articleNavigation = initArticleNavigation();
    initOffCanvas();
    initImageLoading();
    initComments();
    initPriceToggle();
    initGridLayout();
    initSidenotes();
    initTestimonials();
    initWeatherDisplay();
    initKnicksCounter();
    initRelatedArticlesPanel();
    initRelatedArticleInteractions();
    initTagScroll();
    initHeaderDropdown();
    new InfiniteCarousel();
    initHeaderScroll();

    // Initialize native share functionality
    const nativeShareButtons = document.querySelectorAll('.native-share');
    const shareSeparators = document.querySelectorAll('.share-separator');

    if (navigator.share) {  // Changed from canShare to share
        // Show both the button and separator
        nativeShareButtons.forEach(btn => btn.style.display = 'block');
        shareSeparators.forEach(sep => sep.style.display = 'block');

        nativeShareButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();

                if (!RateLimiter.checkLimit('shareAction', 10)) {
                    console.warn('Too many share attempts');
                    return;
                }

                const article = e.target.closest('article');
                if (!article) return;

                const articleLink = article.querySelector('h2 a');
                const url = articleLink ? articleLink.href : window.location.href;
                const rawTitle = articleLink ? articleLink.textContent : document.title;
                const sanitizedTitle = sanitizeText(rawTitle);

                if (!isValidUrl(url)) {
                    console.error('Invalid URL detected');
                    return;
                }

                try {
                    await navigator.share({
                        title: sanitizedTitle,
                        text: sanitizedTitle,  // Added text field for better compatibility
                        url: url
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') {  // Ignore user cancellations
                        console.error('Share failed:', err);
                    }
                }
            });
        });
    }
});

////////// Skip Link //////////
function initSkipLink() {
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const main = document.querySelector('main');
            if (main) {
                main.setAttribute('tabindex', '-1');
                main.focus();
                main.scrollIntoView();
            }
        });
    }
}

////////// Article Navigation //////////
function initArticleNavigation() {
    let articles = document.querySelectorAll('article');
    if (!articles.length) return;

    let currentArticleIndex = 0;

    // Add navigation hints for screen readers
    const navHint = document.createElement('div');
    navHint.className = 'visually-hidden';
    navHint.setAttribute('role', 'status');
    navHint.textContent = 'Use J and K keys to navigate between articles';
    document.body.appendChild(navHint);

    function updateArticleIndices() {
        articles = document.querySelectorAll('article'); // Get fresh list
        articles.forEach((article, index) => {
            article.setAttribute('tabindex', '-1');
            article.setAttribute('data-article-index', index.toString());
        });
    }

    // Initial setup
    updateArticleIndices();

    // Handle keyboard navigation
    function handleKeyNavigation(e) {
        if (e.target.matches('input, textarea')) return;

        let nextIndex = currentArticleIndex;

        switch(e.key.toLowerCase()) {
            case 'j':
                e.preventDefault();
                nextIndex = Math.min(currentArticleIndex + 1, articles.length - 1);
                break;
            case 'k':
                e.preventDefault();
                nextIndex = Math.max(currentArticleIndex - 1, 0);
                break;
        }

        if (nextIndex !== currentArticleIndex) {
            const nextArticle = articles[nextIndex];
            currentArticleIndex = nextIndex;

            nextArticle.scrollIntoView({ behavior: 'smooth', block: 'start' });
            nextArticle.focus();

            const title = nextArticle.querySelector('h2')?.textContent || 'Article';
            const position = `${nextIndex + 1} of ${articles.length}`;

            const announcement = document.createElement('div');
            announcement.setAttribute('role', 'status');
            announcement.setAttribute('aria-live', 'polite');
            announcement.className = 'visually-hidden';
            announcement.textContent = `${title}. Article ${position}`;
            document.body.appendChild(announcement);
            setTimeout(() => announcement.remove(), 1000);
        }
    }

    document.addEventListener('keydown', handleKeyNavigation);

    // Add visual focus styles
    const style = document.createElement('style');
    style.textContent = `
        article:focus {
            outline: 2px solid #007bff;
            outline-offset: 8px;
        }
        article:focus:not(:focus-visible) {
            outline: none;
        }
    `;
    document.head.appendChild(style);

    // Return the update function so we can call it when new articles are loaded
    return updateArticleIndices;
}

////////// Global Event Handlers //////////
function initGlobalHandlers() {
    document.addEventListener('click', (e) => {
        if (!RateLimiter.checkLimit('globalClicks', 100, 60000)) {
            console.warn('Too many clicks detected');
            return;
        }

        // Handle clipboard clicks
       if (e.target.closest('.copy-url')) {
           e.preventDefault();
           handleClipboardClick(e);  // This calls your working clipboard function
       }

        // Handle email shares
       if (e.target.closest('.email-share')) {
           e.preventDefault();
           handleEmailShare(e);  // This calls your working email function
       }

        // Handle native share
        if (e.target.closest('.native-share')) {
            e.preventDefault();
            const article = e.target.closest('article');
            if (!article) return;

            const articleLink = article.querySelector('h2 a');
            const url = articleLink ? articleLink.href : window.location.href;
            const rawTitle = articleLink ? articleLink.textContent : document.title;
            const sanitizedTitle = sanitizeText(rawTitle);

            const shareData = {
                title: sanitizedTitle,
                text: sanitizedTitle,
                url: url
            };

            // First check if we can share this specific data
            if (navigator.canShare && navigator.canShare(shareData)) {
                navigator.share(shareData)
                    .then(() => console.log('Shared successfully'))
                    .catch((err) => {
                        if (err.name !== 'AbortError') {
                            console.error('Share failed:', err);
                        }
                    });
            } else if (navigator.share) {
                // Fallback to just checking share API availability
                navigator.share(shareData)
                    .then(() => console.log('Shared successfully'))
                    .catch((err) => {
                        if (err.name !== 'AbortError') {
                            console.error('Share failed:', err);
                        }
                    });
            } else {
                console.log('Web Share API not supported');
            }
        }

        // Handle WhatsApp shares
        if (e.target.closest('.whatsapp-share')) {
            e.preventDefault();
            const article = e.target.closest('article');
            if (!article) return;

            const articleLink = article.querySelector('h2 a');
            const url = articleLink ? articleLink.href : window.location.href;
            const rawTitle = articleLink ? articleLink.textContent : document.title;
            const sanitizedTitle = sanitizeText(rawTitle);

            if (!isValidUrl(url)) {
                console.error('Invalid URL detected');
                return;
            }

            window.open(getWhatsAppShareUrl(url, sanitizedTitle), '_blank', 'noopener,noreferrer');
        }

    // Handle Mastodon shares
    if (e.target.closest('.mastodon-share')) {
        e.preventDefault();
        e.stopPropagation();

        if (!RateLimiter.checkLimit('mastodonShare', 10)) {
            console.warn('Too many share attempts');
            return;
        }

        const article = e.target.closest('article');
        if (!article) return;

        const articleLink = article.querySelector('h2 a');
        const url = articleLink ? articleLink.href : window.location.href;
        const rawTitle = articleLink ? articleLink.textContent : document.title;
        const sanitizedTitle = sanitizeText(rawTitle);

        let instance = window.prompt('Enter your Mastodon instance URL:', localStorage.getItem('mastodon-instance') || 'mastodon.social');

        if (instance) {
            const cleanInstance = instance
                .replace(/^https?:\/\//, '')
                .replace(/\/$/, '')
                .replace(/[<>'"`{}()\[\]]/g, '');
            const shareText = `${sanitizedTitle}\n\n${url}`;
            const shareUrl = `https://${cleanInstance}/share?text=${encodeURIComponent(shareText)}`;
            window.open(shareUrl, '_blank', 'noopener,noreferrer');
            localStorage.setItem('mastodon-instance', cleanInstance);
        }
    }

        // Handle dropdowns
        const dropdownBtn = e.target.closest('.dropdown-btn');
        if (dropdownBtn && dropdownBtn.parentElement) {
            const dropdown = dropdownBtn.nextElementSibling;
            if (dropdown && dropdown.classList.contains('dropdown-menu')) {
                const isExpanded = dropdown.classList.contains('active');
                dropdown.classList.toggle('active');
                dropdownBtn.setAttribute(ARIA_ATTRS.EXPANDED, (!isExpanded).toString());
                dropdown.setAttribute(ARIA_ATTRS.HIDDEN, isExpanded.toString());
            }
        }
    });

    // Add keyboard handler for interactive elements
    document.addEventListener('keydown', (e) => {
        // Handle dropdown keyboard interactions
        const dropdownBtn = e.target.closest('.dropdown-btn');
        if (dropdownBtn) {
            const dropdown = dropdownBtn.nextElementSibling;

            switch (e.key) {
                case KEYS.ENTER:
                case KEYS.SPACE:
                    e.preventDefault();
                    dropdownBtn.click();
                    break;
                case KEYS.ESCAPE:
                    if (dropdown?.classList.contains('active')) {
                        e.preventDefault();
                        dropdownBtn.click();
                        dropdownBtn.focus();
                    }
                    break;
            }
        }

        // Handle general Escape key for any open menus
        if (e.key === KEYS.ESCAPE) {
            const openDropdowns = document.querySelectorAll('.dropdown-menu.active');
            openDropdowns.forEach(dropdown => {
                const btn = dropdown.previousElementSibling;
                dropdown.classList.remove('active');
                dropdown.setAttribute(ARIA_ATTRS.HIDDEN, 'true');
                if (btn) {
                    btn.setAttribute(ARIA_ATTRS.EXPANDED, 'false');
                    btn.focus();
                }
            });
        }
    });
}

////////// Price Toggle //////////
function initPriceToggle() {
    const toggle = document.querySelector('.toggle');
    if (!toggle) return;

    const toggleButtons = document.querySelectorAll('.toggle button');
    const yearlyElements = document.querySelectorAll('[data-yearly]');
    const monthlyElements = document.querySelectorAll('[data-monthly]');

    toggleButtons.forEach(button => {
        // Add ARIA attributes
        button.setAttribute('role', 'switch');
        button.setAttribute(ARIA_ATTRS.CHECKED, 'false');

        button.addEventListener('click', () => {
            const priceType = button.getAttribute('data-price');
            if (!['yearly', 'monthly'].includes(priceType)) return;

            // Update ARIA states
            toggleButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute(ARIA_ATTRS.CHECKED, 'false');
            });
            button.classList.add('active');
            button.setAttribute(ARIA_ATTRS.CHECKED, 'true');

            toggle.setAttribute('data-active-price', priceType);

            const isYearly = priceType === 'yearly';
            yearlyElements.forEach(el => {
                el.style.display = isYearly ? 'block' : 'none';
                el.setAttribute(ARIA_ATTRS.HIDDEN, (!isYearly).toString());
            });
            monthlyElements.forEach(el => {
                el.style.display = isYearly ? 'none' : 'block';
                el.setAttribute(ARIA_ATTRS.HIDDEN, isYearly.toString());
            });
        });

        // Add keyboard support
        button.addEventListener('keydown', (e) => {
            if (e.key === KEYS.ENTER || e.key === KEYS.SPACE) {
                e.preventDefault();
                button.click();
            }
        });
    });
}

////////// Add to Clipboard Functionality //////////
async function handleClipboardClick(e) {
    e.preventDefault();

    if (!RateLimiter.checkLimit('clipboardCopy', 10)) {
        console.warn('Too many clipboard attempts');
        return;
    }

    const article = e.target.closest('article');
    if (!article) return;

    const articleLink = article.querySelector('h2 a');
    const url = articleLink ? articleLink.href : window.location.href;

    try {
        await navigator.clipboard.writeText(url);
        const target = e.target.closest('.copy-url');
        showCopyAlert(target, true);
    } catch (err) {
        console.error('Failed to copy URL:', err);
        showCopyAlert(e.target, false);
    }
}

// Function to show the copy confirmation
function showCopyAlert(target, success = true) {
    const dropdownMenu = target.closest('.dropdown');
    if (!dropdownMenu) return;

    const rect = dropdownMenu.getBoundingClientRect();
    const alertBox = document.createElement('div');
    alertBox.className = 'copy-alert';
    alertBox.setAttribute('role', 'alert');
    alertBox.setAttribute('aria-live', 'polite');

    Object.assign(alertBox.style, {
        position: 'fixed',
        left: `${rect.left + (rect.width / 2)}px`,
        bottom: `${window.innerHeight - rect.top + 10}px`,
        backgroundColor: success ? '#333' : '#dc3545',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '4px',
        zIndex: '1000',
        fontSize: '14px',
        fontFamily: 'var(--sans-serif)',
        opacity: '0',
        transition: 'opacity 0.3s ease-in-out',
        whiteSpace: 'nowrap',
        transform: 'translateX(-50%)'
    });

    alertBox.textContent = success ? 'URL copied to clipboard' : 'Failed to copy URL';
    document.body.appendChild(alertBox);

    requestAnimationFrame(() => {
        alertBox.style.opacity = '1';
        setTimeout(() => {
            alertBox.style.opacity = '0';
            setTimeout(() => alertBox.remove(), 300);
        }, 2000);
    });
}

////////// Social Share Handlers //////////
function getWhatsAppShareUrl(url, title) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const whatsappBase = isMobile ? 'whatsapp://send' : 'https://web.whatsapp.com/send';
    const shareText = `${title}\n\n${url}`;
    return `${whatsappBase}?text=${encodeURIComponent(shareText)}`;
}

////////// Slideover Menu //////////
function initOffCanvas() {
    const html = document.documentElement;
    const burger = document.querySelector('.burger');
    const canvasClose = document.querySelector('.canvas-close');
    const dimmer = document.querySelector('.dimmer');
    const offCanvas = document.querySelector('.off-canvas');

    if (!burger || !canvasClose || !dimmer || !offCanvas) return;

    // Initialize ARIA attributes
    burger.setAttribute(ARIA_ATTRS.EXPANDED, 'false');
    burger.setAttribute(ARIA_ATTRS.CONTROLS, 'off-canvas-menu');
    offCanvas.setAttribute('id', 'off-canvas-menu');
    offCanvas.setAttribute(ARIA_ATTRS.HIDDEN, 'true');
    offCanvas.setAttribute('role', 'dialog');
    offCanvas.setAttribute(ARIA_ATTRS.LABEL, 'Side Menu');

    let lastFocusedElement;
    let removeFocusTrap;

    function toggleDimmer(action) {
        if (!['open', 'close'].includes(action)) return;
        dimmer.style.display = action === 'open' ? 'block' : 'none';
        dimmer.style.opacity = action === 'open' ? '1' : '0';
        dimmer.setAttribute(ARIA_ATTRS.HIDDEN, action === 'close' ? 'true' : 'false');
    }

    function openCanvas() {
        lastFocusedElement = document.activeElement;
        html.classList.add('canvas-opened', 'canvas-visible');
        burger.setAttribute(ARIA_ATTRS.EXPANDED, 'true');
        offCanvas.setAttribute(ARIA_ATTRS.HIDDEN, 'false');
        toggleDimmer('open');

        // Focus first focusable element in off-canvas
        const firstFocusable = offCanvas.querySelector('a[href], button:not([disabled])');
        firstFocusable?.focus();

        // Set up focus trap
        removeFocusTrap = trapFocus(offCanvas);
    }

    function closeCanvas() {
        html.classList.remove('canvas-opened');
        burger.setAttribute(ARIA_ATTRS.EXPANDED, 'false');
        offCanvas.setAttribute(ARIA_ATTRS.HIDDEN, 'true');
        toggleDimmer('close');

        // Remove focus trap
        if (removeFocusTrap) {
            removeFocusTrap();
        }

        // Return focus
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    }

    burger.addEventListener('click', openCanvas);
    canvasClose.addEventListener('click', closeCanvas);
    dimmer.addEventListener('click', closeCanvas);

    document.addEventListener('keydown', (e) => {
        if (e.key === KEYS.ESCAPE && html.classList.contains('canvas-opened')) {
            closeCanvas();
        }
    });
}

////////// Images //////////
function initImageLoading() {
    let observer;

    const handleAboveFoldImages = () => {
        if (observer) {
            observer.disconnect();
        }

        const viewportHeight = window.innerHeight;
        const buffer = 100;

        observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting &&
                    entry.boundingClientRect.top < (viewportHeight + buffer) &&
                    entry.target instanceof HTMLImageElement) {
                    const img = entry.target;
                    // Ensure alt text is present
                    if (!img.hasAttribute('alt')) {
                        img.setAttribute('alt', '');
                    }
                    img.removeAttribute('loading');
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            if (img instanceof HTMLImageElement) {
                observer.observe(img);
            }
        });
    };

    handleAboveFoldImages();
    window.addEventListener('resize', debounce(handleAboveFoldImages, 250));
}

////////// Comment Box Show/Hide //////////
function initComments() {
    const showCommentsBtn = document.getElementById('showCommentsBtn');
    const commentBlock = document.getElementById('commentBlock');
    if (!showCommentsBtn || !commentBlock) return;

    // Initialize ARIA attributes
    showCommentsBtn.setAttribute(ARIA_ATTRS.EXPANDED, 'false');
    showCommentsBtn.setAttribute(ARIA_ATTRS.CONTROLS, 'commentBlock');
    commentBlock.setAttribute(ARIA_ATTRS.HIDDEN, 'true');

    showCommentsBtn.addEventListener('click', () => {
        const isVisible = commentBlock.style.display !== 'none';
        commentBlock.style.display = isVisible ? 'none' : 'block';
        showCommentsBtn.setAttribute(ARIA_ATTRS.EXPANDED, (!isVisible).toString());
        commentBlock.setAttribute(ARIA_ATTRS.HIDDEN, isVisible.toString());

        // Announce state change to screen readers
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'visually-hidden';
        announcement.textContent = `Comments are now ${isVisible ? 'hidden' : 'visible'}`;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    });

    // Add keyboard support
    showCommentsBtn.addEventListener('keydown', (e) => {
        if (e.key === KEYS.ENTER || e.key === KEYS.SPACE) {
            e.preventDefault();
            showCommentsBtn.click();
        }
    });
}

////////// Share via Email //////////
function handleEmailShare(e) {
    e.preventDefault();

    if (!RateLimiter.checkLimit('emailShare', 10)) {
        console.warn('Too many email share attempts');
        return;
    }

    const article = e.target.closest('article');
    if (!article) return;

    const articleLink = article.querySelector('h2 a');
    const url = articleLink ? articleLink.href : window.location.href;
    const rawTitle = articleLink ? articleLink.textContent : document.title;
    const sanitizedTitle = sanitizeText(rawTitle);

    const emailSubject = `Check out this article: ${sanitizedTitle}`;
    const emailBody = `I thought you might enjoy this article:\n\n${sanitizedTitle}\n\n${url}`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

    // Create and click a temporary link
    const tempLink = document.createElement('a');
    tempLink.href = mailtoUrl;
    tempLink.style.display = 'none';
    document.body.appendChild(tempLink);
    tempLink.click();
    document.body.removeChild(tempLink);
}

////////// Masonry Layout and Infinite Load More Posts //////////
/**
 * Initializes the masonry grid layout and post filtering
 * - Sets up Isotope for masonry layout
 * - Initializes post filtering system
 * - Adds proper ARIA attributes for accessibility
 * - Prepares posts for filtering by adding class names
 */

function initGridLayout() {
     const articleList = document.querySelector('.article-list');
     if (!articleList) return;

     articleList.setAttribute('role', 'feed');
     articleList.setAttribute('aria-label', 'Article list');

     const iso = new Isotope(articleList, {
         itemSelector: '.post',
         percentPosition: true,
         layoutMode: 'masonry',
         masonry: {
             columnWidth: '.grid-sizer',
             fitWidth: true,
             gutter: 30
         }
     });

     // Initialize posts with proper filter classes
     const posts = articleList.querySelectorAll('.post');
     posts.forEach(post => {
         const primaryTag = post.querySelector('.primary-tag');
         if (primaryTag) {
             const tagClass = sanitizeText(primaryTag.textContent)
                 .trim()
                 .toLowerCase()
                 .replace(/[^a-z0-9-]/g, '-');
             post.classList.add(tagClass);
         }

         const img = post.querySelector('img');
         if (img) {
             img.addEventListener('load', () => {
                 iso.layout();
             });
         }
     });

     const handleFilterSelect = initPostFilter(iso);

     window.__components = {
         infiniteLoader: new InfiniteLoader(iso, handleFilterSelect)
     };

     iso.layout();
 }

/**
 * Handles infinite scroll functionality for posts
 * Features:
 * - Lazy loads posts as user scrolls
 * - Maintains filter state
 * - Handles errors and retries
 * - Supports both desktop and mobile
 * - Includes accessibility announcements
 */

class InfiniteLoader {
    constructor(iso, handleFilterSelect) {
        this._iso = iso;
        this._handleFilterSelect = handleFilterSelect;
        this._nextDom = document;
        this._loader = document.getElementById('read-more-trigger');
        this._postList = document.querySelector('.article-list');
        this._loadingFlag = false;
        this._currentFilter = 'all';
        this._loadedPages = 1;
        this._maxRetries = 3;
        this._retryDelay = 1000; // 1 second
        this._isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        this._updateArticleNavigation = null;
        this._cachedPosts = new Map(); // Cache for loaded posts
        this._hasMoreFilteredPosts = true;
        this._initializeAccessibility();
        this._subscribeToLoadMore();
    }

    _initializeAccessibility() {
        if (this._loader) {
            this._loader.setAttribute('role', 'button');
            this._loader.setAttribute('aria-label', 'Load more posts');
            if (!this._loader.hasAttribute('tabindex')) {
                this._loader.setAttribute('tabindex', '0');
            }
        }
        this._updateArticleNavigation = window.__articleNavigation;
    }

    _subscribeToLoadMore() {
        if (!this._loader) return;

        const loadMoreHandler = async () => {
            if (this._loadingFlag) return;

            this._loadingFlag = true;
            this._updateLoaderState(true);

            try {
                const selectedType = localStorage.getItem('selectedPostType') || 'all';
                const newPosts = await this.loadNextPage();

                if (newPosts && newPosts.length > 0) {
                    await this._processNewPosts(newPosts, selectedType);
                } else {
                    this._showNoMorePosts();
                }

            } catch (error) {
                console.error('Error loading more posts:', error);
                this._announceError();

                // Special handling for localhost
                if (this._isLocalhost) {
                    console.log('Retrying in development mode...');
                    setTimeout(() => {
                        this._loadingFlag = false;
                        loadMoreHandler();
                    }, this._retryDelay);
                }
            } finally {
                if (!this._loader.classList.contains('disabled')) {
                    this._updateLoaderState(false);
                }
            }
        };

        // Add event listeners
        this._loader.addEventListener('click', loadMoreHandler);
        this._loader.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                loadMoreHandler();
            }
        });
    }

    async loadNextPage(retryCount = 0) {
        const next = this._nextDom.querySelector('link[rel="next"]');
        const currentFilter = localStorage.getItem('selectedPostType') || 'all';

        if (!next?.href || (this._loadedPages > 1 && currentFilter !== 'all' && !this._hasMoreFilteredPosts)) {
            this._showNoMorePosts();
            return null;
        }

        try {
            // Add cache busting for localhost
            const url = new URL(next.href);
            if (this._isLocalhost) {
                url.searchParams.set('t', Date.now());
            }

            const response = await fetch(url.toString(), {
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                },
                // Add cache control for development
                cache: this._isLocalhost ? 'no-store' : 'default'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');

            const posts = doc.querySelectorAll('.post');
            if (!posts.length) {
                this._showNoMorePosts();
                return null;
            }

            this._nextDom = doc;
            this._loadedPages++;

            return Array.from(posts);

        } catch (error) {
            console.error('Error in loadNextPage:', error);

            if (retryCount < this._maxRetries) {
                console.log(`Retrying... Attempt ${retryCount + 1} of ${this._maxRetries}`);
                await new Promise(resolve =>
                    setTimeout(resolve, this._retryDelay * (retryCount + 1))
                );
                return this.loadNextPage(retryCount + 1);
            }

            throw error;
        }
    }

    async _processNewPosts(newPosts, currentFilter) {
        if (!newPosts || newPosts.length === 0) {
            this._showNoMorePosts();
            return;
        }

        // Check if we have any posts for the current filter
        if (currentFilter !== 'all') {
            const filteredNewPosts = newPosts.filter(post => {
                const primaryTag = post.querySelector('.primary-tag');
                return primaryTag && this._sanitizeTagName(primaryTag.textContent) === currentFilter;
            });

            if (filteredNewPosts.length === 0) {
                this._showNoMorePosts();
                return;
            }
        }

        // Add posts to DOM and process them
        const processedPosts = newPosts.map(post => {
            const processedPost = this._processPost(post);
            this._postList.appendChild(processedPost);
            return processedPost;
        });

        // Update Isotope
        this._iso.appended(processedPosts);

        // Apply current filter if not showing all posts
        if (currentFilter !== 'all') {
            this._iso.arrange({ filter: `.${currentFilter}` });

            // Check if we found any posts for current filter
            const filteredPosts = processedPosts.filter(post => post.classList.contains(currentFilter));
            if (filteredPosts.length === 0) {
                this._hasMoreFilteredPosts = false;
                this._showNoMorePosts();
                return;
            }
        }

        // Update layout and navigation
        this._iso.layout();
        if (this._updateArticleNavigation) {
            this._updateArticleNavigation();
        }

        // Cache the processed posts
        this._cachedPosts.set(this._loadedPages, processedPosts);

        // Announce new content
        this._announceNewContent(processedPosts.length);
    }

    _processPost(post) {
        const primaryTag = post.querySelector('.primary-tag');
        if (primaryTag) {
            const tagClass = this._sanitizeTagName(primaryTag.textContent);
            post.classList.add(tagClass);
        }
        return post;
    }

    _updateLoaderState(isLoading) {
        if (!this._loader) return;

        this._loadingFlag = isLoading;
        this._loader.classList.toggle('loading', isLoading);
        this._loader.textContent = isLoading ? 'Loading...' : 'Load More';
        this._loader.setAttribute(
            'aria-label',
            isLoading ? 'Loading more posts, please wait' : 'Load more posts'
        );
    }

    _showNoMorePosts() {
        if (this._loader) {
            this._loader.textContent = 'No more posts';
            this._loader.classList.add('disabled');
            this._loader.setAttribute('aria-disabled', 'true');
            this._loader.style.cursor = 'default';
            // Announce to screen readers
            this._announceNewContent('No more posts available');
        }
    }

    _announceNewContent(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'visually-hidden';
        announcement.textContent = typeof message === 'number' ?
            `${message} new posts loaded` : message;
        document.body.appendChild(announcement);
        setTimeout(() => announcement.remove(), 1000);
    }

    _announceError() {
        const errorAnnouncement = document.createElement('div');
        errorAnnouncement.setAttribute('role', 'alert');
        errorAnnouncement.className = 'visually-hidden';
        errorAnnouncement.textContent = 'Error loading more posts. Retrying...';
        document.body.appendChild(errorAnnouncement);
        setTimeout(() => errorAnnouncement.remove(), 1000);
    }

    _sanitizeTagName(tagName) {
        return tagName
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-');
    }
}
