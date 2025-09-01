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
      const response = await this.api.get(`/repos/${owner}/${repo}/stats/commit_activity`);
      // GitHub API sometimes returns null for commit activity data
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.warn(`Failed to fetch commit activity: ${error.message}`);
      return []; // Return empty array instead of throwing error
    }
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
