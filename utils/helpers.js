/**
 * Utility Helper Functions
 * Common functions used throughout the application
 */

/**
 * Format date to readable string
 * @param {string|Date} dateString - Date to format
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Format date to short format
 * @param {string|Date} dateString - Date to format
 * @returns {string} Short formatted date
 */
function formatDateShort(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
}

/**
 * Format number with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format bytes to human readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted bytes
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage
 */
function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show loading state on element
 * @param {HTMLElement} element - Element to show loading on
 * @param {boolean} loading - Loading state
 */
function setLoading(element, loading) {
    if (loading) {
        element.classList.add('loading');
        element.disabled = true;
    } else {
        element.classList.remove('loading');
        element.disabled = false;
    }
}

/**
 * Show error message
 * @param {string} message - Error message
 * @param {HTMLElement} container - Container to show error in
 */
function showError(message, container = null) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message fade-in';
    errorDiv.textContent = message;
    
    if (container) {
        container.appendChild(errorDiv);
    } else {
        document.body.appendChild(errorDiv);
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.parentNode.removeChild(errorDiv);
        }
    }, 5000);
}

/**
 * Show success message
 * @param {string} message - Success message
 * @param {HTMLElement} container - Container to show message in
 */
function showSuccess(message, container = null) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message fade-in';
    successDiv.style.cssText = `
        background-color: #dcfce7;
        border: 1px solid #bbf7d0;
        color: #166534;
        padding: 0.75rem;
        border-radius: 8px;
        font-size: 0.875rem;
        margin: 0.5rem 0;
    `;
    successDiv.textContent = message;
    
    if (container) {
        container.appendChild(successDiv);
    } else {
        document.body.appendChild(successDiv);
    }
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.parentNode.removeChild(successDiv);
        }
    }, 3000);
}

/**
 * Filter XP data to keep only projects and piscines (exclude all exercises, raids, piscine-go, piscine-rust)
 * @param {Array} xpData - XP transaction data
 * @returns {Array} Filtered XP data
 */
function filterXPData(xpData) {
    return xpData.filter(transaction => {
        const objectType = transaction.object?.type || '';
        const objectName = transaction.object?.name || '';
        const path = transaction.path || '';

        // Filter out all exercises
        if (objectType === 'exercise') {
            return false;
        }

        // Filter out all raids
        if (objectType === 'raid') {
            return false;
        }

        // Filter out piscine-go
        const isPiscineGo = objectType === 'piscine' &&
                           (objectName.toLowerCase().includes('go') ||
                            path.includes('piscine-go') ||
                            objectName.toLowerCase() === 'piscine go');

        // Filter out piscine-rust
        const isPiscineRust = objectType === 'piscine' &&
                             (objectName.toLowerCase().includes('rust') ||
                              path.includes('piscine-rust') ||
                              objectName.toLowerCase() === 'piscine rust');

        return !(isPiscineGo || isPiscineRust);
    });
}

/**
 * Calculate cumulative XP over time
 * @param {Array} xpData - XP transaction data
 * @returns {Array} Cumulative XP data
 */
function calculateCumulativeXP(xpData) {
    const sortedData = [...xpData].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
    );
    
    let cumulativeXP = 0;
    return sortedData.map(transaction => {
        cumulativeXP += transaction.amount;
        return {
            ...transaction,
            cumulativeXP,
            date: new Date(transaction.createdAt)
        };
    });
}

/**
 * Group data by time period
 * @param {Array} data - Data to group
 * @param {string} period - Period to group by ('day', 'week', 'month')
 * @returns {Array} Grouped data
 */
function groupByTimePeriod(data, period = 'month') {
    const groups = {};
    
    data.forEach(item => {
        const date = new Date(item.createdAt);
        let key;
        
        switch (period) {
            case 'day':
                key = date.toISOString().split('T')[0];
                break;
            case 'week':
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = weekStart.toISOString().split('T')[0];
                break;
            case 'month':
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                break;
            default:
                key = date.toISOString().split('T')[0];
        }
        
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
    });
    
    return Object.entries(groups).map(([key, items]) => ({
        period: key,
        items,
        count: items.length,
        total: items.reduce((sum, item) => sum + (item.amount || 0), 0)
    }));
}

/**
 * Calculate project success rate
 * @param {Array} progressData - Progress data
 * @returns {Object} Success rate statistics
 */
function calculateSuccessRate(progressData) {
    const projects = progressData.filter(p => 
        p.object?.type === 'project' && 
        !p.path?.includes('piscine')
    );
    
    const passed = projects.filter(p => p.grade >= 1).length;
    const failed = projects.filter(p => p.grade === 0).length;
    const total = projects.length;
    
    return {
        total,
        passed,
        failed,
        successRate: total > 0 ? (passed / total) * 100 : 0
    };
}

/**
 * Sanitize HTML to prevent XSS
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * Create DOM element with attributes
 * @param {string} tag - HTML tag
 * @param {Object} attributes - Element attributes
 * @param {string} content - Element content
 * @returns {HTMLElement} Created element
 */
function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    if (content) {
        element.innerHTML = sanitizeHTML(content);
    }
    
    return element;
}

// Export functions to global scope for use in other scripts
window.helpers = {
    formatDate,
    formatDateShort,
    formatNumber,
    formatBytes,
    calculatePercentage,
    debounce,
    setLoading,
    showError,
    showSuccess,
    filterXPData,
    calculateCumulativeXP,
    groupByTimePeriod,
    calculateSuccessRate,
    sanitizeHTML,
    createElement
};
