import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
import { EmbeddingManager } from '../embedding-manager';

export interface CodeFile {
  id: string;
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: Date;
  hash: string;
  metadata: CodeFileMetadata;
}

export interface CodeFileMetadata {
  imports: string[];
  exports: string[];
  dependencies: string[];
  complexity: number;
  linesOfCode: number;
  functions: CodeFunction[];
  classes: CodeClass[];
  variables: CodeVariable[];
  comments: CodeComment[];
}

export interface CodeFunction {
  id: string;
  name: string;
  signature: string;
  parameters: CodeParameter[];
  returnType: string;
  startLine: number;
  endLine: number;
  complexity: number;
  documentation: string;
  embeddings: number[];
  calls: string[];
  calledBy: string[];
}

export interface CodeClass {
  id: string;
  name: string;
  extends: string[];
  implements: string[];
  startLine: number;
  endLine: number;
  methods: CodeFunction[];
  properties: CodeVariable[];
  documentation: string;
  embeddings: number[];
}

export interface CodeVariable {
  id: string;
  name: string;
  type: string;
  scope: VariableScope;
  line: number;
  isConstant: boolean;
  documentation: string;
}

export interface CodeParameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
}

export interface CodeComment {
  id: string;
  content: string;
  type: CommentType;
  startLine: number;
  endLine: number;
  associatedCode?: string;
}

export enum VariableScope {
  GLOBAL = 'global',
  CLASS = 'class',
  FUNCTION = 'function',
  BLOCK = 'block'
}

export enum CommentType {
  SINGLE_LINE = 'single_line',
  MULTI_LINE = 'multi_line',
  DOCUMENTATION = 'documentation',
  TODO = 'todo',
  FIXME = 'fixme'
}

export interface CodePattern {
  id: string;
  name: string;
  description: string;
  pattern: string;
  category: PatternCategory;
  severity: PatternSeverity;
  examples: CodeExample[];
  embeddings: number[];
}

export enum PatternCategory {
  DESIGN_PATTERN = 'design_pattern',
  ANTI_PATTERN = 'anti_pattern',
  BEST_PRACTICE = 'best_practice',
  CODE_SMELL = 'code_smell',
  SECURITY = 'security',
  PERFORMANCE = 'performance'
}

export enum PatternSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface CodeExample {
  id: string;
  title: string;
  code: string;
  language: string;
  explanation: string;
  tags: string[];
}

export interface CodeAnalysisResult {
  fileId: string;
  analysisDate: Date;
  metrics: CodeMetrics;
  patterns: DetectedPattern[];
  suggestions: CodeSuggestion[];
  dependencies: CodeDependency[];
  quality: CodeQuality;
}

export interface CodeMetrics {
  linesOfCode: number;
  cyclomaticComplexity: number;
  maintainabilityIndex: number;
  technicalDebt: number;
  testCoverage: number;
  duplicateLines: number;
  functionCount: number;
  classCount: number;
}

export interface DetectedPattern {
  patternId: string;
  name: string;
  category: PatternCategory;
  severity: PatternSeverity;
  location: CodeLocation;
  confidence: number;
  description: string;
  suggestion: string;
}

export interface CodeLocation {
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  file: string;
}

export interface CodeSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description: string;
  location: CodeLocation;
  priority: SuggestionPriority;
  autoFixable: boolean;
  beforeCode: string;
  afterCode: string;
  reasoning: string;
}

export enum SuggestionType {
  REFACTOR = 'refactor',
  OPTIMIZE = 'optimize',
  SIMPLIFY = 'simplify',
  EXTRACT = 'extract',
  RENAME = 'rename',
  REMOVE = 'remove',
  ADD = 'add'
}

export enum SuggestionPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface CodeDependency {
  id: string;
  name: string;
  version: string;
  type: DependencyType;
  usageCount: number;
  lastUsed: Date;
  security: SecurityInfo;
}

export enum DependencyType {
  PRODUCTION = 'production',
  DEVELOPMENT = 'development',
  PEER = 'peer',
  OPTIONAL = 'optional'
}

export interface SecurityInfo {
  vulnerabilities: SecurityVulnerability[];
  riskLevel: SecurityRiskLevel;
  lastScanned: Date;
}

export interface SecurityVulnerability {
  id: string;
  severity: VulnerabilitySeverity;
  description: string;
  cve?: string;
  fixedIn?: string;
}

export enum VulnerabilitySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum SecurityRiskLevel {
  MINIMAL = 'minimal',
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface CodeQuality {
  overall: number;
  maintainability: number;
  reliability: number;
  security: number;
  performance: number;
  readability: number;
  testability: number;
}

export class CodeAnalyzer {
  private redis: Redis;
  private embeddingManager: EmbeddingManager;
  private readonly CODE_PREFIX = 'code';
  private readonly PATTERN_PREFIX = 'pattern';
  private readonly ANALYSIS_PREFIX = 'analysis';

  constructor(redis: Redis, embeddingManager: EmbeddingManager) {
    this.redis = redis;
    this.embeddingManager = embeddingManager;
  }

  async analyzeCodeFile(codeFile: CodeFile): Promise<CodeAnalysisResult> {
    logger.info(`Analyzing code file: ${codeFile.path}`);

    // Parse code structure
    const metadata = await this.parseCodeStructure(codeFile);
    
    // Calculate metrics
    const metrics = await this.calculateCodeMetrics(codeFile, metadata);
    
    // Detect patterns
    const patterns = await this.detectPatterns(codeFile, metadata);
    
    // Generate suggestions
    const suggestions = await this.generateSuggestions(codeFile, metadata, patterns);
    
    // Analyze dependencies
    const dependencies = await this.analyzeDependencies(codeFile, metadata);
    
    // Calculate quality scores
    const quality = await this.calculateQualityScores(metrics, patterns, suggestions);

    const analysisResult: CodeAnalysisResult = {
      fileId: codeFile.id,
      analysisDate: new Date(),
      metrics,
      patterns,
      suggestions,
      dependencies,
      quality
    };

    // Store analysis result
    await this.storeAnalysisResult(analysisResult);

    // Generate and store embeddings for code components
    await this.generateCodeEmbeddings(codeFile, metadata);

    logger.info(`Code analysis completed for ${codeFile.path}`);
    return analysisResult;
  }

  async findSimilarCode(codeSnippet: string, language: string, limit: number = 10): Promise<CodeSimilarityResult[]> {
    // Generate embedding for the code snippet
    const queryEmbedding = await this.embeddingManager.generateEmbedding(codeSnippet);
    
    // Search for similar code using vector similarity
    const indexName = `${this.CODE_PREFIX}:${language}:index`;
    
    try {
      const results = await this.redis.call('FT.SEARCH', indexName,
        `*=>[KNN ${limit} @embeddings $query_vec AS score]`,
        'PARAMS', '2', 'query_vec', Buffer.from(new Float32Array(queryEmbedding).buffer),
        'SORTBY', 'score',
        'RETURN', '8', 'content', 'path', 'function_name', 'class_name', 'start_line', 'end_line', 'complexity', 'score',
        'DIALECT', '2'
      );

      const similarityResults: CodeSimilarityResult[] = [];
      
      for (let i = 1; i < results.length; i += 2) {
        const fields = results[i + 1];
        const fieldsObj: any = {};
        
        for (let j = 0; j < fields.length; j += 2) {
          fieldsObj[fields[j]] = fields[j + 1];
        }

        similarityResults.push({
          id: results[i].split(':').pop(),
          content: fieldsObj.content,
          path: fieldsObj.path,
          functionName: fieldsObj.function_name,
          className: fieldsObj.class_name,
          startLine: parseInt(fieldsObj.start_line),
          endLine: parseInt(fieldsObj.end_line),
          complexity: parseInt(fieldsObj.complexity),
          similarity: parseFloat(fieldsObj.score)
        });
      }

      return similarityResults;
    } catch (error) {
      logger.error(`Similar code search failed: ${error.message}`);
      return [];
    }
  }

  async detectCodeSmells(codeFile: CodeFile): Promise<DetectedPattern[]> {
    const codeSmells: DetectedPattern[] = [];
    const metadata = await this.parseCodeStructure(codeFile);

    // Long method detection
    for (const func of metadata.functions) {
      const lineCount = func.endLine - func.startLine;
      if (lineCount > 50) {
        codeSmells.push({
          patternId: 'long-method',
          name: 'Long Method',
          category: PatternCategory.CODE_SMELL,
          severity: PatternSeverity.WARNING,
          location: {
            startLine: func.startLine,
            endLine: func.endLine,
            startColumn: 0,
            endColumn: 0,
            file: codeFile.path
          },
          confidence: 0.9,
          description: `Method '${func.name}' is ${lineCount} lines long, consider breaking it down`,
          suggestion: 'Extract smaller methods to improve readability and maintainability'
        });
      }
    }

    // High complexity detection
    for (const func of metadata.functions) {
      if (func.complexity > 10) {
        codeSmells.push({
          patternId: 'high-complexity',
          name: 'High Cyclomatic Complexity',
          category: PatternCategory.CODE_SMELL,
          severity: PatternSeverity.ERROR,
          location: {
            startLine: func.startLine,
            endLine: func.endLine,
            startColumn: 0,
            endColumn: 0,
            file: codeFile.path
          },
          confidence: 0.95,
          description: `Method '${func.name}' has complexity ${func.complexity}, which is too high`,
          suggestion: 'Reduce complexity by extracting methods or simplifying logic'
        });
      }
    }

    // Large class detection
    for (const cls of metadata.classes) {
      const lineCount = cls.endLine - cls.startLine;
      if (lineCount > 200) {
        codeSmells.push({
          patternId: 'large-class',
          name: 'Large Class',
          category: PatternCategory.CODE_SMELL,
          severity: PatternSeverity.WARNING,
          location: {
            startLine: cls.startLine,
            endLine: cls.endLine,
            startColumn: 0,
            endColumn: 0,
            file: codeFile.path
          },
          confidence: 0.8,
          description: `Class '${cls.name}' is ${lineCount} lines long, consider splitting responsibilities`,
          suggestion: 'Apply Single Responsibility Principle and extract related functionality'
        });
      }
    }

    // Duplicate code detection (simplified)
    const duplicates = await this.findDuplicateCode(codeFile);
    for (const duplicate of duplicates) {
      codeSmells.push({
        patternId: 'duplicate-code',
        name: 'Duplicate Code',
        category: PatternCategory.CODE_SMELL,
        severity: PatternSeverity.WARNING,
        location: duplicate.location,
        confidence: duplicate.confidence,
        description: `Duplicate code detected: ${duplicate.description}`,
        suggestion: 'Extract common code into a shared method or utility'
      });
    }

    return codeSmells;
  }

  async generateCodeSuggestions(codeFile: CodeFile, analysisResult: CodeAnalysisResult): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];
    const metadata = await this.parseCodeStructure(codeFile);

    // Variable naming suggestions
    for (const variable of metadata.variables) {
      if (variable.name.length < 3 && variable.scope !== VariableScope.BLOCK) {
        suggestions.push({
          id: this.generateSuggestionId(),
          type: SuggestionType.RENAME,
          title: 'Improve Variable Naming',
          description: `Variable '${variable.name}' has a non-descriptive name`,
          location: {
            startLine: variable.line,
            endLine: variable.line,
            startColumn: 0,
            endColumn: 0,
            file: codeFile.path
          },
          priority: SuggestionPriority.LOW,
          autoFixable: false,
          beforeCode: variable.name,
          afterCode: `descriptive${variable.name.charAt(0).toUpperCase() + variable.name.slice(1)}`,
          reasoning: 'Descriptive variable names improve code readability and maintainability'
        });
      }
    }

    // Function extraction suggestions
    for (const func of metadata.functions) {
      if (func.complexity > 5) {
        suggestions.push({
          id: this.generateSuggestionId(),
          type: SuggestionType.EXTRACT,
          title: 'Extract Method',
          description: `Function '${func.name}' could benefit from method extraction`,
          location: {
            startLine: func.startLine,
            endLine: func.endLine,
            startColumn: 0,
            endColumn: 0,
            file: codeFile.path
          },
          priority: SuggestionPriority.MEDIUM,
          autoFixable: false,
          beforeCode: func.signature,
          afterCode: 'Consider extracting complex logic into separate methods',
          reasoning: 'Breaking down complex functions improves readability and testability'
        });
      }
    }

    // Performance optimization suggestions
    if (analysisResult.quality.performance < 0.7) {
      suggestions.push({
        id: this.generateSuggestionId(),
        type: SuggestionType.OPTIMIZE,
        title: 'Performance Optimization',
        description: 'Code could benefit from performance optimizations',
        location: {
          startLine: 1,
          endLine: metadata.linesOfCode,
          startColumn: 0,
          endColumn: 0,
          file: codeFile.path
        },
        priority: SuggestionPriority.MEDIUM,
        autoFixable: false,
        beforeCode: 'Current implementation',
        afterCode: 'Optimized implementation',
        reasoning: 'Performance optimizations can improve user experience and resource usage'
      });
    }

    return suggestions;
  }

  private async parseCodeStructure(codeFile: CodeFile): Promise<CodeFileMetadata> {
    // This is a simplified parser - in a real implementation, you'd use
    // language-specific parsers like TypeScript compiler API, Babel, etc.
    
    const lines = codeFile.content.split('\n');
    const functions: CodeFunction[] = [];
    const classes: CodeClass[] = [];
    const variables: CodeVariable[] = [];
    const comments: CodeComment[] = [];
    const imports: string[] = [];
    const exports: string[] = [];

    let complexity = 0;
    let currentClass: CodeClass | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Parse imports
      if (line.startsWith('import ') || line.startsWith('const ') && line.includes('require(')) {
        const importMatch = line.match(/from ['"]([^'"]+)['"]/);
        if (importMatch) {
          imports.push(importMatch[1]);
        }
      }

      // Parse exports
      if (line.startsWith('export ')) {
        exports.push(line);
      }

      // Parse functions
      const functionMatch = line.match(/(?:function|const|let|var)\s+(\w+)\s*(?:\(|=)/);
      if (functionMatch) {
        const funcName = functionMatch[1];
        const funcComplexity = this.calculateFunctionComplexity(lines, i);
        
        functions.push({
          id: this.generateFunctionId(codeFile.id, funcName),
          name: funcName,
          signature: line,
          parameters: this.parseParameters(line),
          returnType: 'unknown',
          startLine: i + 1,
          endLine: this.findFunctionEnd(lines, i),
          complexity: funcComplexity,
          documentation: this.extractDocumentation(lines, i),
          embeddings: [],
          calls: [],
          calledBy: []
        });

        complexity += funcComplexity;
      }

      // Parse classes
      const classMatch = line.match(/class\s+(\w+)/);
      if (classMatch) {
        const className = classMatch[1];
        const classEnd = this.findClassEnd(lines, i);
        
        currentClass = {
          id: this.generateClassId(codeFile.id, className),
          name: className,
          extends: this.parseExtends(line),
          implements: this.parseImplements(line),
          startLine: i + 1,
          endLine: classEnd,
          methods: [],
          properties: [],
          documentation: this.extractDocumentation(lines, i),
          embeddings: []
        };

        classes.push(currentClass);
      }

      // Parse variables
      const variableMatch = line.match(/(?:const|let|var)\s+(\w+)/);
      if (variableMatch) {
        const varName = variableMatch[1];
        variables.push({
          id: this.generateVariableId(codeFile.id, varName),
          name: varName,
          type: 'unknown',
          scope: this.determineScope(lines, i, currentClass),
          line: i + 1,
          isConstant: line.startsWith('const'),
          documentation: ''
        });
      }

      // Parse comments
      if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        comments.push({
          id: this.generateCommentId(codeFile.id, i),
          content: line,
          type: this.determineCommentType(line),
          startLine: i + 1,
          endLine: i + 1,
          associatedCode: this.findAssociatedCode(lines, i)
        });
      }
    }

    return {
      imports,
      exports,
      dependencies: imports,
      complexity,
      linesOfCode: lines.length,
      functions,
      classes,
      variables,
      comments
    };
  }

  private async calculateCodeMetrics(codeFile: CodeFile, metadata: CodeFileMetadata): Promise<CodeMetrics> {
    return {
      linesOfCode: metadata.linesOfCode,
      cyclomaticComplexity: metadata.complexity,
      maintainabilityIndex: this.calculateMaintainabilityIndex(metadata),
      technicalDebt: this.calculateTechnicalDebt(metadata),
      testCoverage: 0, // Would need integration with test coverage tools
      duplicateLines: await this.countDuplicateLines(codeFile),
      functionCount: metadata.functions.length,
      classCount: metadata.classes.length
    };
  }

  private async detectPatterns(codeFile: CodeFile, metadata: CodeFileMetadata): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    
    // Detect design patterns
    patterns.push(...await this.detectDesignPatterns(codeFile, metadata));
    
    // Detect anti-patterns
    patterns.push(...await this.detectAntiPatterns(codeFile, metadata));
    
    // Detect code smells
    patterns.push(...await this.detectCodeSmells(codeFile));

    return patterns;
  }

  private async generateSuggestions(codeFile: CodeFile, metadata: CodeFileMetadata, patterns: DetectedPattern[]): Promise<CodeSuggestion[]> {
    const suggestions: CodeSuggestion[] = [];
    
    // Generate suggestions based on detected patterns
    for (const pattern of patterns) {
      if (pattern.category === PatternCategory.CODE_SMELL || pattern.category === PatternCategory.ANTI_PATTERN) {
        suggestions.push({
          id: this.generateSuggestionId(),
          type: SuggestionType.REFACTOR,
          title: `Fix ${pattern.name}`,
          description: pattern.suggestion,
          location: pattern.location,
          priority: this.mapSeverityToPriority(pattern.severity),
          autoFixable: false,
          beforeCode: 'Current code',
          afterCode: 'Improved code',
          reasoning: pattern.description
        });
      }
    }

    return suggestions;
  }

  private async analyzeDependencies(codeFile: CodeFile, metadata: CodeFileMetadata): Promise<CodeDependency[]> {
    const dependencies: CodeDependency[] = [];
    
    for (const dep of metadata.dependencies) {
      dependencies.push({
        id: this.generateDependencyId(dep),
        name: dep,
        version: 'unknown',
        type: DependencyType.PRODUCTION,
        usageCount: 1,
        lastUsed: new Date(),
        security: {
          vulnerabilities: [],
          riskLevel: SecurityRiskLevel.MINIMAL,
          lastScanned: new Date()
        }
      });
    }

    return dependencies;
  }

  private async calculateQualityScores(metrics: CodeMetrics, patterns: DetectedPattern[], suggestions: CodeSuggestion[]): Promise<CodeQuality> {
    const maintainability = Math.max(0, 1 - (metrics.cyclomaticComplexity / 100));
    const reliability = Math.max(0, 1 - (patterns.filter(p => p.severity === PatternSeverity.ERROR).length / 10));
    const security = Math.max(0, 1 - (patterns.filter(p => p.category === PatternCategory.SECURITY).length / 5));
    const performance = Math.max(0, 1 - (patterns.filter(p => p.category === PatternCategory.PERFORMANCE).length / 5));
    const readability = Math.max(0, 1 - (suggestions.length / 20));
    const testability = Math.max(0, 1 - (metrics.cyclomaticComplexity / 50));

    const overall = (maintainability + reliability + security + performance + readability + testability) / 6;

    return {
      overall,
      maintainability,
      reliability,
      security,
      performance,
      readability,
      testability
    };
  }

  private async storeAnalysisResult(result: CodeAnalysisResult): Promise<void> {
    const key = `${this.ANALYSIS_PREFIX}:${result.fileId}`;
    await this.redis.hset(key,
      'data', JSON.stringify(result),
      'timestamp', result.analysisDate.toISOString()
    );
  }

  private async generateCodeEmbeddings(codeFile: CodeFile, metadata: CodeFileMetadata): Promise<void> {
    // Generate embeddings for functions
    for (const func of metadata.functions) {
      const embedding = await this.embeddingManager.generateEmbedding(func.signature + ' ' + func.documentation);
      func.embeddings = embedding;
      
      // Store in vector index
      await this.redis.hset(
        `${this.CODE_PREFIX}:${codeFile.language}:${func.id}`,
        'content', func.signature,
        'path', codeFile.path,
        'function_name', func.name,
        'start_line', func.startLine.toString(),
        'end_line', func.endLine.toString(),
        'complexity', func.complexity.toString(),
        'embeddings', Buffer.from(new Float32Array(embedding).buffer)
      );
    }

    // Generate embeddings for classes
    for (const cls of metadata.classes) {
      const classContent = `class ${cls.name} ${cls.documentation}`;
      const embedding = await this.embeddingManager.generateEmbedding(classContent);
      cls.embeddings = embedding;
      
      // Store in vector index
      await this.redis.hset(
        `${this.CODE_PREFIX}:${codeFile.language}:${cls.id}`,
        'content', classContent,
        'path', codeFile.path,
        'class_name', cls.name,
        'start_line', cls.startLine.toString(),
        'end_line', cls.endLine.toString(),
        'embeddings', Buffer.from(new Float32Array(embedding).buffer)
      );
    }
  }

  // Helper methods
  private calculateFunctionComplexity(lines: string[], startIndex: number): number {
    let complexity = 1; // Base complexity
    const endIndex = this.findFunctionEnd(lines, startIndex);
    
    for (let i = startIndex; i < endIndex; i++) {
      const line = lines[i].toLowerCase();
      if (line.includes('if ') || line.includes('else') || line.includes('while ') || 
          line.includes('for ') || line.includes('switch ') || line.includes('case ') ||
          line.includes('catch ') || line.includes('&&') || line.includes('||')) {
        complexity++;
      }
    }
    
    return complexity;
  }

  private findFunctionEnd(lines: string[], startIndex: number): number {
    let braceCount = 0;
    let inFunction = false;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      
      for (const char of line) {
        if (char === '{') {
          braceCount++;
          inFunction = true;
        } else if (char === '}') {
          braceCount--;
          if (inFunction && braceCount === 0) {
            return i + 1;
          }
        }
      }
    }
    
    return lines.length;
  }

  private findClassEnd(lines: string[], startIndex: number): number {
    return this.findFunctionEnd(lines, startIndex); // Similar logic
  }

  private parseParameters(signature: string): CodeParameter[] {
    const paramMatch = signature.match(/\(([^)]*)\)/);
    if (!paramMatch) return [];
    
    const paramString = paramMatch[1];
    if (!paramString.trim()) return [];
    
    return paramString.split(',').map(param => {
      const trimmed = param.trim();
      const parts = trimmed.split(':');
      return {
        name: parts[0]?.trim() || 'unknown',
        type: parts[1]?.trim() || 'unknown',
        optional: trimmed.includes('?'),
        defaultValue: trimmed.includes('=') ? trimmed.split('=')[1]?.trim() : undefined
      };
    });
  }

  private parseExtends(line: string): string[] {
    const match = line.match(/extends\s+(\w+)/);
    return match ? [match[1]] : [];
  }

  private parseImplements(line: string): string[] {
    const match = line.match(/implements\s+([\w,\s]+)/);
    return match ? match[1].split(',').map(s => s.trim()) : [];
  }

  private extractDocumentation(lines: string[], index: number): string {
    let doc = '';
    for (let i = index - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('/**') || line.startsWith('*') || line.startsWith('*/')) {
        doc = line + '\n' + doc;
      } else if (line.startsWith('//')) {
        doc = line + '\n' + doc;
      } else if (line.length > 0) {
        break;
      }
    }
    return doc.trim();
  }

  private determineScope(lines: string[], index: number, currentClass: CodeClass | null): VariableScope {
    if (currentClass) return VariableScope.CLASS;
    
    // Simple scope detection - would need more sophisticated parsing
    for (let i = index - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.includes('function ') || line.includes('=> ')) {
        return VariableScope.FUNCTION;
      }
    }
    
    return VariableScope.GLOBAL;
  }

  private determineCommentType(line: string): CommentType {
    if (line.includes('TODO')) return CommentType.TODO;
    if (line.includes('FIXME')) return CommentType.FIXME;
    if (line.startsWith('/**')) return CommentType.DOCUMENTATION;
    if (line.startsWith('/*')) return CommentType.MULTI_LINE;
    return CommentType.SINGLE_LINE;
  }

  private findAssociatedCode(lines: string[], commentIndex: number): string {
    for (let i = commentIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.length > 0 && !line.startsWith('//') && !line.startsWith('*')) {
        return line;
      }
    }
    return '';
  }

  private calculateMaintainabilityIndex(metadata: CodeFileMetadata): number {
    // Simplified maintainability index calculation
    const volume = metadata.linesOfCode * Math.log2(metadata.functions.length + metadata.classes.length + 1);
    const complexity = metadata.complexity;
    const linesOfCode = metadata.linesOfCode;
    
    return Math.max(0, (171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(linesOfCode)) / 171);
  }

  private calculateTechnicalDebt(metadata: CodeFileMetadata): number {
    // Simplified technical debt calculation (in hours)
    let debt = 0;
    
    // Add debt for high complexity functions
    for (const func of metadata.functions) {
      if (func.complexity > 10) {
        debt += (func.complexity - 10) * 0.5;
      }
    }
    
    // Add debt for large classes
    for (const cls of metadata.classes) {
      const size = cls.endLine - cls.startLine;
      if (size > 200) {
        debt += (size - 200) * 0.01;
      }
    }
    
    return debt;
  }

  private async countDuplicateLines(codeFile: CodeFile): Promise<number> {
    // Simplified duplicate detection
    const lines = codeFile.content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const lineCount = new Map<string, number>();
    
    for (const line of lines) {
      lineCount.set(line, (lineCount.get(line) || 0) + 1);
    }
    
    let duplicates = 0;
    for (const [line, count] of lineCount) {
      if (count > 1) {
        duplicates += count - 1;
      }
    }
    
    return duplicates;
  }

  private async detectDesignPatterns(codeFile: CodeFile, metadata: CodeFileMetadata): Promise<DetectedPattern[]> {
    // Simplified design pattern detection
    const patterns: DetectedPattern[] = [];
    
    // Singleton pattern detection
    for (const cls of metadata.classes) {
      const hasPrivateConstructor = cls.methods.some(m => m.name === 'constructor' && m.signature.includes('private'));
      const hasGetInstance = cls.methods.some(m => m.name.includes('getInstance') || m.name.includes('instance'));
      
      if (hasPrivateConstructor && hasGetInstance) {
        patterns.push({
          patternId: 'singleton',
          name: 'Singleton Pattern',
          category: PatternCategory.DESIGN_PATTERN,
          severity: PatternSeverity.INFO,
          location: {
            startLine: cls.startLine,
            endLine: cls.endLine,
            startColumn: 0,
            endColumn: 0,
            file: codeFile.path
          },
          confidence: 0.8,
          description: `Class '${cls.name}' implements Singleton pattern`,
          suggestion: 'Consider if Singleton is necessary or if dependency injection would be better'
        });
      }
    }
    
    return patterns;
  }

  private async detectAntiPatterns(codeFile: CodeFile, metadata: CodeFileMetadata): Promise<DetectedPattern[]> {
    const patterns: DetectedPattern[] = [];
    
    // God class anti-pattern
    for (const cls of metadata.classes) {
      if (cls.methods.length > 20) {
        patterns.push({
          patternId: 'god-class',
          name: 'God Class',
          category: PatternCategory.ANTI_PATTERN,
          severity: PatternSeverity.WARNING,
          location: {
            startLine: cls.startLine,
            endLine: cls.endLine,
            startColumn: 0,
            endColumn: 0,
            file: codeFile.path
          },
          confidence: 0.9,
          description: `Class '${cls.name}' has too many responsibilities (${cls.methods.length} methods)`,
          suggestion: 'Break down the class into smaller, more focused classes'
        });
      }
    }
    
    return patterns;
  }

  private async findDuplicateCode(codeFile: CodeFile): Promise<DetectedPattern[]> {
    // Simplified duplicate code detection
    return [];
  }

  private mapSeverityToPriority(severity: PatternSeverity): SuggestionPriority {
    switch (severity) {
      case PatternSeverity.CRITICAL: return SuggestionPriority.CRITICAL;
      case PatternSeverity.ERROR: return SuggestionPriority.HIGH;
      case PatternSeverity.WARNING: return SuggestionPriority.MEDIUM;
      case PatternSeverity.INFO: return SuggestionPriority.LOW;
      default: return SuggestionPriority.LOW;
    }
  }

  // ID generation methods
  private generateFunctionId(fileId: string, functionName: string): string {
    return `func_${fileId}_${functionName}_${Date.now()}`;
  }

  private generateClassId(fileId: string, className: string): string {
    return `class_${fileId}_${className}_${Date.now()}`;
  }

  private generateVariableId(fileId: string, variableName: string): string {
    return `var_${fileId}_${variableName}_${Date.now()}`;
  }

  private generateCommentId(fileId: string, line: number): string {
    return `comment_${fileId}_${line}_${Date.now()}`;
  }

  private generateSuggestionId(): string {
    return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDependencyId(name: string): string {
    return `dep_${name}_${Date.now()}`;
  }
}

export interface CodeSimilarityResult {
  id: string;
  content: string;
  path: string;
  functionName?: string;
  className?: string;
  startLine: number;
  endLine: number;
  complexity: number;
  similarity: number;
}