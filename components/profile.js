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

            console.log('About to render skills...');
            this.renderSkillsSection();

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

        // Filter out piscine-go only (keep other piscines, exercises, projects)
        const filteredXP = helpers.filterXPData(xpData);

        // DEBUG: Calculate both filtered and unfiltered totals
        const totalXP = filteredXP.reduce((sum, transaction) => sum + transaction.amount, 0);
        const totalUnfilteredXP = xpData.reduce((sum, transaction) => sum + transaction.amount, 0);

        // DEBUG: Log the difference
        console.log('=== XP DEBUG INFO ===');
        console.log('Total XP (filtered):', graphqlService.formatXPAmount(totalXP));
        console.log('Total XP (unfiltered):', graphqlService.formatXPAmount(totalUnfilteredXP));
        console.log('Difference:', graphqlService.formatXPAmount(totalUnfilteredXP - totalXP));
        console.log('Filtered out transactions:', xpData.length - filteredXP.length);
        console.log('Platform shows: 1.30 MB');

        // DEBUG: Show what's being filtered out
        const filteredOut = xpData.filter(t => !filteredXP.includes(t));
        console.log('Filtered out XP sources:');
        filteredOut.forEach(t => {
            console.log(`- ${t.object?.name || 'Unknown'} (${t.object?.type || 'Unknown type'}): ${graphqlService.formatXPAmount(t.amount)}`);
        });

        // DEBUG: Show XP by object type (INCLUDED)
        const xpByTypeIncluded = {};
        filteredXP.forEach(t => {
            const type = t.object?.type || 'Unknown';
            if (!xpByTypeIncluded[type]) xpByTypeIncluded[type] = { count: 0, total: 0 };
            xpByTypeIncluded[type].count++;
            xpByTypeIncluded[type].total += t.amount;
        });
        console.log('XP by object type (INCLUDED):');
        Object.entries(xpByTypeIncluded).forEach(([type, data]) => {
            console.log(`- ${type}: ${data.count} transactions, ${graphqlService.formatXPAmount(data.total)}`);
        });

        // DEBUG: Show largest included transactions
        console.log('Largest included transactions:');
        const sortedIncluded = [...filteredXP].sort((a, b) => b.amount - a.amount).slice(0, 10);
        sortedIncluded.forEach(t => {
            console.log(`- ${t.object?.name || 'Unknown'} (${t.object?.type || 'Unknown'}): ${graphqlService.formatXPAmount(t.amount)}`);
        });

        console.log(`Current total: ${graphqlService.formatXPAmount(totalXP)}`);
        console.log(`Platform target: 1.30 MB`);
        console.log(`Difference: ${graphqlService.formatXPAmount(totalXP - 1300000)} (need to remove this much)`);
        console.log('===================');
        const projectCount = filteredXP.length;
        const averageXP = projectCount > 0 ? Math.round(totalXP / projectCount) : 0;
        
        // Get recent XP (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentXP = filteredXP
            .filter(t => new Date(t.createdAt) > thirtyDaysAgo)
            .reduce((sum, t) => sum + t.amount, 0);

        // Create XP summary with KB/MB formatting using GraphQL service formatting
        const xpSummaryHTML = `
            <div class="xp-summary">
                <div class="xp-stat">
                    <span class="xp-stat-value">${graphqlService.formatXPAmount(totalXP)}</span>
                    <span class="xp-stat-label">Total XP</span>
                </div>
                <div class="xp-stat">
                    <span class="xp-stat-value">${projectCount}</span>
                    <span class="xp-stat-label">Projects</span>
                </div>
                <div class="xp-stat">
                    <span class="xp-stat-value">${graphqlService.formatXPAmount(averageXP)}</span>
                    <span class="xp-stat-label">Avg XP</span>
                </div>
                <div class="xp-stat">
                    <span class="xp-stat-value">${graphqlService.formatXPAmount(recentXP)}</span>
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
                        <span class="data-value highlight">+${project.formattedAmount}</span>
                    </div>
                `).join('')}
            </div>
        ` : '';

        container.innerHTML = xpSummaryHTML + recentProjectsHTML;
        container.classList.add('fade-in');
    }

    /**
     * Render skills section (replacing grades)
     */
    renderSkillsSection() {
        const container = document.getElementById('grades-skills-details');
        const skills = this.profileData.skills || [];
        const rank = this.profileData.rank || { level: 1, rank: 'Beginner' };

        if (!container) return;

        console.log('Skills data:', skills);
        console.log('Rank data:', rank);

        // Process and sort skills by percentage (grade)
        const processedSkills = skills
            .filter(skill => skill.object?.type === 'skill' || skill.object?.type === 'derived_skill' || skill.object?.type === 'module_skill' || skill.object?.type === 'zone01_skill' || skill.object?.type === 'progress_skill' || skill.object?.type === 'technology' || skill.object?.type === 'technology_progress' || skill.object?.type === 'technology_object' || skill.object?.type === 'highest_skill')
            .map(skill => ({
                name: skill.object?.name || 'Unknown Skill',
                percentage: Math.round(skill.grade * 100), // Convert to percentage
                grade: skill.grade,
                lastUpdated: new Date(skill.updatedAt).toLocaleDateString(),
                projectCount: skill.projectCount || 0,
                relatedProjects: skill.object?.attrs?.relatedProjects || [],
                category: skill.category || skill.object?.attrs?.category || 'General',
                projects: skill.projects || []
            }))
            .sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending

        console.log('Processed skills:', processedSkills);

        // Only show rank if it's meaningful (not default Level 1 Beginner)
        const shouldShowRank = rank.level > 1 || (rank.level === 1 && rank.rank !== 'Beginner') || rank.source === 'existing_progress' || rank.source === 'highest_grade';
        const skillsSummaryHTML = shouldShowRank ? `
            <div class="rank-display">
                <div class="rank-info">
                    <span class="rank-level">Level ${rank.level}</span>
                    <span class="rank-name">${rank.rank}</span>
                </div>
            </div>
        ` : '';

        // Create scrollable skills list to show all skills
        const skillsListHTML = processedSkills.length > 0 ? `
            <div class="skills-container">
                <h4 style="margin: 1rem 0 0.5rem 0; color: var(--text-secondary); font-size: 0.875rem;">Highest Skills (${processedSkills.length} total)</h4>
                <div class="skills-scrollable">
                    ${processedSkills.map(skill => `
                        <div class="data-item">
                            <span class="data-label">${skill.name}</span>
                            <span class="data-value highlight">${skill.percentage}%</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : '<p style="color: #666;">No skills data available</p>';

        container.innerHTML = skillsSummaryHTML + skillsListHTML;
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
