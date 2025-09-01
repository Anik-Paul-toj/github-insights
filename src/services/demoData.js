// Demo data for testing without hitting API rate limits
export const demoInsights = {
  repositorySummary: "This appears to be a comprehensive web development framework built with modern JavaScript. The repository demonstrates sophisticated architecture with a focus on developer experience, featuring extensive documentation and a robust ecosystem of tools and plugins.",
  
  languageAnalysis: "This is a typical modern web application stack with JavaScript as the primary language, complemented by TypeScript for type safety and CSS for styling. The technology stack suggests a focus on scalable web development with emphasis on maintainability and developer productivity.",
  
  contributionAnalysis: "This repository shows healthy collaboration patterns with active maintenance from a core team of developers. The contribution distribution indicates a well-managed open-source project with regular commits and community engagement, suggesting strong project governance and sustainable development practices."
};

export const getDemoInsightsForRepo = (repoData) => {
  const { name, language, stargazers_count, description, forks_count } = repoData;
  
  // Generate more realistic and specific insights based on actual repo data
  const getProjectType = () => {
    const desc = description?.toLowerCase() || '';
    const repoName = name.toLowerCase();
    
    if (desc.includes('framework') || desc.includes('library')) return 'framework/library';
    if (desc.includes('app') || desc.includes('application')) return 'application';
    if (desc.includes('tool') || desc.includes('cli')) return 'development tool';
    if (desc.includes('api') || desc.includes('server')) return 'backend service';
    if (repoName.includes('docs') || desc.includes('documentation')) return 'documentation';
    return 'software project';
  };

  const getPopularityLevel = () => {
    if (stargazers_count > 10000) return 'highly popular';
    if (stargazers_count > 1000) return 'popular';
    if (stargazers_count > 100) return 'well-received';
    return 'emerging';
  };

  const getTechContext = () => {
    switch (language?.toLowerCase()) {
      case 'javascript':
        return 'modern web development with a focus on performance and developer experience';
      case 'typescript':
        return 'type-safe development with enhanced maintainability and scalability';
      case 'python':
        return 'versatile development with emphasis on readability and rapid prototyping';
      case 'java':
        return 'enterprise-grade development with robust architecture patterns';
      case 'go':
        return 'concurrent systems programming with simplicity and efficiency';
      case 'rust':
        return 'systems programming with memory safety and zero-cost abstractions';
      case 'c++':
        return 'high-performance computing with fine-grained control over system resources';
      default:
        return 'modern software development following industry best practices';
    }
  };

  return {
    repositorySummary: `${name} is a ${getPopularityLevel()} ${getProjectType()} ${description ? `that ${description.toLowerCase()}` : 'with active development'}. With ${stargazers_count.toLocaleString()} stars and ${forks_count.toLocaleString()} forks, this repository demonstrates strong community adoption and showcases ${language || 'multi-language'} development excellence with comprehensive documentation and modern development practices.`,
    
    languageAnalysis: `The primary use of ${language || 'multiple programming languages'} indicates this project follows ${getTechContext()}. The technology stack reflects ${stargazers_count > 5000 ? 'enterprise-level' : 'production-ready'} architecture choices, suggesting the maintainers prioritize ${language?.toLowerCase() === 'typescript' ? 'type safety and maintainability' : language?.toLowerCase() === 'rust' ? 'performance and safety' : 'code quality and developer productivity'}.`,
    
    contributionAnalysis: `This ${getPopularityLevel()} project with ${stargazers_count.toLocaleString()} stars demonstrates ${stargazers_count > 5000 ? 'excellent community engagement with distributed contributions from multiple maintainers' : stargazers_count > 1000 ? 'healthy collaboration patterns with active community participation' : 'focused development with consistent maintenance activity'}. The ${forks_count} forks indicate ${forks_count > 1000 ? 'strong developer interest and active contribution ecosystem' : forks_count > 100 ? 'good community engagement and collaborative development' : 'steady interest from the developer community'}.`
  };
};
