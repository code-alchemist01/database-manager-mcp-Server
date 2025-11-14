import { ProjectManagerServer } from '../server.js';
import * as path from 'path';
import fs from 'fs-extra';
import { FileAnalyzer } from '../analyzers/file-analyzer.js';
import { DependencyAnalyzer } from '../analyzers/dependency-analyzer.js';
import { findFiles, readFileContent } from '../utils/file-utils.js';
import type { FileStructureSuggestion, DependencyUpdate } from '../types/index.js';

export function registerProjectOrgTools(server: ProjectManagerServer) {
  const fileAnalyzer = new FileAnalyzer();
  const dependencyAnalyzer = new DependencyAnalyzer();

  // suggest_file_structure
  server.registerTool(
    'suggest_file_structure',
    'Analyzes current file structure and suggests improvements for better organization',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the project directory',
        },
      },
      required: ['path'],
    },
    async (args: { path: string }) => {
      try {
        const projectPath = path.resolve(args.path);
        const structure = await fileAnalyzer.analyzeProjectStructure(projectPath);
        const techStack = await dependencyAnalyzer.detectTechStack(projectPath);
        
        const suggestions: FileStructureSuggestion[] = [];
        
        // Check for common structure issues
        const rootFiles = structure.files.filter(f => f.type === 'file');
        
        // Suggest organizing root-level files
        const configFiles = rootFiles.filter(f => 
          f.name.startsWith('.') || 
          f.name === 'package.json' || 
          f.name === 'tsconfig.json' ||
          f.name === 'README.md'
        );
        
        const sourceFiles = rootFiles.filter(f => 
          !f.name.startsWith('.') && 
          f.name !== 'package.json' && 
          f.name !== 'README.md' &&
          (f.extension === 'js' || f.extension === 'ts' || f.extension === 'py')
        );
        
        if (sourceFiles.length > 0) {
          if (techStack.languages.includes('JavaScript') || techStack.languages.includes('TypeScript')) {
            suggestions.push({
              current: 'Root directory',
              suggested: 'src/ directory',
              reason: `${sourceFiles.length} source files found in root. Consider organizing them in a src/ directory.`,
              priority: 'medium',
            });
          } else if (techStack.languages.includes('Python')) {
            suggestions.push({
              current: 'Root directory',
              suggested: 'Package structure',
              reason: `${sourceFiles.length} Python files found in root. Consider organizing them in a package structure.`,
              priority: 'medium',
            });
          }
        }
        
        // Check for test files organization
        const testFiles = await findFiles(projectPath, ['*.test.js', '*.test.ts', '*.spec.js', '*.spec.ts', '*_test.py']);
        const testFilesInRoot = testFiles.filter(f => {
          const relative = path.relative(projectPath, f);
          return !relative.includes(path.sep) || relative.split(path.sep).length === 1;
        });
        
        if (testFilesInRoot.length > 0) {
          suggestions.push({
            current: 'Root directory',
            suggested: '__tests__/ or tests/ directory',
            reason: `${testFilesInRoot.length} test files found in root. Consider organizing them in a dedicated tests directory.`,
            priority: 'low',
          });
        }
        
        // Check for config files organization
        if (configFiles.length > 5) {
          suggestions.push({
            current: 'Root directory',
            suggested: '.config/ or config/ directory',
            reason: `Many configuration files in root (${configFiles.length}). Consider organizing them.`,
            priority: 'low',
          });
        }
        
        let output = `File Structure Suggestions:\n\n`;
        
        if (suggestions.length === 0) {
          output += `✓ File structure looks well organized!\n`;
        } else {
          const byPriority = {
            high: suggestions.filter(s => s.priority === 'high'),
            medium: suggestions.filter(s => s.priority === 'medium'),
            low: suggestions.filter(s => s.priority === 'low'),
          };
          
          if (byPriority.high.length > 0) {
            output += `🔴 High Priority:\n`;
            byPriority.high.forEach(s => {
              output += `  ${s.current} → ${s.suggested}\n`;
              output += `    Reason: ${s.reason}\n\n`;
            });
          }
          
          if (byPriority.medium.length > 0) {
            output += `🟡 Medium Priority:\n`;
            byPriority.medium.forEach(s => {
              output += `  ${s.current} → ${s.suggested}\n`;
              output += `    Reason: ${s.reason}\n\n`;
            });
          }
          
          if (byPriority.low.length > 0) {
            output += `🟢 Low Priority:\n`;
            byPriority.low.forEach(s => {
              output += `  ${s.current} → ${s.suggested}\n`;
              output += `    Reason: ${s.reason}\n\n`;
            });
          }
        }
        
        return output;
      } catch (error: any) {
        throw new Error(`Failed to suggest file structure: ${error.message}`);
      }
    }
  );

  // check_dependencies
  server.registerTool(
    'check_dependencies',
    'Checks for dependency updates and security vulnerabilities',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the project directory',
        },
      },
      required: ['path'],
    },
    async (args: { path: string }) => {
      try {
        const projectPath = path.resolve(args.path);
        const techStack = await dependencyAnalyzer.detectTechStack(projectPath);
        const updates: DependencyUpdate[] = [];
        let output = `Dependency Check:\n\n`;
        
        // Check npm dependencies
        if (techStack.packageManagers.includes('npm')) {
          const packageJsonPath = path.join(projectPath, 'package.json');
          if (await fs.pathExists(packageJsonPath)) {
            try {
              const packageJson = JSON.parse(await readFileContent(packageJsonPath));
              const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
              
              // This is a simplified check - real implementation would use npm-check-updates
              // For now, we'll just report what we found
              const depNames = Object.keys(deps);
              output += `Found ${depNames.length} npm dependencies\n`;
              output += `Note: For actual update checking, use 'npm outdated' or 'npx npm-check-updates'\n\n`;
            } catch {
              // Ignore parse errors
            }
          }
        }
        
        // Check Python dependencies
        if (techStack.packageManagers.includes('pip')) {
          const requirementsPath = path.join(projectPath, 'requirements.txt');
          if (await fs.pathExists(requirementsPath)) {
            const requirements = await readFileContent(requirementsPath);
            const lines = requirements.split('\n').filter(l => l.trim() && !l.startsWith('#'));
            output += `Found ${lines.length} Python dependencies\n`;
            output += `Note: For actual update checking, use 'pip list --outdated' or 'pip-audit'\n\n`;
          }
        }
        
        if (updates.length === 0) {
          output += `No dependency updates detected (simplified check).\n`;
          output += `For detailed analysis, use package manager specific tools:\n`;
          if (techStack.packageManagers.includes('npm')) {
            output += `  - npm outdated\n`;
            output += `  - npx npm-check-updates\n`;
            output += `  - npm audit\n`;
          }
          if (techStack.packageManagers.includes('pip')) {
            output += `  - pip list --outdated\n`;
            output += `  - pip-audit\n`;
          }
        } else {
          const securityUpdates = updates.filter(u => u.security);
          const regularUpdates = updates.filter(u => !u.security);
          
          if (securityUpdates.length > 0) {
            output += `🔴 Security Updates Required (${securityUpdates.length}):\n`;
            securityUpdates.forEach(update => {
              output += `  ${update.name}: ${update.current} → ${update.latest} (${update.type})\n`;
            });
            output += `\n`;
          }
          
          if (regularUpdates.length > 0) {
            output += `Updates Available (${regularUpdates.length}):\n`;
            regularUpdates.slice(0, 20).forEach(update => {
              output += `  ${update.name}: ${update.current} → ${update.latest} (${update.type})\n`;
            });
            if (regularUpdates.length > 20) {
              output += `  ... and ${regularUpdates.length - 20} more\n`;
            }
          }
        }
        
        return output;
      } catch (error: any) {
        throw new Error(`Failed to check dependencies: ${error.message}`);
      }
    }
  );
}

