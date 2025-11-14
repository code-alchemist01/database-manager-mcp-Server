import { ProjectManagerServer } from '../server.js';
import { CodeAnalyzer } from '../analyzers/code-analyzer.js';
import { formatComplexity, formatCodeSmells } from '../utils/formatters.js';

export function registerCodeMetricsTools(server: ProjectManagerServer) {
  const codeAnalyzer = new CodeAnalyzer();

  // calculate_complexity
  server.registerTool(
    'calculate_complexity',
    'Calculates cyclomatic complexity for a file or specific function',
    {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          description: 'Path to the file to analyze',
        },
        function: {
          type: 'string',
          description: 'Optional: specific function name to analyze',
        },
      },
      required: ['file'],
    },
    async (args: { file: string; function?: string }) => {
      try {
        const complexity = await codeAnalyzer.calculateComplexity(args.file, args.function);
        return formatComplexity(complexity);
      } catch (error: any) {
        throw new Error(`Failed to calculate complexity: ${error.message}`);
      }
    }
  );

  // detect_code_smells
  server.registerTool(
    'detect_code_smells',
    'Detects code smells in the project such as long methods, duplicate code, magic numbers, and large files',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the project directory',
        },
        types: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['long-method', 'magic-number', 'duplicate-code', 'large-file'],
          },
          description: 'Optional: specific types of code smells to detect (if not provided, detects all)',
        },
      },
      required: ['path'],
    },
    async (args: { path: string; types?: string[] }) => {
      try {
        const smells = await codeAnalyzer.detectCodeSmells(args.path, args.types);
        return formatCodeSmells(smells);
      } catch (error: any) {
        throw new Error(`Failed to detect code smells: ${error.message}`);
      }
    }
  );

  // analyze_test_coverage
  server.registerTool(
    'analyze_test_coverage',
    'Analyzes test coverage by identifying which source files have corresponding test files',
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
        const coverage = await codeAnalyzer.analyzeTestCoverage(args.path);
        
        let output = `Test Coverage Analysis:\n\n`;
        output += `Total Files: ${coverage.total}\n`;
        output += `Files with Tests: ${coverage.covered}\n`;
        output += `Coverage: ${coverage.percentage.toFixed(1)}%\n\n`;
        
        if (coverage.missing.length > 0) {
          output += `Files Missing Tests (${coverage.missing.length}):\n`;
          coverage.missing.slice(0, 20).forEach(file => {
            output += `  - ${file}\n`;
          });
          if (coverage.missing.length > 20) {
            output += `  ... and ${coverage.missing.length - 20} more\n`;
          }
        } else {
          output += `✓ All files have corresponding tests\n`;
        }
        
        return output;
      } catch (error: any) {
        throw new Error(`Failed to analyze test coverage: ${error.message}`);
      }
    }
  );
}

