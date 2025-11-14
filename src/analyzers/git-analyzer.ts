import simpleGit, { SimpleGit } from 'simple-git';
import * as path from 'path';
import type { GitCommit, BranchStrategy, DiffAnalysis } from '../types/index.js';

export class GitAnalyzer {
  private git: SimpleGit;

  constructor(projectPath: string) {
    this.git = simpleGit(path.resolve(projectPath));
  }

  async analyzeCommits(limit: number = 50): Promise<GitCommit[]> {
    try {
      const log = await this.git.log({ maxCount: limit });
      const commits: GitCommit[] = [];

      for (const commit of log.all) {
        const files = await this.git.show([commit.hash, '--name-only', '--pretty=format:']);
        const fileList = files.split('\n').filter(f => f.trim() && !f.startsWith('commit'));

        const quality = this.assessCommitQuality(commit.message);
        const suggestions = this.getCommitSuggestions(commit.message, quality);

        commits.push({
          hash: commit.hash,
          message: commit.message,
          author: commit.author_name,
          date: new Date(commit.date),
          files: fileList,
          quality,
          suggestions,
        });
      }

      return commits;
    } catch (error: any) {
      throw new Error(`Failed to analyze commits: ${error.message}`);
    }
  }

  private assessCommitQuality(message: string): 'good' | 'fair' | 'poor' {
    // Good commit messages typically have:
    // - Clear prefix (feat, fix, etc.)
    // - Descriptive text
    // - Proper length (not too short, not too long)
    
    const hasPrefix = /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:/.test(message);
    const hasDescription = message.length > 20 && message.length < 200;
    const hasDetail = message.split('\n').length > 1 || message.length > 50;
    
    if (hasPrefix && hasDescription && hasDetail) {
      return 'good';
    } else if (hasPrefix || hasDescription) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  private getCommitSuggestions(message: string, quality: 'good' | 'fair' | 'poor'): string[] {
    const suggestions: string[] = [];
    
    if (quality === 'poor' || quality === 'fair') {
      if (!/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:/.test(message)) {
        suggestions.push('Use conventional commit format: type(scope): description');
        suggestions.push('Common types: feat, fix, docs, style, refactor, test, chore');
      }
      
      if (message.length < 20) {
        suggestions.push('Commit message is too short. Add more context about what changed.');
      }
      
      if (message.length > 200 && !message.includes('\n')) {
        suggestions.push('Consider using a multi-line commit message with a body for complex changes');
      }
    }
    
    return suggestions;
  }

  async suggestBranchStrategy(): Promise<BranchStrategy> {
    try {
      const branches = await this.git.branchLocal();
      const currentBranch = branches.current;
      const allBranches = branches.all;

      const issues: string[] = [];
      const suggestions: string[] = [];

      // Check for common branch naming patterns
      const hasMain = allBranches.includes('main') || allBranches.includes('master');
      const hasDevelop = allBranches.includes('develop') || allBranches.includes('dev');
      
      // Check for feature branches
      const featureBranches = allBranches.filter(b => 
        b.startsWith('feature/') || b.startsWith('feat/') || b.startsWith('feature-')
      );
      
      // Check for hotfix branches
      const hotfixBranches = allBranches.filter(b => 
        b.startsWith('hotfix/') || b.startsWith('fix/')
      );

      if (!hasMain && !hasDevelop) {
        issues.push('No main/master or develop branch found');
        suggestions.push('Consider using Git Flow or GitHub Flow branching strategy');
      }

      if (currentBranch === 'main' || currentBranch === 'master') {
        issues.push('Currently on main/master branch');
        suggestions.push('Create a feature branch for new work');
      }

      if (featureBranches.length === 0 && allBranches.length > 2) {
        issues.push('No feature branches found');
        suggestions.push('Use feature branches (feature/name) for new features');
      }

      let recommended = 'GitHub Flow';
      if (hasMain && hasDevelop && (featureBranches.length > 0 || hotfixBranches.length > 0)) {
        recommended = 'Git Flow';
      } else if (hasMain && !hasDevelop) {
        recommended = 'GitHub Flow';
      }

      return {
        current: allBranches,
        recommended,
        issues,
        suggestions,
      };
    } catch (error: any) {
      throw new Error(`Failed to analyze branch strategy: ${error.message}`);
    }
  }

  async analyzeDiff(commit?: string): Promise<DiffAnalysis> {
    try {
      let diffOutput: string;
      
      if (commit) {
        diffOutput = await this.git.show([commit, '--stat']);
      } else {
        diffOutput = await this.git.diff(['--stat']);
      }

      const lines = diffOutput.split('\n');
      let filesChanged = 0;
      let linesAdded = 0;
      let linesDeleted = 0;

      const risks: string[] = [];
      const suggestions: string[] = [];

      for (const line of lines) {
        // Parse git diff --stat output
        const statMatch = line.match(/(\d+)\s+files? changed/);
        if (statMatch) {
          filesChanged = parseInt(statMatch[1]);
        }

        const addMatch = line.match(/(\d+)\s+insertions?/);
        if (addMatch) {
          linesAdded = parseInt(addMatch[1]);
        }

        const delMatch = line.match(/(\d+)\s+deletions?/);
        if (delMatch) {
          linesDeleted = parseInt(delMatch[1]);
        }
      }

      // Analyze risks
      if (filesChanged > 20) {
        risks.push('Large number of files changed - consider splitting into smaller commits');
      }

      if (linesAdded > 1000) {
        risks.push('Large addition of code - ensure proper testing');
      }

      if (linesDeleted > linesAdded * 2) {
        risks.push('Significant code removal - ensure no functionality is lost');
      }

      // Get actual diff for more detailed analysis
      let fullDiff: string;
      if (commit) {
        fullDiff = await this.git.show([commit]);
      } else {
        fullDiff = await this.git.diff();
      }

      // Check for potential issues in diff
      if (fullDiff.includes('TODO') || fullDiff.includes('FIXME')) {
        risks.push('Contains TODO/FIXME comments');
      }

      if (fullDiff.includes('console.log') || fullDiff.includes('print(')) {
        risks.push('Contains debug statements');
        suggestions.push('Remove debug statements before committing');
      }

      if (fullDiff.includes('password') || fullDiff.includes('secret') || fullDiff.includes('api_key')) {
        risks.push('Potential sensitive data in diff');
        suggestions.push('Review for hardcoded secrets or credentials');
      }

      const summary = `${filesChanged} files changed, ${linesAdded} insertions(+), ${linesDeleted} deletions(-)`;

      return {
        filesChanged,
        linesAdded,
        linesDeleted,
        risks,
        suggestions,
        summary,
      };
    } catch (error: any) {
      throw new Error(`Failed to analyze diff: ${error.message}`);
    }
  }
}

