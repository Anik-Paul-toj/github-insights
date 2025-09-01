import { GoogleGenerativeAI } from '@google/generative-ai';

class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initializeAI();
  }

  initializeAI() {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateWithRetry(prompt, maxRetries = 2) {
    if (!this.model) {
      throw new Error('AI service not initialized. Please add REACT_APP_GEMINI_API_KEY to your .env file');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (error) {
        const isRateLimit = error.message.includes('429') || 
                           error.message.includes('quota') || 
                           error.message.includes('rate limit') ||
                           error.status === 429 ||
                           error.response?.status === 429;
        
        if (isRateLimit && attempt < maxRetries) {
          // Longer delays for rate limiting
          const delay = Math.pow(3, attempt) * 2000; // 6s, 18s...
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await this.sleep(delay);
          continue;
        }
        
        if (isRateLimit) {
          throw new Error('AI service rate limit exceeded. The free Gemini API allows ~15 requests per minute. Please wait a few minutes before trying again.');
        }
        
        throw error;
      }
    }
  }

  async generateRepositorySummary(repoData, readmeContent) {
    const prompt = `
    Analyze this GitHub repository and provide a concise, informative summary (2-3 sentences):
    
    Repository Name: ${repoData.name}
    Description: ${repoData.description || 'No description provided'}
    Primary Language: ${repoData.language}
    Stars: ${repoData.stargazers_count}
    Forks: ${repoData.forks_count}
    README Content: ${readmeContent ? readmeContent.substring(0, 1000) : 'No README available'}
    
    Focus on the repository's purpose, main features, and significance.
    `;

    try {
      return await this.generateWithRetry(prompt);
    } catch (error) {
      throw new Error(`Failed to generate repository summary: ${error.message}`);
    }
  }

  async generateLanguageAnalysis(languages, repoData) {
    const languageBreakdown = Object.entries(languages)
      .map(([lang, bytes]) => `${lang}: ${bytes} bytes`)
      .join(', ');

    const prompt = `
    Analyze this repository's technology stack and provide insights (2-3 sentences):
    
    Repository: ${repoData.name}
    Language Breakdown: ${languageBreakdown}
    Primary Language: ${repoData.language}
    
    Explain what this technology stack suggests about the project type, architecture, and development approach.
    `;

    try {
      return await this.generateWithRetry(prompt);
    } catch (error) {
      throw new Error(`Failed to generate language analysis: ${error.message}`);
    }
  }

  async generateContributionAnalysis(contributors, repoData) {
    const topContributors = contributors.slice(0, 5);
    const contributorSummary = topContributors
      .map(c => `${c.login}: ${c.contributions} contributions`)
      .join(', ');

    const prompt = `
    Analyze this repository's collaboration and contribution patterns (2-3 sentences):
    
    Repository: ${repoData.name}
    Total Contributors: ${contributors.length}
    Top Contributors: ${contributorSummary}
    Repository Age: Created ${new Date(repoData.created_at).getFullYear()}
    
    Describe the collaboration health, maintenance activity, and community engagement.
    `;

    try {
      return await this.generateWithRetry(prompt);
    } catch (error) {
      throw new Error(`Failed to generate contribution analysis: ${error.message}`);
    }
  }
}

export default new AIService();
