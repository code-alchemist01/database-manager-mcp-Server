import { ProjectManagerServer } from '../server.js';
import * as path from 'path';
import fs from 'fs-extra';
import { FileAnalyzer } from '../analyzers/file-analyzer.js';
import { DependencyAnalyzer } from '../analyzers/dependency-analyzer.js';
import { readFileContent } from '../utils/file-utils.js';

export function registerDocumentationTools(server: ProjectManagerServer) {
  const fileAnalyzer = new FileAnalyzer();
  const dependencyAnalyzer = new DependencyAnalyzer();

  // generate_readme
  server.registerTool(
    'generate_readme',
    'Generates or updates a README.md file with project information, structure, and usage instructions',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the project directory',
        },
        template: {
          type: 'string',
          description: 'Optional: template type (basic, detailed, minimal)',
          enum: ['basic', 'detailed', 'minimal'],
          default: 'detailed',
        },
      },
      required: ['path'],
    },
    async (args: { path: string; template?: string }) => {
      try {
        const projectPath = path.resolve(args.path);
        const readmePath = path.join(projectPath, 'README.md');
        
        // Get project information
        const structure = await fileAnalyzer.analyzeProjectStructure(projectPath);
        const techStack = await dependencyAnalyzer.detectTechStack(projectPath);
        const metrics = await fileAnalyzer.getProjectMetrics(projectPath);
        
        // Check if package.json exists for project name
        let projectName = path.basename(projectPath);
        try {
          const packageJsonPath = path.join(projectPath, 'package.json');
          if (await fs.pathExists(packageJsonPath)) {
            const packageJson = JSON.parse(await readFileContent(packageJsonPath));
            projectName = packageJson.name || projectName;
          }
        } catch {
          // Ignore
        }

        const template = args.template || 'detailed';
        let readme = '';

        if (template === 'minimal') {
          readme = `# ${projectName}\n\n`;
          readme += `## Description\n\n`;
          readme += `Add your project description here.\n\n`;
        } else if (template === 'basic') {
          readme = `# ${projectName}\n\n`;
          readme += `## Description\n\n`;
          readme += `Add your project description here.\n\n`;
          readme += `## Installation\n\n`;
          readme += `\`\`\`bash\nnpm install\n\`\`\`\n\n`;
          readme += `## Usage\n\n`;
          readme += `\`\`\`bash\nnpm start\n\`\`\`\n\n`;
        } else {
          // Detailed template
          readme = `# ${projectName}\n\n`;
          readme += `## Description\n\n`;
          readme += `Add your project description here.\n\n`;
          
          if (techStack.languages.length > 0) {
            readme += `## Technology Stack\n\n`;
            readme += `- **Languages**: ${techStack.languages.join(', ')}\n`;
            if (techStack.frameworks.length > 0) {
              readme += `- **Frameworks**: ${techStack.frameworks.join(', ')}\n`;
            }
            if (techStack.packageManagers.length > 0) {
              readme += `- **Package Managers**: ${techStack.packageManagers.join(', ')}\n`;
            }
            readme += `\n`;
          }
          
          readme += `## Project Statistics\n\n`;
          readme += `- Total Files: ${metrics.totalFiles}\n`;
          readme += `- Total Lines of Code: ${metrics.totalLines.toLocaleString()}\n`;
          readme += `- Languages: ${metrics.languages.map(l => `${l.language} (${l.percentage.toFixed(1)}%)`).join(', ')}\n\n`;
          
          readme += `## Installation\n\n`;
          if (techStack.packageManagers.includes('npm')) {
            readme += `\`\`\`bash\nnpm install\n\`\`\`\n\n`;
          } else if (techStack.packageManagers.includes('pip')) {
            readme += `\`\`\`bash\npip install -r requirements.txt\n\`\`\`\n\n`;
          }
          
          readme += `## Usage\n\n`;
          readme += `Add usage instructions here.\n\n`;
          
          readme += `## Project Structure\n\n`;
          readme += `\`\`\`\n`;
          readme += generateTreeStructure(structure.files, 0, 2);
          readme += `\`\`\`\n\n`;
          
          readme += `## Contributing\n\n`;
          readme += `Contributions are welcome! Please feel free to submit a Pull Request.\n\n`;
          
          readme += `## License\n\n`;
          readme += `Add license information here.\n`;
        }

        await fs.writeFile(readmePath, readme, 'utf-8');
        return `README.md generated successfully at ${readmePath}\n\n${readme}`;
      } catch (error: any) {
        throw new Error(`Failed to generate README: ${error.message}`);
      }
    }
  );

  // generate_api_docs
  server.registerTool(
    'generate_api_docs',
    'Generates API documentation from code files (JSDoc, Python docstrings, etc.)',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the project directory',
        },
        format: {
          type: 'string',
          description: 'Output format',
          enum: ['markdown', 'html'],
          default: 'markdown',
        },
      },
      required: ['path'],
    },
    async (args: { path: string; format?: string }) => {
      try {
        const projectPath = path.resolve(args.path);
        const format = args.format || 'markdown';
        
        // This is a simplified implementation
        // Real API docs generation would parse JSDoc, docstrings, etc.
        
        let output = `# API Documentation\n\n`;
        output += `Generated for: ${projectPath}\n\n`;
        output += `## Overview\n\n`;
        output += `This API documentation is automatically generated. `;
        output += `For detailed documentation, please refer to inline comments in the source code.\n\n`;
        output += `## Modules\n\n`;
        output += `*API documentation generation is a simplified version. `;
        output += `For full documentation, use tools like JSDoc, Sphinx, or godoc.*\n`;
        
        if (format === 'html') {
          output = convertMarkdownToHTML(output);
        }
        
        const outputPath = path.join(projectPath, format === 'html' ? 'api-docs.html' : 'API.md');
        await fs.writeFile(outputPath, output, 'utf-8');
        
        return `API documentation generated successfully at ${outputPath}\n\n${output}`;
      } catch (error: any) {
        throw new Error(`Failed to generate API docs: ${error.message}`);
      }
    }
  );

  // update_changelog
  server.registerTool(
    'update_changelog',
    'Updates or creates a CHANGELOG.md file with version information and changes',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the project directory',
        },
        version: {
          type: 'string',
          description: 'Version number (e.g., 1.0.0)',
        },
        changes: {
          type: 'array',
          items: {
            type: 'string',
          },
          description: 'Array of change descriptions',
        },
      },
      required: ['path', 'version', 'changes'],
    },
    async (args: { path: string; version: string; changes: string[] }) => {
      try {
        const projectPath = path.resolve(args.path);
        const changelogPath = path.join(projectPath, 'CHANGELOG.md');
        
        let existingContent = '';
        if (await fs.pathExists(changelogPath)) {
          existingContent = await readFileContent(changelogPath);
        }
        
        const date = new Date().toISOString().split('T')[0];
        let changelog = '';
        
        if (!existingContent.includes('# Changelog')) {
          changelog = `# Changelog\n\n`;
          changelog += `All notable changes to this project will be documented in this file.\n\n`;
          changelog += `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\n`;
          changelog += `and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n`;
        } else {
          // Extract header
          const headerMatch = existingContent.match(/(# Changelog[\s\S]*?## \[)/);
          if (headerMatch) {
            changelog = existingContent.substring(0, headerMatch.index! + headerMatch[1].length - 3);
          } else {
            changelog = existingContent.split('## [')[0];
          }
        }
        
        changelog += `## [${args.version}] - ${date}\n\n`;
        
        // Categorize changes
        const added: string[] = [];
        const changed: string[] = [];
        const fixed: string[] = [];
        const removed: string[] = [];
        
        args.changes.forEach(change => {
          const lower = change.toLowerCase();
          if (lower.startsWith('add') || lower.startsWith('new') || lower.startsWith('feat')) {
            added.push(change);
          } else if (lower.startsWith('fix') || lower.startsWith('bug')) {
            fixed.push(change);
          } else if (lower.startsWith('remove') || lower.startsWith('delete') || lower.startsWith('deprecate')) {
            removed.push(change);
          } else {
            changed.push(change);
          }
        });
        
        if (added.length > 0) {
          changelog += `### Added\n`;
          added.forEach(change => {
            changelog += `- ${change}\n`;
          });
          changelog += `\n`;
        }
        
        if (changed.length > 0) {
          changelog += `### Changed\n`;
          changed.forEach(change => {
            changelog += `- ${change}\n`;
          });
          changelog += `\n`;
        }
        
        if (fixed.length > 0) {
          changelog += `### Fixed\n`;
          fixed.forEach(change => {
            changelog += `- ${change}\n`;
          });
          changelog += `\n`;
        }
        
        if (removed.length > 0) {
          changelog += `### Removed\n`;
          removed.forEach(change => {
            changelog += `- ${change}\n`;
          });
          changelog += `\n`;
        }
        
        // Append existing versions
        if (existingContent.includes('## [')) {
          const existingVersions = existingContent.split('## [').slice(1).join('## [');
          changelog += existingVersions;
        }
        
        await fs.writeFile(changelogPath, changelog, 'utf-8');
        return `CHANGELOG.md updated successfully at ${changelogPath}\n\n${changelog}`;
      } catch (error: any) {
        throw new Error(`Failed to update changelog: ${error.message}`);
      }
    }
  );
}

function generateTreeStructure(files: any[], depth: number, maxDepth: number): string {
  if (depth >= maxDepth) return '';
  
  let output = '';
  for (const file of files.slice(0, 10)) { // Limit to first 10 items
    const indent = '  '.repeat(depth);
    output += `${indent}${file.name}\n`;
    if (file.children && file.children.length > 0 && depth < maxDepth - 1) {
      output += generateTreeStructure(file.children, depth + 1, maxDepth);
    }
  }
  if (files.length > 10) {
    output += `${'  '.repeat(depth)}... (${files.length - 10} more items)\n`;
  }
  return output;
}

function convertMarkdownToHTML(markdown: string): string {
  let html = `<!DOCTYPE html>\n<html>\n<head>\n<title>API Documentation</title>\n</head>\n<body>\n`;
  html += markdown
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>\n');
  html += `</body>\n</html>`;
  return html;
}

