import fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import type { FileNode } from '../types/index.js';

export async function readFileContent(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error: any) {
    throw new Error(`Failed to read file ${filePath}: ${error}`);
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    return await fs.pathExists(filePath);
  } catch {
    return false;
  }
}

export async function getFileStats(filePath: string): Promise<{ size: number; lines: number }> {
  try {
    const stats = await fs.stat(filePath);
    const content = await readFileContent(filePath);
    const lines = content.split('\n').length;
    return { size: stats.size, lines };
  } catch (error) {
    throw new Error(`Failed to get file stats for ${filePath}: ${error}`);
  }
}

export function getFileExtension(filePath: string): string {
  return path.extname(filePath).slice(1).toLowerCase();
}

export function detectLanguage(filePath: string): string {
  const ext = getFileExtension(filePath);
  const languageMap: Record<string, string> = {
    'js': 'JavaScript',
    'jsx': 'JavaScript',
    'ts': 'TypeScript',
    'tsx': 'TypeScript',
    'py': 'Python',
    'java': 'Java',
    'go': 'Go',
    'rs': 'Rust',
    'json': 'JSON',
    'md': 'Markdown',
    'html': 'HTML',
    'css': 'CSS',
    'scss': 'SCSS',
    'xml': 'XML',
    'yaml': 'YAML',
    'yml': 'YAML',
  };
  return languageMap[ext] || 'Unknown';
}

export async function findFiles(
  directory: string,
  pattern: string | string[],
  options?: { ignore?: string[] }
): Promise<string[]> {
  try {
    const patterns = Array.isArray(pattern) ? pattern : [pattern];
    const allFiles: string[] = [];
    
    for (const pat of patterns) {
      const files = await glob(pat, {
        cwd: directory,
        absolute: true,
        ignore: options?.ignore || ['**/node_modules/**', '**/dist/**', '**/build/**'],
      });
      allFiles.push(...files);
    }
    
    return [...new Set(allFiles)];
  } catch (error) {
    throw new Error(`Failed to find files: ${error}`);
  }
}

export async function buildFileTree(
  directory: string,
  maxDepth: number = 10,
  currentDepth: number = 0
): Promise<FileNode[]> {
  if (currentDepth >= maxDepth) {
    return [];
  }

  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      // Skip hidden files and common ignore patterns
      if (entry.name.startsWith('.') || 
          entry.name === 'node_modules' || 
          entry.name === 'dist' || 
          entry.name === 'build') {
        continue;
      }

      if (entry.isDirectory()) {
        const children = await buildFileTree(fullPath, maxDepth, currentDepth + 1);
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          children,
        });
      } else {
        const stats = await fs.stat(fullPath);
        const extension = getFileExtension(fullPath);
        const language = detectLanguage(fullPath);
        
        nodes.push({
          name: entry.name,
          path: fullPath,
          type: 'file',
          size: stats.size,
          extension,
          language,
        });
      }
    }

    return nodes;
  } catch (error) {
    throw new Error(`Failed to build file tree: ${error}`);
  }
}

export async function getDirectorySize(directory: string): Promise<number> {
  let totalSize = 0;
  
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
          continue;
        }
        totalSize += await getDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
  } catch (error) {
    // Ignore errors for inaccessible files
  }
  
  return totalSize;
}

