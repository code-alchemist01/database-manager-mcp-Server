import { ProjectManagerServer } from '../server.js';
import { GitAnalyzer } from '../analyzers/git-analyzer.js';

export function registerGitAnalysisTools(server: ProjectManagerServer) {
  // analyze_commits
  server.registerTool(
    'analyze_commits',
    'Analyzes commit messages for quality and provides suggestions for improvement',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the project directory (must be a git repository)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of commits to analyze (default: 50)',
          default: 50,
        },
      },
      required: ['path'],
    },
    async (args: { path: string; limit?: number }) => {
      try {
        const gitAnalyzer = new GitAnalyzer(args.path);
        const commits = await gitAnalyzer.analyzeCommits(args.limit || 50);
        
        let output = `Commit Analysis (${commits.length} commits):\n\n`;
        
        const qualityCounts = {
          good: commits.filter(c => c.quality === 'good').length,
          fair: commits.filter(c => c.quality === 'fair').length,
          poor: commits.filter(c => c.quality === 'poor').length,
        };
        
        output += `Quality Distribution:\n`;
        output += `  Good: ${qualityCounts.good} (${((qualityCounts.good / commits.length) * 100).toFixed(1)}%)\n`;
        output += `  Fair: ${qualityCounts.fair} (${((qualityCounts.fair / commits.length) * 100).toFixed(1)}%)\n`;
        output += `  Poor: ${qualityCounts.poor} (${((qualityCounts.poor / commits.length) * 100).toFixed(1)}%)\n\n`;
        
        if (qualityCounts.poor > 0 || qualityCounts.fair > 0) {
          output += `Commits Needing Improvement:\n\n`;
          commits
            .filter(c => c.quality !== 'good')
            .slice(0, 10)
            .forEach(commit => {
              output += `[${commit.quality.toUpperCase()}] ${commit.hash.substring(0, 7)}: ${commit.message.split('\n')[0]}\n`;
              if (commit.suggestions.length > 0) {
                commit.suggestions.forEach(suggestion => {
                  output += `  → ${suggestion}\n`;
                });
              }
              output += `\n`;
            });
        }
        
        return output;
      } catch (error: any) {
        throw new Error(`Failed to analyze commits: ${error.message}`);
      }
    }
  );

  // suggest_branch_strategy
  server.registerTool(
    'suggest_branch_strategy',
    'Analyzes current branch structure and suggests a branching strategy (Git Flow, GitHub Flow, etc.)',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the project directory (must be a git repository)',
        },
      },
      required: ['path'],
    },
    async (args: { path: string }) => {
      try {
        const gitAnalyzer = new GitAnalyzer(args.path);
        const strategy = await gitAnalyzer.suggestBranchStrategy();
        
        let output = `Branch Strategy Analysis:\n\n`;
        output += `Current Branches: ${strategy.current.length}\n`;
        output += `  ${strategy.current.join(', ')}\n\n`;
        output += `Recommended Strategy: ${strategy.recommended}\n\n`;
        
        if (strategy.issues.length > 0) {
          output += `Issues Found:\n`;
          strategy.issues.forEach(issue => {
            output += `  ⚠️ ${issue}\n`;
          });
          output += `\n`;
        }
        
        if (strategy.suggestions.length > 0) {
          output += `Suggestions:\n`;
          strategy.suggestions.forEach(suggestion => {
            output += `  → ${suggestion}\n`;
          });
        } else {
          output += `✓ Branch structure looks good!\n`;
        }
        
        return output;
      } catch (error: any) {
        throw new Error(`Failed to suggest branch strategy: ${error.message}`);
      }
    }
  );

  // analyze_diff
  server.registerTool(
    'analyze_diff',
    'Analyzes git diff to identify risks, potential issues, and provides suggestions',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the project directory (must be a git repository)',
        },
        commit: {
          type: 'string',
          description: 'Optional: specific commit hash to analyze (if not provided, analyzes current diff)',
        },
      },
      required: ['path'],
    },
    async (args: { path: string; commit?: string }) => {
      try {
        const gitAnalyzer = new GitAnalyzer(args.path);
        const diffAnalysis = await gitAnalyzer.analyzeDiff(args.commit);
        
        let output = `Diff Analysis:\n\n`;
        output += `${diffAnalysis.summary}\n\n`;
        
        if (diffAnalysis.risks.length > 0) {
          output += `⚠️ Risks Detected:\n`;
          diffAnalysis.risks.forEach(risk => {
            output += `  - ${risk}\n`;
          });
          output += `\n`;
        }
        
        if (diffAnalysis.suggestions.length > 0) {
          output += `💡 Suggestions:\n`;
          diffAnalysis.suggestions.forEach(suggestion => {
            output += `  - ${suggestion}\n`;
          });
        }
        
        if (diffAnalysis.risks.length === 0 && diffAnalysis.suggestions.length === 0) {
          output += `✓ No issues detected in the diff\n`;
        }
        
        return output;
      } catch (error: any) {
        throw new Error(`Failed to analyze diff: ${error.message}`);
      }
    }
  );
}

