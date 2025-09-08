import axios from 'axios';

const GITHUB_API_BASE = 'https://api.github.com';

class ComparisonService {
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

  // Find similar repositories based on language and topics
  async findSimilarRepositories(repoData, count = 10) {
    try {
      const searchQueries = this.buildSearchQueries(repoData);
      const allRepos = [];

      // Search with different query combinations
      for (const query of searchQueries) {
        try {
          const response = await this.api.get('/search/repositories', {
            params: {
              q: query,
              sort: 'stars',
              order: 'desc',
              per_page: 30
            }
          });

          // Filter out the original repository and add to results
          const filteredRepos = response.data.items.filter(
            repo => repo.full_name !== repoData.full_name
          );
          allRepos.push(...filteredRepos);
        } catch (error) {
          console.warn(`Search query failed: ${query}`, error.message);
        }
      }

      // Remove duplicates and shuffle
      const uniqueRepos = this.removeDuplicates(allRepos);
      const shuffledRepos = this.shuffleArray(uniqueRepos);
      
      return shuffledRepos.slice(0, count);
    } catch (error) {
      throw new Error(`Failed to find similar repositories: ${error.message}`);
    }
  }

  // Build search queries based on repository characteristics
  buildSearchQueries(repoData) {
    const queries = [];
    
    // Identify the domain/purpose of the repository
    const domain = this.identifyRepositoryDomain(repoData);
    console.log('Identified domain:', domain);
    
    // Add domain-specific queries first (highest priority)
    if (domain) {
      domain.keywords.forEach(keyword => {
        queries.push(keyword);
        if (repoData.language) {
          queries.push(`language:${repoData.language} ${keyword}`);
        }
      });
    }

    // Add topic-based queries
    if (repoData.topics && repoData.topics.length > 0) {
      repoData.topics.forEach(topic => {
        queries.push(`topic:${topic}`);
        if (repoData.language) {
          queries.push(`language:${repoData.language} topic:${topic}`);
        }
      });
    }

    // Add description-based queries
    if (repoData.description) {
      const keywords = this.extractKeywords(repoData.description);
      keywords.forEach(keyword => {
        queries.push(keyword);
        if (repoData.language) {
          queries.push(`language:${repoData.language} ${keyword}`);
        }
      });
    }

    // Add size-based queries for similar scale projects
    if (repoData.size) {
      const sizeRange = this.getSizeRange(repoData.size);
      queries.push(`size:${sizeRange}${repoData.language ? ` language:${repoData.language}` : ''}`);
    }

    return queries.slice(0, 8); // Increased limit for better domain matching
  }

  // Identify the domain/purpose of the repository
  identifyRepositoryDomain(repoData) {
    const text = `${repoData.name} ${repoData.description || ''} ${(repoData.topics || []).join(' ')}`.toLowerCase();
    
    const domains = {
      chatbot: {
        name: 'Chatbot',
        keywords: ['chatbot', 'chat bot', 'conversational ai', 'nlp', 'natural language', 'assistant', 'virtual assistant', 'ai assistant', 'conversation', 'dialogue', 'chat', 'messaging bot', 'discord bot', 'telegram bot', 'slack bot']
      },
      ecommerce: {
        name: 'E-commerce',
        keywords: ['ecommerce', 'e-commerce', 'online store', 'shopping cart', 'payment', 'checkout', 'product catalog', 'inventory', 'order management', 'marketplace', 'shop', 'store', 'retail', 'pos', 'point of sale', 'billing', 'subscription']
      },
      social: {
        name: 'Social Media',
        keywords: ['social media', 'social network', 'facebook', 'twitter', 'instagram', 'linkedin', 'social platform', 'community', 'user profile', 'friends', 'followers', 'posts', 'feed', 'timeline', 'messaging', 'chat']
      },
      blog: {
        name: 'Blog/CMS',
        keywords: ['blog', 'cms', 'content management', 'article', 'post', 'editor', 'publishing', 'wordpress', 'markdown', 'static site', 'documentation', 'news', 'journal']
      },
      game: {
        name: 'Gaming',
        keywords: ['game', 'gaming', 'player', 'score', 'level', 'puzzle', 'arcade', 'multiplayer', 'single player', 'board game', 'card game', 'strategy', 'adventure', 'rpg', 'simulation']
      },
      education: {
        name: 'Education',
        keywords: ['education', 'learning', 'course', 'tutorial', 'lesson', 'student', 'teacher', 'academy', 'school', 'university', 'training', 'quiz', 'exam', 'certificate', 'mooc', 'elearning']
      },
      finance: {
        name: 'Finance',
        keywords: ['finance', 'financial', 'banking', 'payment', 'wallet', 'cryptocurrency', 'crypto', 'bitcoin', 'trading', 'investment', 'portfolio', 'budget', 'expense', 'accounting', 'invoice', 'billing']
      },
      healthcare: {
        name: 'Healthcare',
        keywords: ['healthcare', 'medical', 'health', 'patient', 'doctor', 'hospital', 'clinic', 'diagnosis', 'treatment', 'medicine', 'pharmacy', 'fitness', 'wellness', 'therapy', 'appointment']
      },
      productivity: {
        name: 'Productivity',
        keywords: ['productivity', 'task', 'todo', 'project management', 'calendar', 'schedule', 'reminder', 'note', 'organizer', 'planner', 'time tracking', 'workflow', 'automation', 'efficiency']
      },
      entertainment: {
        name: 'Entertainment',
        keywords: ['entertainment', 'music', 'video', 'movie', 'streaming', 'player', 'media', 'audio', 'video player', 'playlist', 'radio', 'podcast', 'gallery', 'photo', 'image']
      },
      developer: {
        name: 'Developer Tools',
        keywords: ['developer', 'dev tools', 'api', 'sdk', 'library', 'framework', 'cli', 'command line', 'debug', 'testing', 'deployment', 'ci/cd', 'docker', 'kubernetes', 'monitoring']
      },
      analytics: {
        name: 'Analytics',
        keywords: ['analytics', 'dashboard', 'metrics', 'statistics', 'chart', 'graph', 'data visualization', 'reporting', 'kpi', 'tracking', 'monitoring', 'insights', 'business intelligence']
      }
    };

    // Score each domain based on keyword matches
    let bestMatch = null;
    let bestScore = 0;

    for (const [domainKey, domain] of Object.entries(domains)) {
      let score = 0;
      domain.keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          // Give higher weight to exact matches and longer keywords
          const weight = keyword.length > 10 ? 3 : keyword.length > 5 ? 2 : 1;
          score += weight;
        }
      });

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { key: domainKey, ...domain };
      }
    }

    // Only return domain if we have a reasonable confidence (score >= 2)
    return bestScore >= 2 ? bestMatch : null;
  }

  // Extract keywords from description
  extractKeywords(description) {
    if (!description) return [];
    
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those'];
    
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word))
      .slice(0, 3); // Take top 3 keywords
  }

  // Get size range for similar projects
  getSizeRange(size) {
    if (size < 1000) return '<1000';
    if (size < 10000) return '1000..10000';
    if (size < 100000) return '10000..100000';
    return '>100000';
  }

  // Remove duplicate repositories
  removeDuplicates(repos) {
    const seen = new Set();
    return repos.filter(repo => {
      if (seen.has(repo.id)) {
        return false;
      }
      seen.add(repo.id);
      return true;
    });
  }

  // Shuffle array to get random order
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Get a domain-appropriate similar repository (avoids mismatched comparisons)
  async getRandomSimilarRepository(repoData) {
    try {
      const similarRepos = await this.findSimilarRepositories(repoData, 50);
      if (similarRepos.length === 0) {
        throw new Error('No similar repositories found');
      }

      // Prefer repositories that match domain and language closely
      const domain = this.identifyRepositoryDomain(repoData);
      const language = repoData.language;

      // Hard filters to avoid wildly different repos
      const baseStars = repoData.stargazers_count || 0;
      const baseSize = repoData.size || 0;
      const topics1 = repoData.topics || [];

      const filtered = similarRepos.filter(r => {
        // Language must match if known
        if (language && r.language && r.language !== language) return false;
        // If we can infer domain, ensure at least one domain keyword appears
        if (domain) {
          const text = `${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`.toLowerCase();
          const domainHit = domain.keywords.some(k => text.includes(k));
          if (!domainHit) return false;
        }
        // Keep size within a reasonable band when available
        if (baseSize > 0 && r.size) {
          const minSize = Math.max(10, Math.floor(baseSize * 0.3));
          const maxSize = Math.ceil(baseSize * 3.5);
          if (r.size < minSize || r.size > maxSize) return false;
        }
        // Avoid huge popularity gaps for tiny repos
        if (baseStars < 50 && (r.stargazers_count || 0) > 2000) return false;
        // If topics exist, require at least one overlap
        if (topics1.length > 0) {
          const common = this.findCommonTopics(topics1, r.topics || []);
          if (common.length === 0) return false;
        }
        return true;
      });

      const pool = filtered.length > 0 ? filtered : similarRepos;

      const scored = pool.map(r => {
        let score = 0;
        // Stars give general popularity/context
        score += Math.min(50, Math.log10((r.stargazers_count || 1) + 1) * 10);
        // License presence is a quality signal
        if (r.license?.name) score += 5;
        // Language match is important
        if (language && r.language === language) score += 25;
        // Topics overlap
        const commonTopics = this.findCommonTopics(topics1, r.topics || []);
        score += Math.min(15, commonTopics.length * 3);
        // Domain keyword matches in name/description
        if (domain) {
          const text = `${r.name} ${r.description || ''} ${(r.topics || []).join(' ')}`.toLowerCase();
          domain.keywords.forEach(k => { if (text.includes(k)) score += 3; });
        }
        return { repo: r, score };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored[0].repo;
    } catch (error) {
      throw new Error(`Failed to get random similar repository: ${error.message}`);
    }
  }

  // Compare two repositories
  compareRepositories(repo1, repo2) {
    const comparison = {
      repository1: {
        name: repo1.name,
        fullName: repo1.full_name,
        owner: repo1.owner.login,
        stars: repo1.stargazers_count,
        forks: repo1.forks_count,
        watchers: repo1.watchers_count,
        language: repo1.language,
        size: repo1.size,
        createdAt: repo1.created_at,
        updatedAt: repo1.updated_at,
        description: repo1.description,
        topics: repo1.topics || [],
        license: repo1.license?.name,
        openIssues: repo1.open_issues_count,
        defaultBranch: repo1.default_branch
      },
      repository2: {
        name: repo2.name,
        fullName: repo2.full_name,
        owner: repo2.owner.login,
        stars: repo2.stargazers_count,
        forks: repo2.forks_count,
        watchers: repo2.watchers_count,
        language: repo2.language,
        size: repo2.size,
        createdAt: repo2.created_at,
        updatedAt: repo2.updated_at,
        description: repo2.description,
        topics: repo2.topics || [],
        license: repo2.license?.name,
        openIssues: repo2.open_issues_count,
        defaultBranch: repo2.default_branch
      },
      comparison: {
        starsDifference: repo1.stargazers_count - repo2.stargazers_count,
        forksDifference: repo1.forks_count - repo2.forks_count,
        watchersDifference: repo1.watchers_count - repo2.watchers_count,
        sizeDifference: repo1.size - repo2.size,
        ageDifference: this.calculateAgeDifference(repo1.created_at, repo2.created_at),
        lastUpdateDifference: this.calculateTimeDifference(repo1.updated_at, repo2.updated_at),
        commonTopics: this.findCommonTopics(repo1.topics || [], repo2.topics || []),
        languageMatch: repo1.language === repo2.language,
        licenseMatch: repo1.license?.name === repo2.license?.name
      }
    };

    // Determine which repository is "better" based on multiple factors
    comparison.winner = this.determineWinner(comparison);

    return comparison;
  }

  // Calculate age difference in days
  calculateAgeDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
  }

  // Calculate time difference in days
  calculateTimeDifference(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
  }

  // Find common topics between repositories
  findCommonTopics(topics1, topics2) {
    const set1 = new Set(topics1);
    const set2 = new Set(topics2);
    return topics1.filter(topic => set2.has(topic));
  }

  // Determine which repository is "better" based on various metrics
  determineWinner(comparison) {
    const { repository1, repository2, comparison: comp } = comparison;
    
    let score1 = 0;
    let score2 = 0;

    // Stars (40% weight)
    if (comp.starsDifference > 0) score1 += 40;
    else if (comp.starsDifference < 0) score2 += 40;
    else { score1 += 20; score2 += 20; }

    // Forks (20% weight)
    if (comp.forksDifference > 0) score1 += 20;
    else if (comp.forksDifference < 0) score2 += 20;
    else { score1 += 10; score2 += 10; }

    // Watchers (15% weight)
    if (comp.watchersDifference > 0) score1 += 15;
    else if (comp.watchersDifference < 0) score2 += 15;
    else { score1 += 7.5; score2 += 7.5; }

    // Recent activity (15% weight) - more recent updates are better
    if (comp.lastUpdateDifference < 0) score1 += 15; // repo1 updated more recently
    else if (comp.lastUpdateDifference > 0) score2 += 15; // repo2 updated more recently
    else { score1 += 7.5; score2 += 7.5; }

    // Language match bonus (5% weight)
    if (comp.languageMatch) {
      score1 += 2.5;
      score2 += 2.5;
    }

    // Common topics bonus (5% weight)
    const commonTopicsCount = comp.commonTopics.length;
    if (commonTopicsCount > 0) {
      score1 += Math.min(5, commonTopicsCount * 1.5);
      score2 += Math.min(5, commonTopicsCount * 1.5);
    }

    if (score1 > score2) return 'repository1';
    if (score2 > score1) return 'repository2';
    return 'tie';
  }

  // Get detailed comparison with additional metrics
  async getDetailedComparison(repo1, repo2) {
    try {
      // Get additional data for both repositories
      const [repo1Details, repo2Details] = await Promise.all([
        this.api.get(`/repos/${repo1.owner.login}/${repo1.name}`),
        this.api.get(`/repos/${repo2.owner.login}/${repo2.name}`)
      ]);

      // Analyze engineering quality signals (security, scalability, structure, management)
      const [q1, q2] = await Promise.all([
        this.analyzeRepositoryQuality(repo1Details.data).catch(() => null),
        this.analyzeRepositoryQuality(repo2Details.data).catch(() => null)
      ]);

      const base = this.compareRepositories(repo1Details.data, repo2Details.data);
      if (q1 && q2) {
        base.repository1.quality = q1;
        base.repository2.quality = q2;
        base.comparison.qualityScores = {
          repo1: q1.totalScore,
          repo2: q2.totalScore
        };
        // Nudge winner based on quality (up to 10 points)
        if (q1.totalScore !== q2.totalScore) {
          const diff = Math.sign(q1.totalScore - q2.totalScore);
          if (diff > 0 && base.winner !== 'repository1') base.winner = 'repository1';
          if (diff < 0 && base.winner !== 'repository2') base.winner = 'repository2';
        }
      }
      return base;
    } catch (error) {
      // Fallback to basic comparison if detailed fetch fails
      return this.compareRepositories(repo1, repo2);
    }
  }

  async analyzeRepositoryQuality(repo) {
    const owner = repo.owner.login;
    const name = repo.name;

    const exists = async (path) => {
      try {
        await this.api.get(`/repos/${owner}/${name}/contents/${encodeURIComponent(path)}`);
        return true;
      } catch {
        return false;
      }
    };

    const files = await Promise.all([
      exists('.github/workflows'),
      exists('.github/workflows/codeql.yml'),
      exists('.github/dependabot.yml'),
      exists('Dockerfile'),
      exists('docker-compose.yml'),
      exists('kubernetes'),
      exists('.k8s'),
      exists('helm'),
      exists('SECURITY.md'),
      exists('CODE_OF_CONDUCT.md'),
      exists('CONTRIBUTING.md'),
      exists('.github/ISSUE_TEMPLATE'),
      exists('.github/PULL_REQUEST_TEMPLATE.md'),
      exists('package.json'),
      exists('pnpm-workspace.yaml'),
      exists('yarn.lock'),
      exists('tsconfig.json'),
      exists('jest.config.js'),
      exists('jest.config.ts'),
      exists('__tests__'),
      exists('tests'),
      exists('.eslintrc.js'),
      exists('.eslintrc.cjs'),
      exists('.eslintrc.json'),
      exists('.prettierrc'),
      exists('CHANGELOG.md'),
    ]);

    const [ci, codeql, dependabot, docker, compose, k8s1, k8s2, helm,
      securityMd, codeOfConduct, contributing, issueTemplate, prTemplate,
      pkgJson, pnpmWs, yarnLock, tsconfig, jestJs, jestTs, testsFolder, testsFolder2,
      eslint1, eslint2, eslint3, prettier, changelog] = files;

    // Scalability signals
    const scalabilitySignals = {
      ci,
      docker: docker || compose,
      kubernetes: k8s1 || k8s2 || helm,
    };
    const scalabilityScore = [scalabilitySignals.ci, scalabilitySignals.docker, scalabilitySignals.kubernetes].filter(Boolean).length;

    // Security signals
    const securitySignals = {
      codeql,
      dependabot,
      securityPolicy: securityMd,
      codeOfConduct,
      license: Boolean(repo.license?.name),
    };
    const securityScore = [securitySignals.codeql, securitySignals.dependabot, securitySignals.securityPolicy, securitySignals.codeOfConduct, securitySignals.license].filter(Boolean).length;

    // Structure signals
    const tests = jestJs || jestTs || testsFolder || testsFolder2;
    const lint = eslint1 || eslint2 || eslint3;
    const typescript = tsconfig;
    const monorepo = pnpmWs || (pkgJson && await this.hasWorkspaces(owner, name));
    const structureSignals = { tests, lint, typescript, monorepo };
    const structureScore = [tests, lint, typescript, monorepo].filter(Boolean).length;

    // Management signals
    const managementSignals = {
      contributing,
      issueTemplates: issueTemplate,
      prTemplate,
      changelog,
      issuesEnabled: repo.has_issues !== false,
    };
    const managementScore = [managementSignals.contributing, managementSignals.issueTemplates, managementSignals.prTemplate, managementSignals.changelog, managementSignals.issuesEnabled].filter(Boolean).length;

    const totalScore = scalabilityScore + securityScore + structureScore + managementScore;

    return {
      scalability: { signals: scalabilitySignals, score: scalabilityScore },
      security: { signals: securitySignals, score: securityScore },
      structure: { signals: structureSignals, score: structureScore },
      management: { signals: managementSignals, score: managementScore },
      totalScore,
    };
  }

  async hasWorkspaces(owner, name) {
    try {
      const res = await this.api.get(`/repos/${owner}/${name}/contents/package.json`);
      const content = atob(res.data.content || '');
      const json = JSON.parse(content);
      return Boolean(json.workspaces);
    } catch {
      return false;
    }
  }

  // Make identifyRepositoryDomain accessible (already defined above)
}

export default new ComparisonService();
