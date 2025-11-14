import { parseFile, extractFunctions } from '../utils/parser-utils.js';
import { readFileContent, findFiles, detectLanguage } from '../utils/file-utils.js';
import type { CodeComplexity, CodeSmell } from '../types/index.js';

export class CodeAnalyzer {
  async calculateComplexity(filePath: string, functionName?: string): Promise<CodeComplexity> {
    const tree = await parseFile(filePath);
    
    // If tree-sitter is not available, use regex-based fallback
    if (!tree) {
      return this.calculateComplexityFallback(filePath, functionName);
    }

    const language = detectLanguage(filePath);
    const functions = extractFunctions(tree, language);

    let complexity = 1; // Base complexity
    let targetFunction = null;

    if (functionName) {
      targetFunction = functions.find(f => f.name === functionName);
      if (!targetFunction) {
        throw new Error(`Function ${functionName} not found in ${filePath}`);
      }
    }

    // Simple cyclomatic complexity calculation
    // Count decision points (if, while, for, switch, catch, etc.)
    const content = await readFileContent(filePath);
    const lines = content.split('\n');

    const decisionKeywords = [
      'if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||', '?', '??'
    ];

    let startLine = 0;
    let endLine = lines.length;

    if (targetFunction) {
      startLine = targetFunction.line - 1;
      // Find end of function (simplified - would need proper AST analysis)
      for (let i = startLine + 1; i < lines.length; i++) {
        if (lines[i].trim().startsWith('function') || lines[i].trim().startsWith('const') || lines[i].trim().startsWith('class')) {
          endLine = i;
          break;
        }
      }
    }

    for (let i = startLine; i < endLine; i++) {
      const line = lines[i];
      for (const keyword of decisionKeywords) {
        if (line.includes(keyword)) {
          complexity++;
        }
      }
    }

    let level: 'low' | 'medium' | 'high' | 'very-high';
    if (complexity <= 5) level = 'low';
    else if (complexity <= 10) level = 'medium';
    else if (complexity <= 20) level = 'high';
    else level = 'very-high';

    const recommendations: string[] = [];
    if (complexity > 10) {
      recommendations.push('Consider breaking this function into smaller functions');
      recommendations.push('Extract complex conditions into named functions');
    }
    if (complexity > 20) {
      recommendations.push('This function is too complex and should be refactored');
    }

    return {
      file: filePath,
      function: functionName,
      complexity,
      level,
      recommendations,
    };
  }

  async detectCodeSmells(
    projectPath: string,
    types?: string[]
  ): Promise<CodeSmell[]> {
    const smells: CodeSmell[] = [];
    const codeExtensions = ['*.js', '*.jsx', '*.ts', '*.tsx', '*.py', '*.java', '*.go', '*.rs'];
    const files = await findFiles(projectPath, codeExtensions);

    for (const file of files) {
      try {
        const content = await readFileContent(file);
        const lines = content.split('\n');
        const language = detectLanguage(file);

        // Long method detection
        if (!types || types.includes('long-method')) {
          const longMethodThreshold = 50;
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (this.isFunctionStart(line, language)) {
              let functionLength = 0;
              let braceCount = 0;
              let inFunction = false;

              for (let j = i; j < lines.length; j++) {
                const currentLine = lines[j];
                if (!inFunction && this.isFunctionStart(currentLine, language)) {
                  inFunction = true;
                }
                if (inFunction) {
                  functionLength++;
                  braceCount += (currentLine.match(/{/g) || []).length;
                  braceCount -= (currentLine.match(/}/g) || []).length;
                  
                  if (braceCount === 0 && functionLength > 1) {
                    if (functionLength > longMethodThreshold) {
                      smells.push({
                        type: 'Long Method',
                        severity: functionLength > 100 ? 'high' : 'medium',
                        file,
                        line: i + 1,
                        message: `Function is ${functionLength} lines long (threshold: ${longMethodThreshold})`,
                        recommendation: 'Break this function into smaller, more focused functions',
                      });
                    }
                    break;
                  }
                }
              }
            }
          }
        }

        // Magic numbers
        if (!types || types.includes('magic-number')) {
          const magicNumberRegex = /\b\d{3,}\b/g;
          lines.forEach((line, index) => {
            const matches = line.match(magicNumberRegex);
            if (matches && !line.includes('//') && !line.includes('const') && !line.includes('let')) {
              matches.forEach(match => {
                if (parseInt(match) > 10) {
                  smells.push({
                    type: 'Magic Number',
                    severity: 'low',
                    file,
                    line: index + 1,
                    message: `Magic number detected: ${match}`,
                    recommendation: 'Replace with a named constant',
                  });
                }
              });
            }
          });
        }

        // Duplicate code detection (simplified)
        if (!types || types.includes('duplicate-code')) {
          const functionBodies = new Map<string, { line: number; body: string }>();
          
          // This is a simplified version - real duplicate detection would use AST comparison
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (this.isFunctionStart(line, language)) {
              // Extract function body (simplified)
              const body = lines.slice(i, Math.min(i + 20, lines.length)).join('\n');
              const normalizedBody = body.replace(/\s+/g, ' ').trim();
              
              if (functionBodies.has(normalizedBody)) {
                const existing = functionBodies.get(normalizedBody)!;
                smells.push({
                  type: 'Duplicate Code',
                  severity: 'medium',
                  file,
                  line: i + 1,
                  message: `Similar code found at line ${existing.line}`,
                  recommendation: 'Extract common code into a shared function',
                });
              } else {
                functionBodies.set(normalizedBody, { line: i + 1, body });
              }
            }
          }
        }

        // Large file detection
        if (!types || types.includes('large-file')) {
          const largeFileThreshold = 500;
          if (lines.length > largeFileThreshold) {
            smells.push({
              type: 'Large File',
              severity: lines.length > 1000 ? 'high' : 'medium',
              file,
              message: `File has ${lines.length} lines (threshold: ${largeFileThreshold})`,
              recommendation: 'Consider splitting this file into smaller modules',
            });
          }
        }

      } catch (error) {
        // Skip files that can't be analyzed
        console.error(`Failed to analyze ${file}:`, error);
      }
    }

    return smells;
  }

  private isFunctionStart(line: string, language: string): boolean {
    const trimmed = line.trim();
    
    if (language === 'JavaScript' || language === 'TypeScript') {
      return /^(function|const|let|export\s+(function|const|let)|async\s+function)\s+\w+/.test(trimmed) ||
             /^export\s+default\s+function/.test(trimmed);
    }
    
    if (language === 'Python') {
      return /^def\s+\w+/.test(trimmed) || /^async\s+def\s+\w+/.test(trimmed);
    }
    
    if (language === 'Java') {
      return /^\s*(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\(/.test(trimmed);
    }
    
    if (language === 'Go') {
      return /^func\s+/.test(trimmed);
    }
    
    if (language === 'Rust') {
      return /^fn\s+\w+/.test(trimmed) || /^pub\s+fn\s+\w+/.test(trimmed);
    }
    
    return false;
  }

  private async calculateComplexityFallback(filePath: string, functionName?: string): Promise<CodeComplexity> {
    const content = await readFileContent(filePath);
    const lines = content.split('\n');
    
    let complexity = 1; // Base complexity
    let startLine = 0;
    let endLine = lines.length;
    
    // Find function if specified
    if (functionName) {
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes(`function ${functionName}`) || 
            lines[i].includes(`${functionName}(`) ||
            lines[i].includes(`const ${functionName} =`)) {
          startLine = i;
          // Find end of function (simplified)
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].trim() === '}' && j > i + 3) {
              endLine = j;
              break;
            }
          }
          break;
        }
      }
    }
    
    // Count decision points
    const decisionKeywords = ['if', 'else', 'while', 'for', 'switch', 'case', 'catch', '&&', '||', '?', '??'];
    for (let i = startLine; i < endLine; i++) {
      const line = lines[i];
      for (const keyword of decisionKeywords) {
        if (line.includes(keyword)) {
          complexity++;
        }
      }
    }
    
    let level: 'low' | 'medium' | 'high' | 'very-high';
    if (complexity <= 5) level = 'low';
    else if (complexity <= 10) level = 'medium';
    else if (complexity <= 20) level = 'high';
    else level = 'very-high';
    
    const recommendations: string[] = [];
    if (complexity > 10) {
      recommendations.push('Consider breaking this function into smaller functions');
      recommendations.push('Extract complex conditions into named functions');
    }
    if (complexity > 20) {
      recommendations.push('This function is too complex and should be refactored');
    }
    
    return {
      file: filePath,
      function: functionName,
      complexity,
      level,
      recommendations,
    };
  }

  async analyzeTestCoverage(projectPath: string): Promise<{
    total: number;
    covered: number;
    percentage: number;
    files: Array<{ file: string; coverage: number }>;
    missing: string[];
  }> {
    // This is a simplified implementation
    // Real test coverage would require running test tools
    
    const codeFiles = await findFiles(projectPath, ['*.js', '*.jsx', '*.ts', '*.tsx', '*.py', '*.java', '*.go', '*.rs']);
    const testFiles = await findFiles(projectPath, ['*.test.js', '*.test.ts', '*.spec.js', '*.spec.ts', '*_test.py', '*Test.java', '*_test.go', '*_test.rs']);

    const testFileMap = new Set(testFiles.map(f => {
      // Extract base name to match with source files
      const base = f.replace(/\.(test|spec)\.(js|ts)$/, '').replace(/_test\.(py|go|rs)$/, '').replace(/Test\.java$/, '');
      return base;
    }));

    const coveredFiles: string[] = [];
    const missingFiles: string[] = [];

    for (const file of codeFiles) {
      const base = file.replace(/\.(js|ts|jsx|tsx|py|java|go|rs)$/, '');
      if (testFileMap.has(base)) {
        coveredFiles.push(file);
      } else {
        // Check if it's not a test file itself
        if (!file.includes('.test.') && !file.includes('.spec.') && !file.includes('_test') && !file.includes('Test.java')) {
          missingFiles.push(file);
        }
      }
    }

    const total = codeFiles.length;
    const covered = coveredFiles.length;
    const percentage = total > 0 ? (covered / total) * 100 : 0;

    const fileCoverage = codeFiles.map(file => {
      const base = file.replace(/\.(js|ts|jsx|tsx|py|java|go|rs)$/, '');
      const isCovered = testFileMap.has(base);
      return {
        file,
        coverage: isCovered ? 100 : 0,
      };
    });

    return {
      total,
      covered,
      percentage,
      files: fileCoverage,
      missing: missingFiles,
    };
  }
}

