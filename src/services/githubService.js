import axios from 'axios';

const GITHUB_API_BASE = 'https://api.github.com';

class GitHubService {
  constructor() {
    this.api = axios.create({
      baseURL: GITHUB_API_BASE,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        ...(process.env.REACT_APP_GITHUB_TOKEN && {
          'Authorization': `token ${process.env.REACT_APP_GITHUB_TOKEN}`
        })
      }
    });
  }

  async getUserContributions(username) {
    // Uses GitHub GraphQL API to fetch the contributions calendar which matches the GitHub profile grid
    const token = process.env.REACT_APP_GITHUB_TOKEN;
    if (!token) {
      // Without a token, GraphQL endpoint will be rate-limited or unavailable
      return null;
    }
    const endpoint = 'https://api.github.com/graphql';
    const now = new Date();
    const from = new Date();
    from.setFullYear(from.getFullYear() - 1);
    const query = `
      query($login:String!, $from:DateTime!, $to:DateTime!){
        user(login:$login){
          contributionsCollection(from:$from, to:$to){
            contributionCalendar{
              totalContributions
              weeks{
                firstDay
                contributionDays{ date contributionCount }
              }
            }
          }
        }
      }
    `;
    const variables = { login: username, from: from.toISOString(), to: now.toISOString() };
    try {
      const res = await axios.post(
        endpoint,
        { query, variables },
        { headers: { 'Content-Type': 'application/json', 'Authorization': `bearer ${token}` } }
      );
      const weeks = res?.data?.data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];
      if (!Array.isArray(weeks) || weeks.length === 0) return [];
      // Transform to [{ week, total, days: [..7..] }]
      const transformed = weeks.map(w => {
        const weekTs = Math.floor(new Date(w.firstDay).getTime() / 1000);
        const days = (w.contributionDays || []).map(d => d.contributionCount);
        return {
          week: weekTs,
          total: days.reduce((a, b) => a + (b || 0), 0),
          days
        };
      });
      return transformed;
    } catch (e) {
      console.warn('GraphQL contributions fetch failed', e?.message || e);
      return null;
    }
  }

  async getUserRepositories(username, page = 1, per_page = 30) {
    try {
      const response = await this.api.get(`/users/${username}/repos`, {
        params: {
          sort: 'updated',
          page,
          per_page
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch repositories: ${error.message}`);
    }
  }

  async getOrgRepositories(org, page = 1, per_page = 30) {
    try {
      const response = await this.api.get(`/orgs/${org}/repos`, {
        params: {
          sort: 'updated',
          page,
          per_page
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch org repositories: ${error.message}`);
    }
  }

  async getAnyOwnerRepositories(owner, page = 1, per_page = 30) {
    try {
      return await this.getUserRepositories(owner, page, per_page);
    } catch (e) {
      // If user not found, try as org
      try {
        return await this.getOrgRepositories(owner, page, per_page);
      } catch (e2) {
        // Final fallback: search API with user/org qualifier
        try {
          const res = await this.api.get('/search/repositories', {
            params: {
              q: `user:${owner}`,
              sort: 'stars',
              order: 'desc',
              per_page
            }
          });
          return res.data?.items || [];
        } catch (e3) {
          throw e2;
        }
      }
    }
  }

  async getAllUserRepositories(username, maxPages = 5) {
    const per_page = 100;
    let page = 1;
    const all = [];
    while (page <= maxPages) {
      const batch = await this.getUserRepositories(username, page, per_page);
      all.push(...batch);
      if (!Array.isArray(batch) || batch.length < per_page) break;
      page += 1;
    }
    return all;
  }

  async getRepository(owner, repo) {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch repository: ${error.message}`);
    }
  }

  async getLanguages(owner, repo) {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/languages`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch languages: ${error.message}`);
    }
  }

  async getCommitActivity(owner, repo) {
    try {
      // First try the stats API with retries, as GitHub may need time to generate stats
      const maxRetries = 6; // ~6s total wait
      const delayMs = 1000;
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const statsResponse = await this.api.get(`/repos/${owner}/${repo}/stats/commit_activity`);
        if (Array.isArray(statsResponse.data) && statsResponse.data.length > 0) {
          return statsResponse.data;
        }
        // 202 Accepted or empty array: wait and retry
        await new Promise(res => setTimeout(res, delayMs));
      }
      // If stats API still returns empty, fall back to commits API
      return await this.getCommitActivityFallback(owner, repo);
    } catch (error) {
      console.warn(`Failed to fetch commit activity from stats API: ${error.message}`);
      // Try fallback method
      try {
        return await this.getCommitActivityFallback(owner, repo);
      } catch (fallbackError) {
        console.warn(`Fallback commit activity also failed: ${fallbackError.message}`);
        return [];
      }
    }
  }

  async getCommitActivityFallback(owner, repo) {
    try {
      // Get commits from the last 12 months
      const since = new Date();
      since.setFullYear(since.getFullYear() - 1);
      
      const response = await this.api.get(`/repos/${owner}/${repo}/commits`, {
        params: {
          since: since.toISOString(),
          per_page: 100 // Get more commits for better data
        }
      });

      if (!Array.isArray(response.data) || response.data.length === 0) {
        return [];
      }

      // Process commits into weekly activity data
      const commits = response.data;
      const weeklyActivity = this.processCommitsIntoWeeklyActivity(commits);
      
      return weeklyActivity;
    } catch (error) {
      throw new Error(`Failed to fetch commit data: ${error.message}`);
    }
  }

  processCommitsIntoWeeklyActivity(commits) {
    // Create a map to store commits per week
    const weeklyData = new Map();
    
    commits.forEach(commit => {
      const commitDate = new Date(commit.commit.author.date);
      // Get the start of the week (Sunday)
      const weekStart = new Date(commitDate);
      weekStart.setDate(commitDate.getDate() - commitDate.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekTimestamp = Math.floor(weekStart.getTime() / 1000);
      
      if (!weeklyData.has(weekTimestamp)) {
        weeklyData.set(weekTimestamp, {
          week: weekTimestamp,
          total: 0,
          days: [0, 0, 0, 0, 0, 0, 0] // Sunday to Saturday
        });
      }
      
      const dayOfWeek = commitDate.getDay();
      weeklyData.get(weekTimestamp).total++;
      weeklyData.get(weekTimestamp).days[dayOfWeek]++;
    });
    
    // Convert map to array and sort by week
    const sortedWeeks = Array.from(weeklyData.values())
      .sort((a, b) => a.week - b.week)
      .slice(-52); // Get last 52 weeks
    
    return sortedWeeks;
  }

  async getContributors(owner, repo) {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/contributors`);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn(`Failed to fetch contributors: ${error.message}`);
      return []; // Return empty array instead of throwing error
    }
  }

  async getReadme(owner, repo) {
    try {
      const response = await this.api.get(`/repos/${owner}/${repo}/readme`);
      // Decode base64 content
      return atob(response.data.content);
    } catch (error) {
      // README might not exist
      return null;
    }
  }
}

export default new GitHubService();
