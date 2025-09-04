class AIService {
  constructor() {
    this.apiKey = null;
    this.initializeAI();
  }

  initializeAI() {
    this.apiKey = process.env.REACT_APP_COHERE_API_KEY;
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateWithRetry(prompt, maxRetries = 2) {
    if (!this.apiKey) {
      throw new Error('AI service not initialized. Please add REACT_APP_COHERE_API_KEY to your .env file');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch('https://api.cohere.ai/v1/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'command',
            prompt: prompt,
            max_tokens: 300,
            temperature: 0.7,
            stop_sequences: [],
          }),
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('Rate limit exceeded');
          }
          throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.generations[0].text.trim();
      } catch (error) {
        const isRateLimit = error.message.includes('429') || 
                           error.message.includes('quota') || 
                           error.message.includes('rate limit') ||
                           error.message.includes('Rate limit');
        
        if (isRateLimit && attempt < maxRetries) {
          // Longer delays for rate limiting
          const delay = Math.pow(3, attempt) * 2000; // 6s, 18s...
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await this.sleep(delay);
          continue;
        }
        
        if (isRateLimit) {
          throw new Error('AI service rate limit exceeded. Please wait a few minutes before trying again.');
        }
        
        throw error;
      }
    }
  }

  async generateRepositorySummary(repoData, readmeContent) {
    const prompt = `
    Analyze this GitHub repository and provide key insights in bullet points (2-3 short points):
    
    Repository Name: ${repoData.name}
    Description: ${repoData.description || 'No description provided'}
    Primary Language: ${repoData.language}
    Stars: ${repoData.stargazers_count}
    Forks: ${repoData.forks_count}
    README Content: ${readmeContent ? readmeContent.substring(0, 1000) : 'No README available'}
    
    Format as bullet points covering: purpose, main features, and key characteristics. Keep each point to 1 short sentence only.
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
    Analyze this repository's technology stack and provide key insights in bullet points (2-3 short points):
    
    Repository: ${repoData.name}
    Language Breakdown: ${languageBreakdown}
    Primary Language: ${repoData.language}
    
    Format as bullet points covering: technology choices, project type, and development approach. Keep each point to 1 short sentence only.
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
    Analyze this repository's collaboration and contribution patterns in bullet points (2-3 short points):
    
    Repository: ${repoData.name}
    Total Contributors: ${contributors.length}
    Top Contributors: ${contributorSummary}
    Repository Age: Created ${new Date(repoData.created_at).getFullYear()}
    
    Format as bullet points covering: collaboration health, maintenance activity, and community engagement. Keep each point to 1 short sentence only.
    `;

    try {
      return await this.generateWithRetry(prompt);
    } catch (error) {
      throw new Error(`Failed to generate contribution analysis: ${error.message}`);
    }
  }
}

export default new AIService();
