/**
 * GraphQL Service
 * Handles all GraphQL queries to Zone01 Kisumu API
 * Implements normal, nested, and argument-based queries as required
 */

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
                        type: {_eq: "xp"}
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
                    }
                }
            }
        `;

        const result = await this.query(query, { userId: numericUserId });
        return result?.data?.transaction || [];
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
                transaction_aggregate(
                    where: {
                        userId: {_eq: $userId},
                        type: {_eq: "down"}
                    }
                ) {
                    aggregate {
                        sum {
                            amount
                        }
                    }
                }
            }
        `;

        const result = await this.query(query, { userId: numericUserId });
        const upTransactions = result?.data?.transaction || [];
        const downSum = result?.data?.transaction_aggregate?.aggregate?.sum?.amount || 0;

        const upSum = upTransactions.reduce((sum, t) => sum + t.amount, 0);

        return {
            auditsGiven: upSum,
            auditsReceived: Math.abs(downSum),
            auditRatio: downSum !== 0 ? upSum / Math.abs(downSum) : upSum > 0 ? upSum : 0,
            transactions: upTransactions
        };
    }

    /**
     * Get specific object information (argument-based query)
     * @param {number} objectId - Object ID
     * @returns {Promise<Object>} Object data
     */
    async getObject(objectId) {
        const query = `
            query GetObject($objectId: bigint!) {
                object(where: {id: {_eq: $objectId}}) {
                    id
                    name
                    type
                    attrs
                    createdAt
                    updatedAt
                }
            }
        `;

        const result = await this.query(query, { objectId });
        const objects = result?.data?.object || [];
        return objects.length > 0 ? objects[0] : null;
    }

    /**
     * Get user skills from transactions and progress
     * @param {number} userId - User ID
     * @returns {Promise<Array>} Skills data
     */
    async getUserSkills(userId) {
        // Ensure userId is a number
        const numericUserId = typeof userId === 'string' ? parseInt(userId, 10) : userId;

        const query = `
            query GetUserSkills($userId: Int!) {
                transaction(
                    where: {
                        userId: {_eq: $userId},
                        type: {_eq: "skill_up"}
                    }
                    order_by: {createdAt: desc}
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
        return result?.data?.transaction || [];
    }

    /**
     * Get comprehensive user profile data
     * @param {number} userId - User ID
     * @returns {Promise<Object>} Complete profile data
     */
    async getUserProfile(userId) {
        try {
            console.log('Fetching complete user profile for ID:', userId);
            
            const [user, xpData, progress, results, audits, skills] = await Promise.all([
                this.getCurrentUser(),
                this.getUserXP(userId),
                this.getUserProgress(userId),
                this.getUserResults(userId),
                this.getUserAudits(userId),
                this.getUserSkills(userId)
            ]);

            return {
                user,
                xp: xpData,
                progress,
                results,
                audits,
                skills
            };
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw error;
        }
    }
}

// Create global instance
const graphqlService = new GraphQLService();

// Export for use in other modules
window.graphqlService = graphqlService;
