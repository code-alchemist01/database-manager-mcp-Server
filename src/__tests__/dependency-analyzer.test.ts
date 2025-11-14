import { DependencyAnalyzer } from '../analyzers/dependency-analyzer.js';
import * as path from 'path';
import * as fs from 'fs-extra';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('DependencyAnalyzer', () => {
  let testDir: string;
  let analyzer: DependencyAnalyzer;

  beforeAll(async () => {
    testDir = path.join(process.cwd(), 'test-project');
    analyzer = new DependencyAnalyzer();
    
    // Ensure test directory exists
    await fs.ensureDir(testDir);
  });

  afterAll(async () => {
    // Cleanup handled by file-analyzer test
  });

  test('should detect tech stack', async () => {
    const techStack = await analyzer.detectTechStack(testDir);
    
    expect(techStack).toBeDefined();
    expect(Array.isArray(techStack.languages)).toBe(true);
    expect(Array.isArray(techStack.frameworks)).toBe(true);
    expect(Array.isArray(techStack.packageManagers)).toBe(true);
  });

  test('should analyze dependencies', async () => {
    const graph = await analyzer.analyzeDependencies(testDir);
    
    expect(graph).toBeDefined();
    expect(Array.isArray(graph.nodes)).toBe(true);
    expect(Array.isArray(graph.edges)).toBe(true);
    expect(Array.isArray(graph.circular)).toBe(true);
  });
});

