/**
 * Authentication Service
 * Handles JWT authentication with Zone01 Kisumu API
 * Supports both username:password and email:password authentication
 */

class AuthService {
    constructor() {
        this.apiUrl = 'https://learn.zone01kisumu.ke/api/auth/signin';
        this.token = null;
        this.user = null;
    }

    /**
     * Authenticate user with Basic authentication (base64 encoded)
     * @param {string} identifier - Username or email
     * @param {string} password - User password
     * @returns {Promise<string>} JWT token
     */
    async authenticate(identifier, password) {
        try {
            // Create Basic auth header with base64 encoding
            const credentials = btoa(`${identifier.trim()}:${password.trim()}`);
            
            console.log('Attempting authentication for:', identifier);
            
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            console.log('Authentication response status:', response.status);

            if (response.status === 401) {
                throw new Error('Invalid username/email or password');
            }

            if (response.status === 403) {
                throw new Error('Access forbidden - check your account permissions');
            }

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Authentication error response:', errorText);
                throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.text(); // Get as text first
            console.log('Authentication response data:', data);

            // Handle different response formats
            let token;

            // Check if response is a JWT token directly (without quotes)
            if (typeof data === 'string' && data.startsWith('eyJ')) {
                token = data;
                console.log('Token received directly as string');
            }
            // Check if response is a JSON string containing the JWT
            else if (typeof data === 'string' && data.startsWith('"eyJ') && data.endsWith('"')) {
                // Remove the surrounding quotes
                token = data.slice(1, -1);
                console.log('Token received as JSON string, extracted:', token.substring(0, 50) + '...');
            }
            // Try to parse as JSON object
            else {
                try {
                    const jsonData = JSON.parse(data);
                    token = this.extractToken(jsonData);
                    console.log('Token extracted from JSON object');
                } catch (e) {
                    console.error('Could not parse response as JSON:', e);
                    throw new Error('Invalid response format');
                }
            }

            if (!token) {
                console.error('No token found in response:', data);
                throw new Error('Authentication succeeded but no token received');
            }

            // Store token and decode user info
            this.token = token;
            this.user = this.decodeJWT(token);
            
            // Store in session storage
            sessionStorage.setItem('authToken', token);
            sessionStorage.setItem('userInfo', JSON.stringify(this.user));

            console.log('Authentication successful, user:', this.user);
            return token;

        } catch (error) {
            console.error('Authentication error:', error);
            throw error;
        }
    }

    /**
     * Extract token from various possible response formats
     * @param {Object} data - Response data
     * @returns {string|null} JWT token
     */
    extractToken(data) {
        // Try different possible token field names
        return data.token || 
               data.access_token || 
               data.jwt || 
               data.authToken ||
               data.data?.token ||
               data.data?.access_token ||
               data.data?.jwt ||
               null;
    }

    /**
     * Decode JWT token to extract user information
     * @param {string} token - JWT token
     * @returns {Object} Decoded user info
     */
    decodeJWT(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new Error('Invalid JWT format');
            }

            const payload = parts[1];
            // Add padding if needed for base64 decoding
            const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
            const decoded = JSON.parse(atob(paddedPayload));
            
            console.log('Decoded JWT payload:', decoded);
            return decoded;
        } catch (error) {
            console.error('Error decoding JWT:', error);
            return { error: 'Could not decode token' };
        }
    }

    /**
     * Check if user is currently authenticated
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        if (this.token) {
            return true;
        }

        // Check session storage
        const storedToken = sessionStorage.getItem('authToken');
        if (storedToken) {
            this.token = storedToken;
            const storedUser = sessionStorage.getItem('userInfo');
            if (storedUser) {
                try {
                    this.user = JSON.parse(storedUser);
                } catch (e) {
                    this.user = this.decodeJWT(storedToken);
                }
            }
            return true;
        }

        return false;
    }

    /**
     * Get current authentication token
     * @returns {string|null} JWT token
     */
    getToken() {
        return this.token || sessionStorage.getItem('authToken');
    }

    /**
     * Get current user information
     * @returns {Object|null} User info
     */
    getUser() {
        if (this.user) {
            return this.user;
        }

        const storedUser = sessionStorage.getItem('userInfo');
        if (storedUser) {
            try {
                this.user = JSON.parse(storedUser);
                return this.user;
            } catch (e) {
                console.error('Error parsing stored user info:', e);
            }
        }

        return null;
    }

    /**
     * Get user ID from token
     * @returns {string|number|null} User ID
     */
    getUserId() {
        const user = this.getUser();

        // Try different possible locations for user ID
        let userId = user?.sub ||
                    user?.id ||
                    user?.userId ||
                    user?.['https://hasura.io/jwt/claims']?.['x-hasura-user-id'] ||
                    null;

        // Convert to number if it's a string number (for GraphQL compatibility)
        if (userId && typeof userId === 'string' && !isNaN(userId)) {
            return parseInt(userId, 10);
        }

        return userId;
    }

    /**
     * Logout user and clear stored data
     */
    logout() {
        this.token = null;
        this.user = null;
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userInfo');
        console.log('User logged out');
    }

    /**
     * Get authorization header for API requests
     * @returns {Object} Authorization header
     */
    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
}

// Create global instance
const authService = new AuthService();

// Export for use in other modules
window.authService = authService;
