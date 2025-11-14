import { readFileContent, detectLanguage } from './file-utils.js';

// Optional tree-sitter imports - will use regex fallback if not available
let Parser: any;
let JavaScript: any;
let TypeScript: any;
let Python: any;
let Java: any;
let Go: any;
let Rust: any;

try {
  Parser = require('tree-sitter');
  JavaScript = require('tree-sitter-javascript');
  TypeScript = require('tree-sitter-typescript');
  Python = require('tree-sitter-python');
  Java = require('tree-sitter-java');
  Go = require('tree-sitter-go');
  Rust = require('tree-sitter-rust');
} catch {
  // tree-sitter not available, will use regex fallback
}

const parsers: Record<string, any> = {};

function getParser(language: string): any | null {
  if (!Parser) {
    return null;
  }
  
  if (parsers[language]) {
    return parsers[language];
  }

  let parser: any;
  let languageModule: any;

  switch (language.toLowerCase()) {
    case 'javascript':
      parser = new Parser();
      languageModule = JavaScript;
      break;
    case 'typescript':
      parser = new Parser();
      languageModule = TypeScript;
      break;
    case 'python':
      parser = new Parser();
      languageModule = Python;
      break;
    case 'java':
      parser = new Parser();
      languageModule = Java;
      break;
    case 'go':
      parser = new Parser();
      languageModule = Go;
      break;
    case 'rust':
      parser = new Parser();
      languageModule = Rust;
      break;
    default:
      return null;
  }

  parser.setLanguage(languageModule);
  parsers[language] = parser;
  return parser;
}

export async function parseFile(filePath: string): Promise<any | null> {
  try {
    if (!Parser) {
      // tree-sitter not available, return null to use regex fallback
      return null;
    }
    
    const content = await readFileContent(filePath);
    const language = detectLanguage(filePath);
    const parser = getParser(language);
    
    if (!parser) {
      return null;
    }

    return parser.parse(content);
  } catch (error) {
    // tree-sitter not available or parsing failed, use regex fallback
    return null;
  }
}

export function extractImports(tree: any, language: string): string[] {
  const imports: string[] = [];
  
  if (!tree || !Parser) {
    // Use regex fallback if tree-sitter not available
    return extractImportsRegex(language);
  }

  const rootNode = tree.rootNode;
  
  function traverse(node: any) {
    if (!node) return;

    // JavaScript/TypeScript imports
    if (language === 'JavaScript' || language === 'TypeScript') {
      if (node.type === 'import_statement' || node.type === 'import_declaration') {
        const sourceNode = node.childForFieldName('source');
        if (sourceNode) {
          const importPath = sourceNode.text.replace(/['"]/g, '');
          imports.push(importPath);
        }
      }
      if (node.type === 'call_expression') {
        const callee = node.childForFieldName('function');
        if (callee?.text === 'require') {
          const args = node.childForFieldName('arguments');
          if (args) {
            const firstArg = args.namedChildren[0];
            if (firstArg) {
              const importPath = firstArg.text.replace(/['"]/g, '');
              imports.push(importPath);
            }
          }
        }
      }
    }

    // Python imports
    if (language === 'Python') {
      if (node.type === 'import_statement' || node.type === 'import_from_statement') {
        const moduleName = node.childForFieldName('module_name');
        if (moduleName) {
          imports.push(moduleName.text);
        }
      }
    }

    // Java imports
    if (language === 'Java') {
      if (node.type === 'import_declaration') {
        const scopedIdentifier = node.childForFieldName('name');
        if (scopedIdentifier) {
          imports.push(scopedIdentifier.text);
        }
      }
    }

    // Go imports
    if (language === 'Go') {
      if (node.type === 'import_declaration') {
        const importSpecs = node.namedChildren.filter((child: any) => child.type === 'import_spec');
        for (const spec of importSpecs) {
          const path = spec.childForFieldName('path');
          if (path) {
            imports.push(path.text.replace(/['"]/g, ''));
          }
        }
      }
    }

    // Rust imports
    if (language === 'Rust') {
      if (node.type === 'use_declaration') {
        const path = node.childForFieldName('path');
        if (path) {
          imports.push(path.text);
        }
      }
    }

    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(rootNode);
  return imports;
}

// Regex-based fallback for import extraction
function extractImportsRegex(_language: string): string[] {
  // This is a simplified regex-based approach
  // Will be implemented in the actual file reading
  return [];
}

export function extractFunctions(tree: any, language: string): Array<{ name: string; line: number }> {
  const functions: Array<{ name: string; line: number }> = [];
  
  if (!tree || !Parser) {
    return functions;
  }

  const rootNode = tree.rootNode;
  
  function traverse(node: any) {
    if (!node) return;

    // JavaScript/TypeScript functions
    if (language === 'JavaScript' || language === 'TypeScript') {
      if (node.type === 'function_declaration' || node.type === 'arrow_function' || node.type === 'method_definition') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          functions.push({ name: nameNode.text, line: nameNode.startPosition.row + 1 });
        }
      }
    }

    // Python functions
    if (language === 'Python') {
      if (node.type === 'function_definition') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          functions.push({ name: nameNode.text, line: nameNode.startPosition.row + 1 });
        }
      }
    }

    // Java methods
    if (language === 'Java') {
      if (node.type === 'method_declaration') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          functions.push({ name: nameNode.text, line: nameNode.startPosition.row + 1 });
        }
      }
    }

    // Go functions
    if (language === 'Go') {
      if (node.type === 'method_declaration' || node.type === 'function_declaration') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          functions.push({ name: nameNode.text, line: nameNode.startPosition.row + 1 });
        }
      }
    }

    // Rust functions
    if (language === 'Rust') {
      if (node.type === 'function_item') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          functions.push({ name: nameNode.text, line: nameNode.startPosition.row + 1 });
        }
      }
    }

    for (const child of node.children) {
      traverse(child);
    }
  }

  traverse(rootNode);
  return functions;
}

