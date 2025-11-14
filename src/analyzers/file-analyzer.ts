import * as path from 'path';
import fs from 'fs-extra';
import { buildFileTree, getDirectorySize, getFileStats, detectLanguage } from '../utils/file-utils.js';
import type { ProjectStructure, LanguageStats, FileNode } from '../types/index.js';

export class FileAnalyzer {
  async analyzeProjectStructure(projectPath: string, maxDepth: number = 10): Promise<ProjectStructure> {
    const absolutePath = path.resolve(projectPath);
    
    if (!(await fs.pathExists(absolutePath))) {
      throw new Error(`Project path does not exist: ${absolutePath}`);
    }

    const files = await buildFileTree(absolutePath, maxDepth);
    const totalSize = await getDirectorySize(absolutePath);
    const totalFiles = this.countFiles(files);
    const languages = this.analyzeLanguages(files);

    return {
      path: absolutePath,
      files,
      totalFiles,
      totalSize,
      languages,
    };
  }

  private countFiles(nodes: FileNode[]): number {
    let count = 0;
    for (const node of nodes) {
      if (node.type === 'file') {
        count++;
      } else if (node.children) {
        count += this.countFiles(node.children);
      }
    }
    return count;
  }

  private analyzeLanguages(nodes: FileNode[]): LanguageStats[] {
    const languageMap = new Map<string, { files: number; lines: number }>();

    const processNode = async (node: FileNode) => {
      if (node.type === 'file' && node.language && node.language !== 'Unknown') {
        const current = languageMap.get(node.language) || { files: 0, lines: 0 };
        
        try {
          const stats = await getFileStats(node.path);
          languageMap.set(node.language, {
            files: current.files + 1,
            lines: current.lines + stats.lines,
          });
        } catch {
          languageMap.set(node.language, {
            files: current.files + 1,
            lines: current.lines,
          });
        }
      }

      if (node.children) {
        for (const child of node.children) {
          await processNode(child);
        }
      }
    };

    // Process all nodes (async operations will be handled by callers)
    // For now, we'll do a synchronous approximation
    // In a real implementation, this would be async
    const languageCounts = new Map<string, { files: number; lines: number }>();
    
    const processNodeSync = (node: FileNode) => {
      if (node.type === 'file' && node.language && node.language !== 'Unknown') {
        const current = languageCounts.get(node.language) || { files: 0, lines: 0 };
        languageCounts.set(node.language, {
          files: current.files + 1,
          lines: current.lines, // Lines will be calculated separately if needed
        });
      }
      if (node.children) {
        for (const child of node.children) {
          processNodeSync(child);
        }
      }
    };

    for (const node of nodes) {
      processNodeSync(node);
    }

    const totalFiles = Array.from(languageCounts.values()).reduce((sum, stat) => sum + stat.files, 0);
    
    return Array.from(languageCounts.entries()).map(([language, stats]) => ({
      language,
      files: stats.files,
      lines: stats.lines,
      percentage: totalFiles > 0 ? (stats.files / totalFiles) * 100 : 0,
    }));
  }

  async getProjectMetrics(projectPath: string): Promise<{
    totalLines: number;
    totalFiles: number;
    totalSize: number;
    languages: LanguageStats[];
    averageFileSize: number;
    largestFiles: Array<{ path: string; size: number; lines: number }>;
  }> {
    const structure = await this.analyzeProjectStructure(projectPath);
    
    // Get detailed file stats
    const fileStats: Array<{ path: string; size: number; lines: number }> = [];
    
    const collectFileStats = async (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file') {
          try {
            const stats = await getFileStats(node.path);
            fileStats.push({
              path: node.path,
              size: stats.size,
              lines: stats.lines,
            });
          } catch {
            // Skip files that can't be read
          }
        } else if (node.children) {
          await collectFileStats(node.children);
        }
      }
    };

    await collectFileStats(structure.files);

    const totalLines = fileStats.reduce((sum, file) => sum + file.lines, 0);
    const totalFiles = fileStats.length;
    const totalSize = structure.totalSize;
    const averageFileSize = totalFiles > 0 ? totalSize / totalFiles : 0;

    // Update language stats with actual line counts
    const languageLines = new Map<string, number>();
    fileStats.forEach(file => {
      const language = detectLanguage(file.path);
      if (language !== 'Unknown') {
        languageLines.set(language, (languageLines.get(language) || 0) + file.lines);
      }
    });

    const languages: LanguageStats[] = structure.languages.map(lang => {
      const lines = languageLines.get(lang.language) || 0;
      return {
        ...lang,
        lines,
        percentage: totalLines > 0 ? (lines / totalLines) * 100 : 0,
      };
    });

    const largestFiles = fileStats
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    return {
      totalLines,
      totalFiles,
      totalSize,
      languages,
      averageFileSize,
      largestFiles,
    };
  }
}

