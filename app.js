// Quotely App - Main JavaScript File

class QuotelyApp {
    constructor() {
        this.categories = ["Inspiration", "Love", "Humor", "Life", "Wisdom", "Motivation"];
        this.currentCategory = 'Inspiration';
        this.currentQuoteIndex = 0;
        this.quotes = {};
        this.isLoading = false;
        this.apiEndpoint = 'https://zenquotes.io/api/quotes';
        
        // Fallback quotes for offline functionality
        this.fallbackQuotes = {
            "Inspiration": [
                {"text": "The only way to do great work is to love what you do.", "author": "Steve Jobs"},
                {"text": "Innovation distinguishes between a leader and a follower.", "author": "Steve Jobs"},
                {"text": "Life is what happens to you while you're busy making other plans.", "author": "John Lennon"},
                {"text": "The future belongs to those who believe in the beauty of their dreams.", "author": "Eleanor Roosevelt"},
                {"text": "It is during our darkest moments that we must focus to see the light.", "author": "Aristotle"}
            ],
            "Love": [
                {"text": "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.", "author": "Lao Tzu"},
                {"text": "The best thing to hold onto in life is each other.", "author": "Audrey Hepburn"},
                {"text": "Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day.", "author": "Unknown"},
                {"text": "Where there is love there is life.", "author": "Mahatma Gandhi"}
            ],
            "Humor": [
                {"text": "I'm not superstitious, but I am a little stitious.", "author": "Michael Scott"},
                {"text": "The trouble with having an open mind is that people keep coming along and sticking things into it.", "author": "Terry Pratchett"},
                {"text": "I haven't failed. I've just found 10,000 ways that won't work.", "author": "Thomas Edison"},
                {"text": "The only mystery in life is why the kamikaze pilots wore helmets.", "author": "Al McGuire"}
            ],
            "Life": [
                {"text": "In the end, we will remember not the words of our enemies, but the silence of our friends.", "author": "Martin Luther King Jr."},
                {"text": "The purpose of our lives is to be happy.", "author": "Dalai Lama"},
                {"text": "Life is really simple, but we insist on making it complicated.", "author": "Confucius"},
                {"text": "The good life is one inspired by love and guided by knowledge.", "author": "Bertrand Russell"}
            ],
            "Wisdom": [
                {"text": "The only true wisdom is in knowing you know nothing.", "author": "Socrates"},
                {"text": "It is during our darkest moments that we must focus to see the light.", "author": "Aristotle"},
                {"text": "The journey of a thousand miles begins with one step.", "author": "Lao Tzu"},
                {"text": "Yesterday is history, tomorrow is a mystery, today is a gift of God, which is why we call it the present.", "author": "Bill Keane"}
            ],
            "Motivation": [
                {"text": "Success is not final, failure is not fatal: it is the courage to continue that counts.", "author": "Winston Churchill"},
                {"text": "The way to get started is to quit talking and begin doing.", "author": "Walt Disney"},
                {"text": "Don't watch the clock; do what it does. Keep going.", "author": "Sam Levenson"},
                {"text": "The only impossible journey is the one you never begin.", "author": "Tony Robbins"}
            ]
        };

        this.init();
    }

    async init() {
        this.bindEvents();
        this.loadStoredQuotes();
        await this.showLoadingScreen();
        this.showApp();
        await this.fetchInitialQuotes();
        this.displayCurrentQuote();
        this.updateNavigation();
    }

    bindEvents() {
        // Navigation events
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.switchCategory(category);
            });
        });

        // Quote control events
        document.getElementById('prevQuote').addEventListener('click', () => this.previousQuote());
        document.getElementById('nextQuote').addEventListener('click', () => this.nextQuote());
        document.getElementById('newQuote').addEventListener('click', () => this.getNewQuote());

        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const navMenu = document.getElementById('navMenu');
        mobileToggle.addEventListener('click', () => {
            mobileToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close mobile menu when clicking nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });

        // Logo click to return to first quote of current category
        document.querySelectorAll('.logo-mini').forEach(logo => {
            logo.addEventListener('click', () => {
                this.currentQuoteIndex = 0;
                this.displayCurrentQuote();
                this.updateNavigation();
            });
        });

        // Modal events
        document.getElementById('closeErrorModal').addEventListener('click', () => {
            this.hideModal();
        });

        // Close modal when clicking overlay
        document.querySelector('.modal-overlay').addEventListener('click', () => {
            this.hideModal();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousQuote();
            if (e.key === 'ArrowRight') this.nextQuote();
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.getNewQuote();
            }
            if (e.key === 'Escape') this.hideModal();
        });

        // Intersection Observer for animations
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        // Observe quote container for animations
        const quoteContainer = document.getElementById('quoteContainer');
        if (quoteContainer) {
            observer.observe(quoteContainer);
        }
    }

    async showLoadingScreen() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, 3000); // 3 second loading screen
        });
    }

    showApp() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        document.getElementById('app').classList.add('visible');
    }

    loadStoredQuotes() {
        try {
            const stored = sessionStorage.getItem('quotely_quotes');
            if (stored) {
                this.quotes = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load stored quotes:', error);
        }
    }

    saveQuotes() {
        try {
            sessionStorage.setItem('quotely_quotes', JSON.stringify(this.quotes));
        } catch (error) {
            console.warn('Failed to save quotes:', error);
        }
    }

    async fetchInitialQuotes() {
        try {
            // Try to fetch from API
            const response = await fetch(this.apiEndpoint, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) throw new Error('API request failed');
            
            const data = await response.json();
            this.processApiQuotes(data);
            
        } catch (error) {
            console.warn('API fetch failed, using fallback quotes:', error);
            this.useFallbackQuotes();
            this.showErrorModal('Unable to fetch new quotes from server. Using offline quotes instead.');
        }
    }

    processApiQuotes(apiQuotes) {
        // Process and categorize API quotes
        // Since ZenQuotes doesn't provide categories, we'll use our fallback system
        // and mix in some API quotes randomly
        this.quotes = { ...this.fallbackQuotes };
        
        if (apiQuotes && Array.isArray(apiQuotes)) {
            // Randomly distribute API quotes among categories
            apiQuotes.forEach((quote, index) => {
                const categoryIndex = index % this.categories.length;
                const category = this.categories[categoryIndex];
                
                if (!this.quotes[category]) {
                    this.quotes[category] = [];
                }
                
                // Add API quote to category if it doesn't already exist
                const formattedQuote = {
                    text: quote.q || quote.text || 'No quote available',
                    author: quote.a || quote.author || 'Unknown'
                };
                
                const exists = this.quotes[category].some(q => 
                    q.text === formattedQuote.text
                );
                
                if (!exists) {
                    this.quotes[category].push(formattedQuote);
                }
            });
        }
        
        this.saveQuotes();
    }

    useFallbackQuotes() {
        this.quotes = { ...this.fallbackQuotes };
        this.saveQuotes();
    }

    switchCategory(category) {
        if (this.currentCategory === category) return;
        
        this.currentCategory = category;
        this.currentQuoteIndex = 0;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.category === category) {
                item.classList.add('active');
            }
        });

        // Update category display
        document.getElementById('categoryName').textContent = category;
        
        this.displayCurrentQuote();
        this.updateNavigation();
    }

    displayCurrentQuote() {
        const categoryQuotes = this.quotes[this.currentCategory] || [];
        if (categoryQuotes.length === 0) return;

        const quote = categoryQuotes[this.currentQuoteIndex] || categoryQuotes[0];
        
        const quoteText = document.getElementById('quoteText');
        const quoteAuthor = document.getElementById('quoteAuthor');

        // Add fade out animation
        quoteText.classList.add('fade-out');
        quoteAuthor.classList.add('fade-out');

        setTimeout(() => {
            quoteText.textContent = quote.text;
            quoteAuthor.textContent = `— ${quote.author}`;
            
            // Remove fade out and trigger fade in
            quoteText.classList.remove('fade-out');
            quoteAuthor.classList.remove('fade-out');
            
            // Reset animations
            quoteText.style.animation = 'none';
            quoteAuthor.style.animation = 'none';
            
            // Trigger reflow
            quoteText.offsetHeight;
            quoteAuthor.offsetHeight;
            
            // Re-apply animations
            quoteText.style.animation = 'quoteSlideIn 0.6s ease-out forwards';
            quoteAuthor.style.animation = 'authorSlideIn 0.6s ease-out 0.2s forwards';
        }, 300);
    }

    updateNavigation() {
        const categoryQuotes = this.quotes[this.currentCategory] || [];
        const prevBtn = document.getElementById('prevQuote');
        const nextBtn = document.getElementById('nextQuote');

        // Update button states
        prevBtn.disabled = this.currentQuoteIndex === 0;
        nextBtn.disabled = this.currentQuoteIndex >= categoryQuotes.length - 1;

        // Update button accessibility
        if (prevBtn.disabled) {
            prevBtn.setAttribute('aria-label', 'Previous quote (disabled - at first quote)');
        } else {
            prevBtn.setAttribute('aria-label', 'Previous quote');
        }

        if (nextBtn.disabled) {
            nextBtn.setAttribute('aria-label', 'Next quote (disabled - at last quote)');
        } else {
            nextBtn.setAttribute('aria-label', 'Next quote');
        }
    }

    previousQuote() {
        if (this.currentQuoteIndex > 0) {
            this.currentQuoteIndex--;
            this.displayCurrentQuote();
            this.updateNavigation();
        }
    }

    nextQuote() {
        const categoryQuotes = this.quotes[this.currentCategory] || [];
        if (this.currentQuoteIndex < categoryQuotes.length - 1) {
            this.currentQuoteIndex++;
            this.displayCurrentQuote();
            this.updateNavigation();
        }
    }

    getNewQuote() {
        if (this.isLoading) return;
        
        const categoryQuotes = this.quotes[this.currentCategory] || [];
        if (categoryQuotes.length <= 1) return;

        // Get random quote different from current
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * categoryQuotes.length);
        } while (newIndex === this.currentQuoteIndex && categoryQuotes.length > 1);

        this.currentQuoteIndex = newIndex;
        this.displayCurrentQuote();
        this.updateNavigation();
    }

    showErrorModal(message) {
        const modal = document.getElementById('errorModal');
        const messageEl = document.getElementById('errorMessage');
        
        messageEl.textContent = message;
        modal.classList.remove('hidden');
        modal.classList.add('visible');
        
        // Focus on close button for accessibility
        document.getElementById('closeErrorModal').focus();
    }

    hideModal() {
        const modal = document.getElementById('errorModal');
        modal.classList.remove('visible');
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 250);
    }

    // Utility method to handle API rate limiting
    async fetchWithRetry(url, options = {}, retries = 2) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, options);
                if (response.ok) {
                    return response;
                }
                throw new Error(`HTTP ${response.status}`);
            } catch (error) {
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    }

    // Method to refresh quotes from API
    async refreshQuotesFromAPI() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        const newQuoteBtn = document.getElementById('newQuote');
        const originalText = newQuoteBtn.textContent;
        newQuoteBtn.textContent = 'Loading...';
        newQuoteBtn.disabled = true;

        try {
            const response = await this.fetchWithRetry(this.apiEndpoint);
            const data = await response.json();
            this.processApiQuotes(data);
            
        } catch (error) {
            console.warn('Failed to refresh quotes:', error);
            this.showErrorModal('Unable to fetch new quotes. Please try again later.');
        } finally {
            this.isLoading = false;
            newQuoteBtn.textContent = originalText;
            newQuoteBtn.disabled = false;
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
        document.documentElement.classList.add('reduced-motion');
    }

    // Initialize the app
    window.quotely = new QuotelyApp();
});

// Handle visibility change to pause/resume when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause any ongoing operations
        if (window.quotely) {
            window.quotely.isLoading = false;
        }
    }
});

// Service worker registration for potential future offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        // This would be implemented if we had a service worker
        // navigator.serviceWorker.register('/sw.js');
    });
}

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QuotelyApp;
}