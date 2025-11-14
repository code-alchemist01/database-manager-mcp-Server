import { CodeAnalyzer } from '../analyzers/code-analyzer.js';
import * as path from 'path';
import * as fs from 'fs-extra';
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

describe('CodeAnalyzer', () => {
  let testDir: string;
  let testFile: string;
  let analyzer: CodeAnalyzer;

  beforeAll(async () => {
    testDir = path.join(process.cwd(), 'test-project');
    testFile = path.join(testDir, 'test.js');
    analyzer = new CodeAnalyzer();
    
    // Create a test file
    await fs.ensureDir(testDir);
    await fs.writeFile(testFile, `
function testFunction() {
  if (true) {
    console.log("test");
  }
  return "done";
}
    `);
  });

  afterAll(async () => {
    // Cleanup handled by file-analyzer test
  });

  test('should calculate complexity', async () => {
    const complexity = await analyzer.calculateComplexity(testFile);
    
    expect(complexity).toBeDefined();
    expect(complexity.file).toBe(testFile);
    expect(complexity.complexity).toBeGreaterThan(0);
    expect(['low', 'medium', 'high', 'very-high']).toContain(complexity.level);
  });

  test('should detect code smells', async () => {
    const smells = await analyzer.detectCodeSmells(testDir);
    
    expect(Array.isArray(smells)).toBe(true);
  });

  test('should analyze test coverage', async () => {
    const coverage = await analyzer.analyzeTestCoverage(testDir);
    
    expect(coverage).toBeDefined();
    expect(coverage.total).toBeGreaterThanOrEqual(0);
    expect(coverage.covered).toBeGreaterThanOrEqual(0);
    expect(coverage.percentage).toBeGreaterThanOrEqual(0);
    expect(coverage.percentage).toBeLessThanOrEqual(100);
  });
});

