import type { ProjectStructure, TechStack, ProjectMetrics, CodeComplexity, CodeSmell } from '../types/index.js';

export function formatProjectStructure(structure: ProjectStructure): string {
  let output = `Project Structure: ${structure.path}\n`;
  output += `Total Files: ${structure.totalFiles}\n`;
  output += `Total Size: ${formatBytes(structure.totalSize)}\n\n`;
  output += `Languages:\n`;
  structure.languages.forEach(lang => {
    output += `  ${lang.language}: ${lang.files} files (${lang.percentage.toFixed(1)}%)\n`;
  });
  return output;
}

export function formatTechStack(stack: TechStack): string {
  let output = 'Technology Stack:\n\n';
  
  if (stack.languages.length > 0) {
    output += `Languages: ${stack.languages.join(', ')}\n`;
  }
  if (stack.frameworks.length > 0) {
    output += `Frameworks: ${stack.frameworks.join(', ')}\n`;
  }
  if (stack.packageManagers.length > 0) {
    output += `Package Managers: ${stack.packageManagers.join(', ')}\n`;
  }
  if (stack.buildTools.length > 0) {
    output += `Build Tools: ${stack.buildTools.join(', ')}\n`;
  }
  if (stack.testFrameworks.length > 0) {
    output += `Test Frameworks: ${stack.testFrameworks.join(', ')}\n`;
  }
  
  return output;
}

export function formatProjectMetrics(metrics: ProjectMetrics): string {
  let output = `Project Metrics:\n\n`;
  output += `Total Lines: ${metrics.totalLines.toLocaleString()}\n`;
  output += `Total Files: ${metrics.totalFiles}\n`;
  output += `Total Size: ${formatBytes(metrics.totalSize)}\n`;
  output += `Average File Size: ${formatBytes(metrics.averageFileSize)}\n\n`;
  
  output += `Language Distribution:\n`;
  metrics.languages.forEach(lang => {
    output += `  ${lang.language}: ${lang.lines.toLocaleString()} lines (${lang.percentage.toFixed(1)}%)\n`;
  });
  
  if (metrics.largestFiles.length > 0) {
    output += `\nLargest Files:\n`;
    metrics.largestFiles.slice(0, 10).forEach(file => {
      output += `  ${file.path}: ${formatBytes(file.size)} (${file.lines} lines)\n`;
    });
  }
  
  return output;
}

export function formatComplexity(complexity: CodeComplexity): string {
  let output = `Complexity Analysis: ${complexity.file}\n`;
  if (complexity.function) {
    output += `Function: ${complexity.function}\n`;
  }
  output += `Complexity Score: ${complexity.complexity} (${complexity.level})\n\n`;
  
  if (complexity.recommendations.length > 0) {
    output += `Recommendations:\n`;
    complexity.recommendations.forEach(rec => {
      output += `  - ${rec}\n`;
    });
  }
  
  return output;
}

export function formatCodeSmells(smells: CodeSmell[]): string {
  if (smells.length === 0) {
    return 'No code smells detected.';
  }
  
  let output = `Code Smells Detected: ${smells.length}\n\n`;
  
  const byType = new Map<string, CodeSmell[]>();
  smells.forEach(smell => {
    if (!byType.has(smell.type)) {
      byType.set(smell.type, []);
    }
    byType.get(smell.type)!.push(smell);
  });
  
  byType.forEach((smellsOfType, type) => {
    output += `${type} (${smellsOfType.length}):\n`;
    smellsOfType.forEach(smell => {
      output += `  ${smell.file}${smell.line ? `:${smell.line}` : ''} - ${smell.message}\n`;
      output += `    Recommendation: ${smell.recommendation}\n`;
    });
    output += '\n';
  });
  
  return output;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function formatJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

