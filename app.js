/**
 * Main Application Controller
 * Handles application initialization, routing, and main event handlers
 */

class App {
    constructor() {
        this.currentSection = 'login';
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        console.log('Initializing Zone01 Profile App...');

        // Check if user is already authenticated
        if (authService && authService.isAuthenticated()) {
            console.log('User already authenticated, loading profile...');
            this.showProfile();
        } else {
            console.log('User not authenticated, showing login...');
            this.showLogin();
        }

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', this.handleLogout.bind(this));
        }

        // Handle browser back/forward
        window.addEventListener('popstate', this.handlePopState.bind(this));
    }

    /**
     * Handle login form submission
     * @param {Event} event - Form submission event
     */
    async handleLogin(event) {
        event.preventDefault();
        
        const identifier = document.getElementById('identifier').value.trim();
        const password = document.getElementById('password').value.trim();
        const loginBtn = document.getElementById('login-btn');
        const errorDiv = document.getElementById('login-error');

        // Validate inputs
        if (!identifier || !password) {
            this.showLoginError('Please enter both username/email and password');
            return;
        }

        // Show loading state
        this.setLoginLoading(true);
        this.hideLoginError();

        try {
            console.log('Attempting login for:', identifier);
            
            // Authenticate user
            await authService.authenticate(identifier, password);
            
            console.log('Login successful, loading profile...');
            
            // Show success and transition to profile
            helpers.showSuccess('Login successful! Loading your profile...');
            
            // Small delay for better UX
            setTimeout(() => {
                this.showProfile();
            }, 500);

        } catch (error) {
            console.error('Login failed:', error);
            
            let errorMessage = error.message;
            
            // Provide user-friendly error messages
            if (error.message.includes('401') || error.message.includes('Invalid')) {
                errorMessage = 'Invalid username/email or password. Please check your credentials.';
            } else if (error.message.includes('403')) {
                errorMessage = 'Access forbidden. Please check your account permissions.';
            } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to server. Please check your internet connection.';
            } else if (error.message.includes('CORS')) {
                errorMessage = 'Authentication service temporarily unavailable. Please try again later.';
            }
            
            this.showLoginError(errorMessage);
        } finally {
            this.setLoginLoading(false);
        }
    }

    /**
     * Handle logout
     */
    handleLogout() {
        console.log('Logging out user...');
        
        // Clear authentication
        authService.logout();
        
        // Show login section
        this.showLogin();
        
        // Clear form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.reset();
        }
        
        helpers.showSuccess('You have been logged out successfully.');
    }

    /**
     * Show login section
     */
    showLogin() {
        this.hideAllSections();
        const loginSection = document.getElementById('login-section');

        if (loginSection) {
            loginSection.classList.add('active');
            this.currentSection = 'login';
        } else {
            console.error('Login section not found!');
        }

        // Focus on identifier input
        setTimeout(() => {
            const identifierInput = document.getElementById('identifier');
            if (identifierInput) {
                identifierInput.focus();
            }
        }, 100);
    }

    /**
     * Show profile section and load data
     */
    async showProfile() {
        this.hideAllSections();

        const profileSection = document.getElementById('profile-section');
        const loadingOverlay = document.getElementById('loading-overlay');

        if (profileSection) {
            profileSection.classList.remove('hidden');
            profileSection.style.display = 'block'; // Ensure it's visible
            this.currentSection = 'profile';
            console.log('Profile section shown, classes:', profileSection.className);
        } else {
            console.error('Profile section not found!');
        }

        // Show loading overlay
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }

        try {
            // Get user ID from token
            const userId = authService.getUserId();
            if (!userId) {
                throw new Error('Could not get user ID from authentication token');
            }

            console.log('Loading profile for user ID:', userId);
            


            // Load profile data using the profile component
            if (window.profileComponent) {
                await window.profileComponent.loadProfile(userId);
            } else {
                console.error('Profile component not available');
                throw new Error('Profile component not loaded');
            }

        } catch (error) {
            console.error('Error loading profile:', error);
            helpers.showError(`Error loading profile: ${error.message}`);
            
            // If profile loading fails, go back to login
            setTimeout(() => {
                this.handleLogout();
            }, 2000);
        } finally {
            // Hide loading overlay
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }
    }

    /**
     * Hide all sections
     */
    hideAllSections() {
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            section.classList.remove('active');
            section.classList.add('hidden');
        });
    }

    /**
     * Set login button loading state
     * @param {boolean} loading - Loading state
     */
    setLoginLoading(loading) {
        const loginBtn = document.getElementById('login-btn');
        const btnText = loginBtn?.querySelector('.btn-text');
        const btnLoading = loginBtn?.querySelector('.btn-loading');

        if (loginBtn) {
            loginBtn.disabled = loading;
            
            if (btnText && btnLoading) {
                if (loading) {
                    btnText.classList.add('hidden');
                    btnLoading.classList.remove('hidden');
                } else {
                    btnText.classList.remove('hidden');
                    btnLoading.classList.add('hidden');
                }
            }
        }
    }

    /**
     * Show login error message
     * @param {string} message - Error message
     */
    showLoginError(message) {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('hidden');
            errorDiv.classList.add('fade-in');
        }
    }

    /**
     * Hide login error message
     */
    hideLoginError() {
        const errorDiv = document.getElementById('login-error');
        if (errorDiv) {
            errorDiv.classList.add('hidden');
        }
    }

    /**
     * Handle browser navigation
     * @param {PopStateEvent} event - Pop state event
     */
    handlePopState(event) {
        // Handle browser back/forward navigation if needed
        console.log('Navigation state changed:', event.state);
    }


}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting app...');
    window.app = new App();
});
