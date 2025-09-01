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
      // First try the stats API
      const statsResponse = await this.api.get(`/repos/${owner}/${repo}/stats/commit_activity`);
      if (Array.isArray(statsResponse.data) && statsResponse.data.length > 0) {
        return statsResponse.data;
      }
      
      // If stats API returns empty, fall back to commits API
      console.log('Stats API returned empty data, falling back to commits API...');
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
