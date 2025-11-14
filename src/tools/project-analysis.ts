import { ProjectManagerServer } from '../server.js';
import { FileAnalyzer } from '../analyzers/file-analyzer.js';
import { DependencyAnalyzer } from '../analyzers/dependency-analyzer.js';
import { formatProjectStructure, formatTechStack, formatProjectMetrics } from '../utils/formatters.js';

export function registerProjectAnalysisTools(server: ProjectManagerServer) {
  const fileAnalyzer = new FileAnalyzer();
  const dependencyAnalyzer = new DependencyAnalyzer();

  // analyze_project_structure
  server.registerTool(
    'analyze_project_structure',
    'Analyzes the project directory structure and returns a hierarchical file tree',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the project directory to analyze',
        },
        depth: {
          type: 'number',
          description: 'Maximum depth to traverse (default: 10)',
          default: 10,
        },
      },
      required: ['path'],
    },
    async (args: { path: string; depth?: number }) => {
      try {
        const structure = await fileAnalyzer.analyzeProjectStructure(args.path, args.depth || 10);
        return formatProjectStructure(structure);
      } catch (error: any) {
        throw new Error(`Failed to analyze project structure: ${error.message}`);
      }
    }
  );

  // detect_tech_stack
  server.registerTool(
    'detect_tech_stack',
    'Detects the technology stack used in the project (languages, frameworks, package managers, build tools)',
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
        const techStack = await dependencyAnalyzer.detectTechStack(args.path);
        return formatTechStack(techStack);
      } catch (error: any) {
        throw new Error(`Failed to detect tech stack: ${error.message}`);
      }
    }
  );

  // analyze_dependencies
  server.registerTool(
    'analyze_dependencies',
    'Analyzes import/require relationships and creates a dependency graph, including circular dependency detection',
    {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to the project directory',
        },
        file: {
          type: 'string',
          description: 'Optional: specific file to analyze (if not provided, analyzes all code files)',
        },
      },
      required: ['path'],
    },
    async (args: { path: string; file?: string }) => {
      try {
        const graph = await dependencyAnalyzer.analyzeDependencies(args.path, args.file);
        
        let output = `Dependency Analysis:\n\n`;
        output += `Total Files Analyzed: ${graph.nodes.length}\n`;
        output += `Total Dependencies: ${graph.edges.length}\n\n`;
        
        if (graph.circular.length > 0) {
          output += `⚠️ Circular Dependencies Detected: ${graph.circular.length}\n\n`;
          graph.circular.forEach((cycle, index) => {
            output += `Cycle ${index + 1}:\n`;
            output += `  ${cycle.join(' → ')}\n\n`;
          });
        } else {
          output += `✓ No circular dependencies found\n\n`;
        }
        
        output += `Dependency Graph:\n`;
        graph.nodes.forEach(node => {
          if (node.dependencies.length > 0) {
            output += `\n${node.path}:\n`;
            node.dependencies.forEach(dep => {
              output += `  → ${dep}\n`;
            });
          }
        });
        
        return output;
      } catch (error: any) {
        throw new Error(`Failed to analyze dependencies: ${error.message}`);
      }
    }
  );

  // get_project_metrics
  server.registerTool(
    'get_project_metrics',
    'Calculates comprehensive project metrics including total lines of code, file counts, language distribution, and largest files',
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
        const metrics = await fileAnalyzer.getProjectMetrics(args.path);
        return formatProjectMetrics(metrics);
      } catch (error: any) {
        throw new Error(`Failed to get project metrics: ${error.message}`);
      }
    }
  );
}

