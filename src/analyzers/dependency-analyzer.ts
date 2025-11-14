import * as path from 'path';
import fs from 'fs-extra';
import { findFiles, readFileContent } from '../utils/file-utils.js';
import { parseFile, extractImports } from '../utils/parser-utils.js';
import type { DependencyNode, DependencyGraph } from '../types/index.js';

export class DependencyAnalyzer {
  async analyzeDependencies(projectPath: string, filePath?: string): Promise<DependencyGraph> {
    const absolutePath = path.resolve(projectPath);
    
    if (!(await fs.pathExists(absolutePath))) {
      throw new Error(`Project path does not exist: ${absolutePath}`);
    }

    const nodes: DependencyNode[] = [];
    const edges: Array<{ from: string; to: string; type: string }> = [];

    // Determine which files to analyze
    let filesToAnalyze: string[] = [];
    
    if (filePath) {
      const absoluteFilePath = path.resolve(filePath);
      if (await fs.pathExists(absoluteFilePath)) {
        filesToAnalyze = [absoluteFilePath];
      }
    } else {
      // Analyze all code files in the project
      const codeExtensions = ['*.js', '*.jsx', '*.ts', '*.tsx', '*.py', '*.java', '*.go', '*.rs'];
      filesToAnalyze = await findFiles(absolutePath, codeExtensions);
    }

    // Analyze each file
    for (const file of filesToAnalyze) {
      try {
        const tree = await parseFile(file);
        if (!tree) continue;

        const language = this.detectLanguageFromPath(file);
        const imports = extractImports(tree, language);
        
        const relativePath = path.relative(absolutePath, file);
        const node: DependencyNode = {
          name: path.basename(file),
          path: relativePath,
          imports,
          exports: [], // Would need additional parsing for exports
          dependencies: imports,
        };

        nodes.push(node);

        // Create edges for imports
        imports.forEach(imp => {
          edges.push({
            from: relativePath,
            to: imp,
            type: 'import',
          });
        });
      } catch (error) {
        // Skip files that can't be parsed
        console.error(`Failed to analyze ${file}:`, error);
      }
    }

    // Detect circular dependencies
    const circular = this.detectCircularDependencies(nodes, edges);

    return {
      nodes,
      edges,
      circular,
    };
  }

  private detectLanguageFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
    };
    return languageMap[ext] || 'Unknown';
  }

  private detectCircularDependencies(
    nodes: DependencyNode[],
    edges: Array<{ from: string; to: string; type: string }>
  ): string[][] {
    const circular: string[][] = [];
    const graph = new Map<string, string[]>();

    // Build adjacency list
    edges.forEach(edge => {
      if (!graph.has(edge.from)) {
        graph.set(edge.from, []);
      }
      graph.get(edge.from)!.push(edge.to);
    });

    // DFS to detect cycles
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];

    const dfs = (node: string): boolean => {
      if (recStack.has(node)) {
        // Found a cycle
        const cycleStart = path.indexOf(node);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart).concat(node);
          circular.push([...cycle]);
        }
        return true;
      }

      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      recStack.add(node);
      path.push(node);

      const neighbors = graph.get(node) || [];
      for (const neighbor of neighbors) {
        dfs(neighbor);
      }

      path.pop();
      recStack.delete(node);
      return false;
    };

    nodes.forEach(node => {
      if (!visited.has(node.path)) {
        dfs(node.path);
      }
    });

    return circular;
  }

  async detectTechStack(projectPath: string): Promise<{
    languages: string[];
    frameworks: string[];
    packageManagers: string[];
    buildTools: string[];
    testFrameworks: string[];
  }> {
    const absolutePath = path.resolve(projectPath);
    
    const languages = new Set<string>();
    const frameworks = new Set<string>();
    const packageManagers = new Set<string>();
    const buildTools = new Set<string>();
    const testFrameworks = new Set<string>();

    // Check for package.json (Node.js)
    if (await fs.pathExists(path.join(absolutePath, 'package.json'))) {
      packageManagers.add('npm');
      languages.add('JavaScript');
      languages.add('TypeScript');
      
      try {
        const packageJson = JSON.parse(await readFileContent(path.join(absolutePath, 'package.json')));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        // Detect frameworks
        if (deps.react) frameworks.add('React');
        if (deps.vue) frameworks.add('Vue');
        if (deps.angular) frameworks.add('Angular');
        if (deps.express) frameworks.add('Express');
        if (deps.next) frameworks.add('Next.js');
        if (deps['@nestjs/core']) frameworks.add('NestJS');
        
        // Detect test frameworks
        if (deps.jest) testFrameworks.add('Jest');
        if (deps.mocha) testFrameworks.add('Mocha');
        if (deps.vitest) testFrameworks.add('Vitest');
      } catch {
        // Ignore parse errors
      }
    }

    // Check for requirements.txt or pyproject.toml (Python)
    if (await fs.pathExists(path.join(absolutePath, 'requirements.txt')) ||
        await fs.pathExists(path.join(absolutePath, 'pyproject.toml'))) {
      packageManagers.add('pip');
      languages.add('Python');
      
      if (await fs.pathExists(path.join(absolutePath, 'pyproject.toml'))) {
        try {
          const pyproject = await readFileContent(path.join(absolutePath, 'pyproject.toml'));
          if (pyproject.includes('django')) frameworks.add('Django');
          if (pyproject.includes('flask')) frameworks.add('Flask');
          if (pyproject.includes('fastapi')) frameworks.add('FastAPI');
        } catch {
          // Ignore
        }
      }
    }

    // Check for pom.xml (Java/Maven)
    if (await fs.pathExists(path.join(absolutePath, 'pom.xml'))) {
      packageManagers.add('Maven');
      buildTools.add('Maven');
      languages.add('Java');
    }

    // Check for build.gradle (Java/Gradle)
    if (await fs.pathExists(path.join(absolutePath, 'build.gradle'))) {
      packageManagers.add('Gradle');
      buildTools.add('Gradle');
      languages.add('Java');
    }

    // Check for go.mod (Go)
    if (await fs.pathExists(path.join(absolutePath, 'go.mod'))) {
      packageManagers.add('go mod');
      languages.add('Go');
    }

    // Check for Cargo.toml (Rust)
    if (await fs.pathExists(path.join(absolutePath, 'Cargo.toml'))) {
      packageManagers.add('Cargo');
      languages.add('Rust');
    }

    // Check for build tools
    if (await fs.pathExists(path.join(absolutePath, 'webpack.config.js'))) {
      buildTools.add('Webpack');
    }
    if (await fs.pathExists(path.join(absolutePath, 'vite.config.js')) ||
        await fs.pathExists(path.join(absolutePath, 'vite.config.ts'))) {
      buildTools.add('Vite');
    }
    if (await fs.pathExists(path.join(absolutePath, 'tsconfig.json'))) {
      buildTools.add('TypeScript Compiler');
    }

    return {
      languages: Array.from(languages),
      frameworks: Array.from(frameworks),
      packageManagers: Array.from(packageManagers),
      buildTools: Array.from(buildTools),
      testFrameworks: Array.from(testFrameworks),
    };
  }
}

