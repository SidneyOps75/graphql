/**
 * Profile Component
 * Handles profile data loading and display
 */

class ProfileComponent {
    constructor() {
        this.profileData = null;
    }

    /**
     * Load and display user profile
     * @param {number} userId - User ID
     */
    async loadProfile(userId) {
        try {
            console.log('Loading profile data for user:', userId);

            // Fetch all profile data
            this.profileData = await graphqlService.getUserProfile(userId);
            console.log('Profile data loaded:', this.profileData);

            // Check if we have data
            if (!this.profileData) {
                console.error('No profile data received');
                throw new Error('No profile data received');
            }



            // Render all sections
            console.log('About to render user info...');
            this.renderUserInfo();

            console.log('About to render XP info...');
            this.renderXPInfo();

            console.log('About to render grades and skills...');
            this.renderGradesAndSkills();

            // Load graphs
            console.log('About to render graphs...');
            if (window.graphsComponent) {
                window.graphsComponent.renderAllGraphs(this.profileData);
            }

            console.log('All rendering completed!');

        } catch (error) {
            console.error('Error loading profile:', error);

            // Show error message to user
            const errorContainer = document.getElementById('user-details');
            if (errorContainer) {
                errorContainer.innerHTML = `
                    <div style="color: red; padding: 1rem; text-align: center;">
                        <h3>Error Loading Profile</h3>
                        <p>${error.message}</p>
                        <p>Please try refreshing the page or contact support.</p>
                    </div>
                `;
            }

            throw error;
        }
    }

    /**
     * Render user information section
     */
    renderUserInfo() {
        const container = document.getElementById('user-details');
        const user = this.profileData?.user;

        if (!container) {
            console.error('User details container not found!');
            return;
        }

        if (!user) {
            console.error('No user data available!');
            container.innerHTML = '<p style="color: red;">No user data available</p>';
            return;
        }

        // Update header
        const userName = document.getElementById('user-name');
        const userLogin = document.getElementById('user-login');

        if (userName) {
            const displayName = user.parsedAttrs?.firstName && user.parsedAttrs?.lastName
                ? `${user.parsedAttrs.firstName} ${user.parsedAttrs.lastName}`
                : user.login;
            userName.textContent = displayName;
        }

        if (userLogin) {
            userLogin.textContent = `@${user.login}`;
        }

        // Render user details
        const userDetails = [
            { label: 'Username', value: user.login || 'N/A' },
            { label: 'User ID', value: user.id || 'N/A' },
            { label: 'Member Since', value: user.createdAt ? helpers.formatDateShort(user.createdAt) : 'N/A' }
        ];

        // Add additional info from attrs if available
        if (user.parsedAttrs) {
            console.log('User has parsed attrs:', user.parsedAttrs);
            if (user.parsedAttrs.email) {
                userDetails.splice(1, 0, { label: 'Email', value: user.parsedAttrs.email });
            }
            if (user.parsedAttrs.firstName) {
                userDetails.splice(1, 0, { label: 'First Name', value: user.parsedAttrs.firstName });
            }
            if (user.parsedAttrs.lastName) {
                userDetails.splice(2, 0, { label: 'Last Name', value: user.parsedAttrs.lastName });
            }
        } else {
            console.log('No parsed attrs available');
        }

        console.log('User details to render:', userDetails);

        const html = userDetails.map(item => `
            <div class="data-item">
                <span class="data-label">${item.label}:</span>
                <span class="data-value">${helpers?.sanitizeHTML ? helpers.sanitizeHTML(item.value) : item.value}</span>
            </div>
        `).join('');

        console.log('Generated HTML:', html);
        container.innerHTML = html;
        container.classList.add('fade-in');

        // Add a visible test element to make sure it's working
        container.style.border = '2px solid green';
        container.style.background = 'white';
        container.style.padding = '1rem';

        console.log('User info rendering completed, container styled');
    }

    /**
     * Render XP information section
     */
    renderXPInfo() {
        console.log('renderXPInfo called');
        const container = document.getElementById('xp-details');
        const xpData = this.profileData?.xp;

        console.log('XP container:', container);
        console.log('XP data:', xpData);

        if (!container) {
            console.error('XP details container not found!');
            return;
        }

        if (!xpData) {
            console.warn('No XP data available');
            container.innerHTML = '<p style="color: #666;">No XP data available</p>';
            container.style.border = '2px solid orange';
            container.style.background = 'white';
            container.style.padding = '1rem';
            return;
        }

        // Filter out piscine XP as per user preference
        const filteredXP = helpers.filterXPData(xpData);
        
        // Calculate XP statistics
        const totalXP = filteredXP.reduce((sum, transaction) => sum + transaction.amount, 0);
        const projectCount = filteredXP.length;
        const averageXP = projectCount > 0 ? Math.round(totalXP / projectCount) : 0;
        
        // Get recent XP (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentXP = filteredXP
            .filter(t => new Date(t.createdAt) > thirtyDaysAgo)
            .reduce((sum, t) => sum + t.amount, 0);

        // Create XP summary
        const xpSummaryHTML = `
            <div class="xp-summary">
                <div class="xp-stat">
                    <span class="xp-stat-value">${helpers.formatNumber(totalXP)}</span>
                    <span class="xp-stat-label">Total XP</span>
                </div>
                <div class="xp-stat">
                    <span class="xp-stat-value">${projectCount}</span>
                    <span class="xp-stat-label">Projects</span>
                </div>
                <div class="xp-stat">
                    <span class="xp-stat-value">${helpers.formatNumber(averageXP)}</span>
                    <span class="xp-stat-label">Avg XP</span>
                </div>
                <div class="xp-stat">
                    <span class="xp-stat-value">${helpers.formatNumber(recentXP)}</span>
                    <span class="xp-stat-label">Last 30 Days</span>
                </div>
            </div>
        `;

        // Recent projects list
        const recentProjects = filteredXP
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        const recentProjectsHTML = recentProjects.length > 0 ? `
            <div class="recent-projects">
                <h4 style="margin: 1rem 0 0.5rem 0; color: var(--text-secondary); font-size: 0.875rem;">Recent Projects</h4>
                ${recentProjects.map(project => `
                    <div class="data-item">
                        <span class="data-label">${project.object?.name || 'Unknown Project'}</span>
                        <span class="data-value highlight">+${helpers.formatNumber(project.amount)} XP</span>
                    </div>
                `).join('')}
            </div>
        ` : '';

        container.innerHTML = xpSummaryHTML + recentProjectsHTML;
        container.classList.add('fade-in');
    }

    /**
     * Render grades and skills section
     */
    renderGradesAndSkills() {
        const container = document.getElementById('grades-skills-details');
        const progress = this.profileData.progress;
        const results = this.profileData.results;
        const audits = this.profileData.audits;
        
        if (!container) return;

        // Calculate success rate
        const successStats = helpers.calculateSuccessRate(progress || []);
        
        // Get recent grades
        const recentGrades = (progress || [])
            .filter(p => p.object?.type === 'project' && !p.path?.includes('piscine'))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        // Audit ratio information
        const auditInfo = audits || { auditRatio: 0, auditsGiven: 0, auditsReceived: 0 };

        const gradesHTML = `
            <div class="grades-summary">
                <div class="data-item">
                    <span class="data-label">Success Rate:</span>
                    <span class="data-value highlight">${successStats.successRate.toFixed(1)}%</span>
                </div>
                <div class="data-item">
                    <span class="data-label">Projects Passed:</span>
                    <span class="data-value">${successStats.passed}</span>
                </div>
                <div class="data-item">
                    <span class="data-label">Projects Failed:</span>
                    <span class="data-value">${successStats.failed}</span>
                </div>
                <div class="data-item">
                    <span class="data-label">Audit Ratio:</span>
                    <span class="data-value highlight">${auditInfo.auditRatio.toFixed(2)}</span>
                </div>
            </div>
        `;

        const recentGradesHTML = recentGrades.length > 0 ? `
            <div class="recent-grades">
                <h4 style="margin: 1rem 0 0.5rem 0; color: var(--text-secondary); font-size: 0.875rem;">Recent Grades</h4>
                <div class="grades-list">
                    ${recentGrades.map(grade => `
                        <div class="grade-item">
                            <span class="grade-project">${grade.object?.name || 'Unknown Project'}</span>
                            <span class="grade-score ${grade.grade >= 1 ? 'pass' : 'fail'}">
                                ${grade.grade >= 1 ? 'PASS' : 'FAIL'} (${grade.grade})
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '';

        container.innerHTML = gradesHTML + recentGradesHTML;
        container.classList.add('fade-in');
    }

    /**
     * Get profile data
     * @returns {Object} Current profile data
     */
    getProfileData() {
        return this.profileData;
    }
}

// Create global instance
const profileComponent = new ProfileComponent();
window.profileComponent = profileComponent;
