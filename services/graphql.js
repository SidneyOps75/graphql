class GraphQLService {
    constructor() {
        this.apiUrl = 'https://learn.zone01kisumu.ke/api/graphql-engine/v1/graphql';
    }

    /**
     * Execute GraphQL query with proper authentication
     * @param {string} query - GraphQL query string
     * @param {Object} variables - Query variables
     * @returns {Promise<Object>} Query result
     */
    async query(query, variables = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...authService.getAuthHeader()
            };

            console.log('Executing GraphQL query:', { query, variables });

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    query,
                    variables
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();

            // Check for GraphQL errors
            if (result.errors && result.errors.length > 0) {
                console.error('GraphQL errors:', result.errors);
                throw new Error(`GraphQL error: ${result.errors[0].message}`);
            }

            console.log('GraphQL query successful:', result);
            return result;

        } catch (error) {
            console.error('GraphQL query failed:', error);
            throw error;
        }
    }

    /**
     * Get current user information (normal query)
     * @returns {Promise<Object>} User data
     */
    async getCurrentUser() {
        const query = `
            query GetCurrentUser {
                user {
                    id
                    login
                    attrs
                    createdAt
                    updatedAt
                }
            }
        `;

        const result = await this.query(query);
        const users = result?.data?.user || [];
        
        if (users.length > 0) {
            const user = users[0];
            // Parse attrs if it's a JSON string
            if (user.attrs && typeof user.attrs === 'string') {
                try {
                    user.parsedAttrs = JSON.parse(user.attrs);
                } catch (e) {
                    console.warn('Could not parse user attrs:', e);
                }
            }
            return user;
        }
        
        return null;
    }

    /**
     * Get user XP transactions (argument-based query)
     * @param {number} userId - User ID
     * @returns {Promise<Array>} XP transactions
     */
    async getUserXP(userId) {
        // Ensure userId is a number
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

        const query = `
            query GetUserXP($userId: Int!) {
                transaction(
                    where: {
                        userId: {_eq: $userId},
                        type: {_eq: "xp"},
                        object: {
                            type: {_nin: ["exercise", "raid"]}
                        },
                        _not: {
                            _or: [
                                {
                                    _and: [
                                        {object: {type: {_eq: "piscine"}}},
                                        {object: {name: {_ilike: "%go%"}}}
                                    ]
                                },
                                {
                                    _and: [
                                        {object: {type: {_eq: "piscine"}}},
                                        {object: {name: {_ilike: "%rust%"}}}
                                    ]
                                }
                            ]
                        }
                    }
                    order_by: {createdAt: asc}
                ) {
                    id
                    amount
                    createdAt
                    path
                    object {
                        name
                        type
                        attrs
                    }
                }
            }
        `;

        const result = await this.query(query, { userId: numericUserId });
        const transactions = result?.data?.transaction || [];

        // Enhanced processing with more accurate calculations
        return transactions.map(transaction => ({
            ...transaction,
            formattedAmount: this.formatXPAmount(transaction.amount),
            // More precise KB calculation (1 KB = 1000 bytes)
            amountKB: parseFloat((transaction.amount / 1000).toFixed(3)),
            // More precise MB calculation (1 MB = 1,000,000 bytes)
            amountMB: parseFloat((transaction.amount / 1000000).toFixed(6)),
            // Add GB for very large amounts
            amountGB: parseFloat((transaction.amount / 1000000000).toFixed(9))
        }));
    }

    /**
     * Format XP amount to show KB/MB/GB appropriately
     * @param {number} amount - XP amount in bytes
     * @returns {string} Formatted string with appropriate unit
     */
    formatXPAmount(amount) {
        if (amount >= 1000000000) {
            return `${(amount / 1000000000).toFixed(3)} GB`;
        } else if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(3)} MB`;
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(2)} KB`;
        } else {
            return `${amount} B`;
        }
    }

    /**
     * Get user progress and grades (nested query)
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Progress data
     */
    async getUserProgress(userId) {
        // Ensure userId is a number
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

        const query = `
            query GetUserProgress($userId: Int!) {
                progress(
                    where: {userId: {_eq: $userId}}
                    order_by: {createdAt: desc}
                ) {
                    id
                    grade
                    createdAt
                    updatedAt
                    path
                    object {
                        id
                        name
                        type
                        attrs
                    }
                }
            }
        `;

        const result = await this.query(query, { userId: numericUserId });
        return result?.data?.progress || [];
    }

    /**
     * Get user results (nested query with user info)
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Results data
     */
    async getUserResults(userId) {
        // Ensure userId is a number
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

        const query = `
            query GetUserResults($userId: Int!) {
                result(
                    where: {userId: {_eq: $userId}}
                    order_by: {createdAt: desc}
                ) {
                    id
                    grade
                    type
                    createdAt
                    updatedAt
                    path
                    object {
                        id
                        name
                        type
                        attrs
                    }
                    user {
                        id
                        login
                    }
                }
            }
        `;

        const result = await this.query(query, { userId: numericUserId });
        return result?.data?.result || [];
    }

    /**
     * Get audit information for user
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Audit data
     */
    async getUserAudits(userId) {
        // Ensure userId is a number
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

        const query = `
            query GetUserAudits($userId: Int!) {
                transaction(
                    where: {
                        userId: {_eq: $userId},
                        type: {_eq: "up"}
                    }
                ) {
                    id
                    amount
                    createdAt
                    path
                    object {
                        name
                        type
                    }
                }
                down_transactions: transaction(
                    where: {
                        userId: {_eq: $userId},
                        type: {_eq: "down"}
                    }
                ) {
                    id
                    amount
                    createdAt
                    path
                    object {
                        name
                        type
                    }
                }
            }
        `;

        const result = await this.query(query, { userId: numericUserId });
        const upTransactions = result?.data?.transaction || [];
        const downTransactions = result?.data?.down_transactions || [];

        // Calculate XP amounts for audits given and received
        const auditsGivenXP = upTransactions.reduce((sum, t) => sum + t.amount, 0);
        const auditsReceivedXP = downTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);

        // Calculate ratio based on XP amounts (as platform does)
        const auditRatio = auditsReceivedXP !== 0 ? auditsGivenXP / auditsReceivedXP : auditsGivenXP > 0 ? auditsGivenXP : 0;

        return {
            auditsGiven: auditsGivenXP,           // Total XP from audits given
            auditsReceived: auditsReceivedXP,     // Total XP from audits received
            auditRatio: auditRatio,               // Ratio based on XP amounts
            auditsGivenCount: upTransactions.length,      // Count of audits given
            auditsReceivedCount: downTransactions.length, // Count of audits received
            upTransactions: upTransactions,
            downTransactions: downTransactions,
            // Keep legacy fields for backward compatibility
            transactions: upTransactions
        };
    }


    /**
     * Get user highest skills using the working query pattern
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Skills data from Zone01 database
     */
    async getUserSkills(userId) {
        // Ensure userId is a number
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

        try {
            console.log('=== ZONE01 SKILLS WITH HIGHEST AMOUNTS ===');
            console.log('Fetching skills with highest amounts for user:', numericUserId);

            // Use the new method that gets highest amounts as percentages
            return await this.getSkillsWithHighestAmounts(userId);

        } catch (error) {
            console.error('Error in getUserSkills:', error);

            // Fallback to original method if new method fails
            console.log('Falling back to original skills query...');
            return await this.getUserSkillsOriginal(userId);
        }
    }

    /**
     * Original getUserSkills method as fallback
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Skills data from Zone01 database
     */
    async getUserSkillsOriginal(userId) {
        // Ensure userId is a number
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

        try {
            console.log('=== ZONE01 HIGHEST SKILLS QUERY (ORIGINAL) ===');
            console.log('Fetching highest skills for user:', numericUserId);

            // Use the working query pattern you provided
            const query = `
                query GetUserHighestSkills($userId: Int!) {
                    user(where: {id: {_eq: $userId}}) {
                        id
                        login
                        skills: transactions(
                            where: { type: { _like: "skill_%" } }
                            order_by: [{ amount: desc }]
                        ) {
                            id
                            type
                            amount
                            createdAt
                            path
                            object {
                                id
                                name
                                type
                                attrs
                            }
                        }
                    }
                }
            `;

            console.log('Executing highest skills query...');
            const result = await this.query(query, { userId: numericUserId });
            console.log('Highest skills query result:', result);

            const userData = result?.data?.user?.[0];
            const skillTransactions = userData?.skills || [];

            console.log('User data:', userData);
            console.log('Skill transactions found:', skillTransactions.length);
            console.log('Skill transactions:', skillTransactions);

            if (skillTransactions.length > 0) {
                console.log('Processing skill transactions...');
                return this.processHighestSkills(skillTransactions);
            }

            // If no results with nested query, try direct transaction query
            console.log('No skills found with nested query, trying direct query...');
            const directQuery = `
                query GetSkillTransactionsDirect($userId: Int!) {
                    transaction(
                        where: {
                            userId: {_eq: $userId},
                            type: {_like: "skill_%"}
                        }
                        order_by: {amount: desc}
                    ) {
                        id
                        type
                        amount
                        createdAt
                        path
                        object {
                            id
                            name
                            type
                            attrs
                        }
                    }
                }
            `;

            const directResult = await this.query(directQuery, { userId: numericUserId });
            console.log('Direct skills query result:', directResult);

            const directSkills = directResult?.data?.transaction || [];
            console.log('Direct skill transactions found:', directSkills.length);

            if (directSkills.length > 0) {
                console.log('Processing direct skill transactions...');
                return this.processHighestSkills(directSkills);
            }

            console.log('No skills found with either query method');
            console.log('=== END ZONE01 HIGHEST SKILLS QUERY ===');
            return [];

        } catch (error) {
            console.error('Error fetching highest skills:', error);
            return [];
        }
    }

    /**
     * Process highest skills from skill transactions
     * @param {Array} skillTransactions - Raw skill transaction data
     * @returns {Array} Processed highest skills data
     */
    processHighestSkills(skillTransactions) {
        console.log('Processing highest skills:', skillTransactions);

        // Group skills by type and sum amounts to get total skill levels
        const skillsMap = new Map();

        skillTransactions.forEach(transaction => {
            const skillType = transaction.type;
            const skillName = this.formatSkillName(skillType);
            const amount = transaction.amount || 0;

            if (skillsMap.has(skillName)) {
                const existing = skillsMap.get(skillName);
                existing.totalAmount += amount;
                existing.transactionCount++;
                existing.transactions.push(transaction);
                existing.lastSeen = transaction.createdAt;
            } else {
                skillsMap.set(skillName, {
                    name: skillName,
                    type: skillType,
                    totalAmount: amount,
                    transactionCount: 1,
                    transactions: [transaction],
                    firstSeen: transaction.createdAt,
                    lastSeen: transaction.createdAt,
                    object: transaction.object
                });
            }
        });

        // Convert to skills array and calculate grades based on amounts
        const skills = Array.from(skillsMap.values());
        const maxAmount = Math.max(...skills.map(s => s.totalAmount));

        const processedSkills = skills.map(skill => {
            // Calculate grade as percentage of highest skill amount
            const grade = maxAmount > 0 ? skill.totalAmount / maxAmount : 0;

            return {
                id: `highest_skill_${skill.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                grade: grade,
                createdAt: skill.firstSeen,
                updatedAt: skill.lastSeen,
                object: {
                    name: skill.name,
                    type: 'highest_skill',
                    attrs: {
                        skillType: skill.type,
                        totalAmount: skill.totalAmount,
                        transactionCount: skill.transactionCount,
                        category: this.getSkillCategory(skill.name),
                        amountFormatted: this.formatXPAmount(skill.totalAmount)
                    }
                },
                totalAmount: skill.totalAmount,
                transactionCount: skill.transactionCount,
                category: this.getSkillCategory(skill.name),
                projectCount: skill.transactionCount // Use transaction count as project count
            };
        });

        // Sort by total amount (highest skills first)
        processedSkills.sort((a, b) => b.totalAmount - a.totalAmount);

        console.log('Processed highest skills:', processedSkills);
        console.log('Top 5 skills by amount:');
        processedSkills.slice(0, 5).forEach(skill => {
            console.log(`- ${skill.object.name}: ${skill.object.attrs.amountFormatted} (${skill.transactionCount} transactions)`);
        });

        return processedSkills;
    }

    /**
     * Format skill type into readable skill name
     * @param {string} skillType - Raw skill type (e.g., "skill_go", "skill_web-dev")
     * @returns {string} Formatted skill name
     */
    formatSkillName(skillType) {
        if (!skillType || !skillType.startsWith('skill_')) {
            return skillType || 'Unknown Skill';
        }

        // Remove "skill_" prefix and format
        const skillPart = skillType.replace('skill_', '');

        // Handle common skill name patterns
        const skillMappings = {
            'go': 'Go Programming',
            'js': 'JavaScript',
            'html': 'HTML',
            'css': 'CSS',
            'sql': 'SQL',
            'db': 'Database Management',
            'web-dev': 'Web Development',
            'backend': 'Backend Development',
            'frontend': 'Frontend Development',
            'api': 'API Development',
            'docker': 'Docker',
            'git': 'Git',
            'linux': 'Linux',
            'algo': 'Algorithm Design',
            'data-struct': 'Data Structures',
            'network': 'Network Programming',
            'security': 'Security',
            'testing': 'Testing',
            'debug': 'Debugging'
        };

        if (skillMappings[skillPart]) {
            return skillMappings[skillPart];
        }

        // Convert kebab-case or snake_case to Title Case
        return skillPart
            .replace(/[-_]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }

    /**
     * Get skill category based on skill name
     * @param {string} skillName - Skill name
     * @returns {string} Skill category
     */
    getSkillCategory(skillName) {
        const name = skillName.toLowerCase();

        if (name.includes('web') || name.includes('html') || name.includes('css') || name.includes('frontend')) {
            return 'Web Development';
        }
        if (name.includes('backend') || name.includes('api') || name.includes('server')) {
            return 'Backend Development';
        }
        if (name.includes('database') || name.includes('sql') || name.includes('db')) {
            return 'Database Management';
        }
        if (name.includes('network') || name.includes('tcp') || name.includes('socket')) {
            return 'Network Programming';
        }
        if (name.includes('algorithm') || name.includes('data structure')) {
            return 'Algorithm Design';
        }
        if (name.includes('security') || name.includes('auth')) {
            return 'Security';
        }
        if (name.includes('docker') || name.includes('container')) {
            return 'DevOps';
        }
        if (name.includes('go') || name.includes('javascript') || name.includes('programming')) {
            return 'Programming Languages';
        }

        return 'General';
    }

    /**
     * Debug method to explore available data types
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Debug information
     */
    async debugUserData(userId) {
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

        const debugQuery = `
            query DebugUserData($userId: Int!) {
                # Get all progress entries to see what types exist
                progress(
                    where: {userId: {_eq: $userId}}
                    limit: 10
                ) {
                    id
                    grade
                    object {
                        name
                        type
                        attrs
                    }
                }

                # Get all transaction types
                transaction(
                    where: {userId: {_eq: $userId}}
                    limit: 10
                ) {
                    id
                    type
                    amount
                    object {
                        name
                        type
                        attrs
                    }
                }

                # Get all result entries
                result(
                    where: {userId: {_eq: $userId}}
                    limit: 10
                ) {
                    id
                    type
                    grade
                    object {
                        name
                        type
                        attrs
                    }
                }
            }
        `;

        try {
            const result = await this.query(debugQuery, { userId: numericUserId });
            console.log('=== DEBUG DATA ===');
            console.log('Progress entries:', result?.data?.progress);
            console.log('Transaction entries:', result?.data?.transaction);
            console.log('Result entries:', result?.data?.result);

            // Extract unique object types
            const progressTypes = [...new Set((result?.data?.progress || []).map(p => p.object?.type))];
            const transactionTypes = [...new Set((result?.data?.transaction || []).map(t => t.type))];
            const resultTypes = [...new Set((result?.data?.result || []).map(r => r.object?.type))];

            console.log('Progress object types found:', progressTypes);
            console.log('Transaction types found:', transactionTypes);
            console.log('Result object types found:', resultTypes);
            console.log('=== END DEBUG ===');

            return result?.data;
        } catch (error) {
            console.error('Debug query failed:', error);
            return null;
        }
    }

    /**
     * Get comprehensive user profile data
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Complete profile data
     */
    async getUserProfile(userId) {
        try {
            console.log('Fetching complete user profile for ID:', userId);

            // Add debug call to understand data structure
            console.log('About to call debugUserData...');
            await this.debugUserData(userId);
            console.log('debugUserData completed');

            const [user, xpData, progress, results, audits, skills, rank] = await Promise.all([
                this.getCurrentUser(),
                this.getUserXP(userId),
                this.getUserProgress(userId),
                this.getUserResults(userId),
                this.getUserAudits(userId),
                this.getUserSkills(userId),
                this.getUserRank(userId)
            ]);

            return {
                user,
                xp: xpData,
                progress,
                results,
                audits,
                skills,
                rank
            };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }

    /**
     * Get user current rank/level
     * @param {number} userId - User ID
     * @returns {Promise<Object>} User rank/level data
     */
    async getUserRank(userId) {
        // Ensure userId is a number
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

        try {
            console.log('=== USER RANK QUERY ===');
            console.log('Fetching user rank for user:', numericUserId);

            // Quick check: analyze existing progress data first
            console.log('Quick analysis: checking existing progress data...');
            const existingProgress = await this.getUserProgress(userId);
            if (existingProgress && existingProgress.length > 0) {
                const sortedByGrade = existingProgress
                    .filter(p => p.grade && p.grade > 1)
                    .sort((a, b) => b.grade - a.grade)
                    .slice(0, 5);

                console.log('Top 5 highest grades from existing progress:', sortedByGrade.map(p => ({
                    grade: p.grade,
                    name: p.object?.name,
                    path: p.path
                })));

                if (sortedByGrade.length > 0) {
                    const highest = sortedByGrade[0];
                    const potentialLevel = Math.floor(highest.grade);

                    if (potentialLevel >= 10) { // Reasonable level threshold
                        console.log(`Quick detection: Found level ${potentialLevel} from existing progress data`);
                        return {
                            level: potentialLevel,
                            rank: this.getRankName(potentialLevel),
                            source: 'existing_progress',
                            grade: highest.grade,
                            objectName: highest.object?.name,
                            path: highest.path
                        };
                    }
                }
            }

            // Query for user basic info first
            const userQuery = `
                query GetUserBasic($userId: Int!) {
                    user(where: {id: {_eq: $userId}}) {
                        id
                        login
                        attrs
                    }
                }
            `;

            // Query for level/rank in progress table separately
            const progressQuery = `
                query GetLevelProgress($userId: Int!) {
                    progress(
                        where: {
                            userId: {_eq: $userId},
                            _or: [
                                {object: {type: {_eq: "level"}}},
                                {object: {type: {_eq: "rank"}}},
                                {object: {name: {_ilike: "%level%"}}},
                                {object: {name: {_ilike: "%rank%"}}},
                                {path: {_ilike: "%level%"}},
                                {path: {_ilike: "%rank%"}}
                            ]
                        }
                        order_by: {grade: desc}
                        limit: 5
                    ) {
                        id
                        grade
                        createdAt
                        updatedAt
                        path
                        object {
                            id
                            name
                            type
                            attrs
                        }
                    }
                }
            `;

            // Query for level/rank in transactions separately
            const transactionQuery = `
                query GetLevelTransactions($userId: Int!) {
                    transaction(
                        where: {
                            userId: {_eq: $userId},
                            _or: [
                                {type: {_like: "%level%"}},
                                {type: {_like: "%rank%"}},
                                {object: {name: {_ilike: "%level%"}}},
                                {object: {name: {_ilike: "%rank%"}}}
                            ]
                        }
                        order_by: {amount: desc}
                        limit: 5
                    ) {
                        id
                        type
                        amount
                        createdAt
                        object {
                            name
                            type
                            attrs
                        }
                    }
                }
            `;

            console.log('Executing separate rank queries...');

            // Execute all queries in parallel
            const [userResult, progressResult, transactionResult] = await Promise.all([
                this.query(userQuery, { userId: numericUserId }),
                this.query(progressQuery, { userId: numericUserId }),
                this.query(transactionQuery, { userId: numericUserId })
            ]);

            console.log('User query result:', userResult);
            console.log('Progress query result:', progressResult);
            console.log('Transaction query result:', transactionResult);

            const userData = userResult?.data?.user?.[0];
            const levelProgress = progressResult?.data?.progress || [];
            const levelTransactions = transactionResult?.data?.transaction || [];

            console.log('User data:', userData);
            console.log('Level progress found:', levelProgress.length);
            console.log('Level transactions found:', levelTransactions.length);
            console.log('Level progress data:', levelProgress);
            console.log('Level transactions data:', levelTransactions);

            // Try to extract level from progress
            if (levelProgress.length > 0) {
                const progress = levelProgress[0];
                const level = Math.floor(progress.grade) || 1;
                return {
                    level: level,
                    rank: this.getRankName(level),
                    source: 'progress',
                    grade: progress.grade
                };
            }

            // Try to extract level from transactions
            if (levelTransactions.length > 0) {
                const transaction = levelTransactions[0];
                const level = Math.floor(transaction.amount / 1000) || 1;
                return {
                    level: level,
                    rank: this.getRankName(level),
                    source: 'transaction',
                    amount: transaction.amount
                };
            }

            // Try to find level in any progress entry with higher grades
            console.log('Searching all progress for potential level indicators...');
            const allProgressQuery = `
                query GetAllProgress($userId: Int!) {
                    progress(
                        where: {userId: {_eq: $userId}}
                        order_by: {grade: desc}
                        limit: 100
                    ) {
                        id
                        grade
                        path
                        object {
                            name
                            type
                            attrs
                        }
                    }
                }
            `;

            const allProgressResult = await this.query(allProgressQuery, { userId: numericUserId });
            const allProgress = allProgressResult?.data?.progress || [];

            console.log('All progress entries (top 10):', allProgress.slice(0, 10));

            // Look for the highest grade that might represent a level
            const highestGrades = allProgress
                .filter(p => p.grade > 1) // Levels are usually > 1
                .sort((a, b) => b.grade - a.grade)
                .slice(0, 10);

            console.log('Highest grades found:', highestGrades);

            if (highestGrades.length > 0) {
                const highestGrade = highestGrades[0];
                const level = Math.floor(highestGrade.grade);

                if (level > 1) {
                    console.log(`Found potential level ${level} from progress with grade ${highestGrade.grade}`);
                    return {
                        level: level,
                        rank: this.getRankName(level),
                        source: 'highest_grade',
                        grade: highestGrade.grade,
                        path: highestGrade.path,
                        objectName: highestGrade.object?.name
                    };
                }
            }

            // Calculate level based on total XP as fallback
            console.log('No explicit level found, calculating from XP...');
            const xpData = await this.getUserXP(userId);
            const totalXP = xpData.reduce((sum, transaction) => sum + transaction.amount, 0);

            // More realistic XP-to-level calculation
            // Assuming each level requires progressively more XP
            let calculatedLevel = 1;
            let xpRequired = 50000; // 50KB for level 2
            let remainingXP = totalXP;

            while (remainingXP >= xpRequired && calculatedLevel < 100) {
                remainingXP -= xpRequired;
                calculatedLevel++;
                xpRequired = Math.floor(xpRequired * 1.2); // Each level requires 20% more XP
            }

            console.log(`Calculated level ${calculatedLevel} from ${this.formatXPAmount(totalXP)} total XP`);

            return {
                level: calculatedLevel,
                rank: this.getRankName(calculatedLevel),
                source: 'calculated',
                totalXP: totalXP,
                xpFormatted: this.formatXPAmount(totalXP)
            };

        } catch (error) {
            console.error('Error fetching user rank:', error);
            return { level: 1, rank: 'Beginner', source: 'error' };
        }
    }


    /**
     * Get skills with highest amounts as percentages
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Skills with highest amounts as percentages
     */
    async getSkillsWithHighestAmounts(userId) {
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

        console.log('=== SKILLS WITH HIGHEST AMOUNTS QUERY ===');
        console.log('Fetching skills with highest amounts for user:', numericUserId);

        try {
            // Query for all skill transactions
            const query = `
                query GetAllSkillTransactions($userId: Int!) {
                    transaction(
                        where: {
                            userId: {_eq: $userId},
                            type: {_like: "skill_%"}
                        }
                        order_by: {amount: desc}
                    ) {
                        id
                        type
                        amount
                        createdAt
                        path
                        object {
                            id
                            name
                            type
                            attrs
                        }
                    }
                }
            `;

            const result = await this.query(query, { userId: numericUserId });
            const transactions = result?.data?.transaction || [];

            console.log('Total skill transactions found:', transactions.length);

            // Group by skill type and find highest amount for each
            const skillsMap = new Map();

            transactions.forEach(transaction => {
                const skillType = transaction.type;
                const skillName = this.formatSkillName(skillType);
                const amount = transaction.amount || 0;

                if (!skillsMap.has(skillName) || skillsMap.get(skillName).highestAmount < amount) {
                    skillsMap.set(skillName, {
                        name: skillName,
                        type: skillType,
                        highestAmount: amount,
                        highestTransaction: transaction,
                        allTransactions: transactions.filter(t => t.type === skillType),
                        transactionCount: transactions.filter(t => t.type === skillType).length,
                        firstSeen: transaction.createdAt,
                        lastSeen: transaction.createdAt,
                        object: transaction.object
                    });
                }
            });

            // Update last seen dates
            skillsMap.forEach((skill, skillName) => {
                const skillTransactions = transactions.filter(t => this.formatSkillName(t.type) === skillName);
                skill.transactionCount = skillTransactions.length;
                skill.firstSeen = skillTransactions[skillTransactions.length - 1]?.createdAt || skill.firstSeen;
                skill.lastSeen = skillTransactions[0]?.createdAt || skill.lastSeen;
            });

            // Convert to array and find the maximum amount for percentage calculation
            const skills = Array.from(skillsMap.values());
            const maxAmount = Math.max(...skills.map(s => s.highestAmount));

            console.log('Skills found:', skills.length);
            console.log('Maximum amount found:', maxAmount);

            // Process skills with percentages based on highest amounts directly
            const processedSkills = skills.map(skill => {
                // Use the highest amount directly as percentage (capped at 100%)
                // The highest amount represents the skill level out of 100
                const directPercentage = Math.min(skill.highestAmount, 100);

                return {
                    id: `skill_${skill.name.replace(/[^a-zA-Z0-9]/g, '_')}`,
                    grade: directPercentage / 100, // Keep grade as decimal for compatibility
                    percentage: Math.round(directPercentage), // Highest amount as percentage
                    highestAmount: skill.highestAmount,
                    createdAt: skill.firstSeen,
                    updatedAt: skill.lastSeen,
                    object: {
                        name: skill.name,
                        type: 'highest_amount_skill',
                        attrs: {
                            skillType: skill.type,
                            highestAmount: skill.highestAmount,
                            transactionCount: skill.transactionCount,
                            category: this.getSkillCategory(skill.name),
                            amountFormatted: this.formatXPAmount(skill.highestAmount),
                            directPercentage: directPercentage
                        }
                    },
                    totalAmount: skill.highestAmount, // Use highest amount as total
                    transactionCount: skill.transactionCount,
                    category: this.getSkillCategory(skill.name),
                    projectCount: skill.transactionCount
                };
            });

            // Sort by highest amount (descending)
            processedSkills.sort((a, b) => b.highestAmount - a.highestAmount);

            console.log('Processed skills with highest amounts:', processedSkills);
            return processedSkills;

        } catch (error) {
            console.error('Error fetching skills with highest amounts:', error);
            throw error;
        }
    }

    /**
     * Get highest checkpoint level for prog skill
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Highest prog skill checkpoint data
     */
    async getHighestProgCheckpointLevel(userId) {
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

        console.log('=== PROG SKILL CHECKPOINT QUERY ===');
        console.log('Fetching highest prog skill checkpoint for user:', numericUserId);

        try {
            // Query for prog skill transactions and progress
            const progSkillQuery = `
                query GetProgSkillCheckpoints($userId: Int!) {
                    # Get prog skill transactions
                    progTransactions: transaction(
                        where: {
                            userId: {_eq: $userId},
                            type: {_like: "%prog%"},
                            object: {
                                name: {_ilike: "%checkpoint%"}
                            }
                        }
                        order_by: {amount: desc}
                    ) {
                        id
                        type
                        amount
                        createdAt
                        path
                        object {
                            id
                            name
                            type
                            attrs
                        }
                    }

                    # Get prog skill progress
                    progProgress: progress(
                        where: {
                            userId: {_eq: $userId},
                            object: {
                                name: {_ilike: "%prog%"},
                                _or: [
                                    {name: {_ilike: "%checkpoint%"}},
                                    {type: {_like: "%checkpoint%"}}
                                ]
                            }
                        }
                        order_by: {grade: desc}
                    ) {
                        id
                        grade
                        createdAt
                        updatedAt
                        path
                        object {
                            id
                            name
                            type
                            attrs
                        }
                    }

                    # Get all prog-related skills
                    allProgSkills: transaction(
                        where: {
                            userId: {_eq: $userId},
                            type: {_like: "%prog%"}
                        }
                        order_by: {amount: desc}
                    ) {
                        id
                        type
                        amount
                        createdAt
                        path
                        object {
                            id
                            name
                            type
                            attrs
                        }
                    }
                }
            `;

            const result = await this.query(progSkillQuery, { userId: numericUserId });

            console.log('Prog skill query result:', result);

            const progTransactions = result?.data?.progTransactions || [];
            const progProgress = result?.data?.progProgress || [];
            const allProgSkills = result?.data?.allProgSkills || [];

            console.log('Prog transactions found:', progTransactions.length);
            console.log('Prog progress found:', progProgress.length);
            console.log('All prog skills found:', allProgSkills.length);

            // Analyze the data to find highest checkpoint level
            let highestCheckpointLevel = 0;
            let highestCheckpointData = null;

            // Check transactions for checkpoint levels
            progTransactions.forEach(transaction => {
                const objectName = transaction.object?.name || '';
                const checkpointMatch = objectName.match(/checkpoint[^\d]*(\d+)/i);
                if (checkpointMatch) {
                    const level = parseInt(checkpointMatch[1], 10);
                    if (level > highestCheckpointLevel) {
                        highestCheckpointLevel = level;
                        highestCheckpointData = {
                            level: level,
                            source: 'transaction',
                            amount: transaction.amount,
                            objectName: objectName,
                            path: transaction.path,
                            createdAt: transaction.createdAt,
                            type: transaction.type
                        };
                    }
                }
            });

            // Check progress for checkpoint levels
            progProgress.forEach(progress => {
                const objectName = progress.object?.name || '';
                const checkpointMatch = objectName.match(/checkpoint[^\d]*(\d+)/i);
                if (checkpointMatch) {
                    const level = parseInt(checkpointMatch[1], 10);
                    if (level > highestCheckpointLevel) {
                        highestCheckpointLevel = level;
                        highestCheckpointData = {
                            level: level,
                            source: 'progress',
                            grade: progress.grade,
                            objectName: objectName,
                            path: progress.path,
                            createdAt: progress.createdAt,
                            updatedAt: progress.updatedAt
                        };
                    }
                }
            });

            // Also check all prog skills for any checkpoint references
            allProgSkills.forEach(skill => {
                const objectName = skill.object?.name || '';
                const skillType = skill.type || '';

                // Look for checkpoint patterns in both name and type
                const checkpointMatch = objectName.match(/checkpoint[^\d]*(\d+)/i) ||
                                       skillType.match(/checkpoint[^\d]*(\d+)/i);

                if (checkpointMatch) {
                    const level = parseInt(checkpointMatch[1], 10);
                    if (level > highestCheckpointLevel) {
                        highestCheckpointLevel = level;
                        highestCheckpointData = {
                            level: level,
                            source: 'skill_transaction',
                            amount: skill.amount,
                            objectName: objectName,
                            skillType: skillType,
                            path: skill.path,
                            createdAt: skill.createdAt
                        };
                    }
                }
            });

            console.log('Highest checkpoint level found:', highestCheckpointLevel);
            console.log('Highest checkpoint data:', highestCheckpointData);

            if (highestCheckpointLevel > 0) {
                return {
                    success: true,
                    highestLevel: highestCheckpointLevel,
                    data: highestCheckpointData,
                    summary: {
                        progTransactionsCount: progTransactions.length,
                        progProgressCount: progProgress.length,
                        allProgSkillsCount: allProgSkills.length
                    }
                };
            } else {
                return {
                    success: false,
                    message: 'No prog skill checkpoint levels found',
                    highestLevel: 0,
                    summary: {
                        progTransactionsCount: progTransactions.length,
                        progProgressCount: progProgress.length,
                        allProgSkillsCount: allProgSkills.length
                    }
                };
            }

        } catch (error) {
            console.error('Error fetching prog skill checkpoint data:', error);
            return {
                success: false,
                error: error.message,
                highestLevel: 0
            };
        }
    }
}

// Create global instance
const graphqlService = new GraphQLService();

// Export for use in other modules
window.graphqlService = graphqlService;
