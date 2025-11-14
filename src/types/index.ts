export interface ProjectStructure {
  path: string;
  files: FileNode[];
  totalFiles: number;
  totalSize: number;
  languages: LanguageStats[];
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  extension?: string;
  language?: string;
  children?: FileNode[];
}

export interface LanguageStats {
  language: string;
  files: number;
  lines: number;
  percentage: number;
}

export interface TechStack {
  languages: string[];
  frameworks: string[];
  packageManagers: string[];
  buildTools: string[];
  testFrameworks: string[];
}

export interface DependencyNode {
  name: string;
  path: string;
  imports: string[];
  exports: string[];
  dependencies: string[];
}

export interface DependencyGraph {
  nodes: DependencyNode[];
  edges: Array<{ from: string; to: string; type: string }>;
  circular: string[][];
}

export interface ProjectMetrics {
  totalLines: number;
  totalFiles: number;
  totalSize: number;
  languages: LanguageStats[];
  averageFileSize: number;
  largestFiles: Array<{ path: string; size: number; lines: number }>;
}

export interface CodeComplexity {
  file: string;
  function?: string;
  complexity: number;
  level: 'low' | 'medium' | 'high' | 'very-high';
  recommendations: string[];
}

export interface CodeSmell {
  type: string;
  severity: 'low' | 'medium' | 'high';
  file: string;
  line?: number;
  message: string;
  recommendation: string;
}

export interface TestCoverage {
  total: number;
  covered: number;
  percentage: number;
  files: Array<{ file: string; coverage: number }>;
  missing: string[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: Date;
  files: string[];
  quality: 'good' | 'fair' | 'poor';
  suggestions: string[];
}

export interface BranchStrategy {
  current: string[];
  recommended: string;
  issues: string[];
  suggestions: string[];
}

export interface DiffAnalysis {
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  risks: string[];
  suggestions: string[];
  summary: string;
}

export interface FileStructureSuggestion {
  current: string;
  suggested: string;
  reason: string;
  priority: 'low' | 'medium' | 'high';
}

export interface DependencyUpdate {
  name: string;
  current: string;
  latest: string;
  type: 'patch' | 'minor' | 'major';
  security: boolean;
}

