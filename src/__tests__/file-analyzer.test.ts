import { FileAnalyzer } from '../analyzers/file-analyzer.js';
import * as path from 'path';
import * as fs from 'fs-extra';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('FileAnalyzer', () => {
  let testDir: string;
  let analyzer: FileAnalyzer;

  beforeAll(async () => {
    testDir = path.join(process.cwd(), 'test-project');
    analyzer = new FileAnalyzer();
    
    // Create test project structure
    await fs.ensureDir(testDir);
    await fs.writeFile(path.join(testDir, 'package.json'), JSON.stringify({ name: 'test-project' }));
    await fs.writeFile(path.join(testDir, 'index.js'), 'console.log("Hello");');
    await fs.writeFile(path.join(testDir, 'README.md'), '# Test Project');
  });

  afterAll(async () => {
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  test('should analyze project structure', async () => {
    const structure = await analyzer.analyzeProjectStructure(testDir);
    
    expect(structure).toBeDefined();
    expect(structure.path).toBe(testDir);
    expect(structure.totalFiles).toBeGreaterThan(0);
    expect(structure.files.length).toBeGreaterThan(0);
  });

  test('should get project metrics', async () => {
    const metrics = await analyzer.getProjectMetrics(testDir);
    
    expect(metrics).toBeDefined();
    expect(metrics.totalFiles).toBeGreaterThan(0);
    expect(metrics.totalLines).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(metrics.languages)).toBe(true);
  });
});

