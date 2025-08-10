import { Redis } from 'ioredis';
import { EmbeddingManager } from '../embedding-manager';
import { CodeAnalyzer } from './code-analyzer';
export interface CodeGenerationRequest {
    id: string;
    type: GenerationType;
    description: string;
    context: GenerationContext;
    constraints: GenerationConstraints;
    preferences: GenerationPreferences;
}
export declare enum GenerationType {
    FUNCTION = "function",
    CLASS = "class",
    MODULE = "module",
    TEST = "test",
    DOCUMENTATION = "documentation",
    REFACTOR = "refactor",
    BOILERPLATE = "boilerplate"
}
export interface GenerationContext {
    language: string;
    framework?: string;
    existingCode?: string;
    relatedFiles?: string[];
    projectStructure?: ProjectStructure;
    codeStyle?: CodeStyle;
    targetFile?: string;
    insertionPoint?: InsertionPoint;
}
export interface ProjectStructure {
    rootPath: string;
    directories: string[];
    files: ProjectFile[];
    dependencies: string[];
    buildSystem: string;
    testFramework?: string;
}
export interface ProjectFile {
    path: string;
    type: FileType;
    language: string;
    size: number;
    lastModified: Date;
}
export declare enum FileType {
    SOURCE = "source",
    TEST = "test",
    CONFIG = "config",
    DOCUMENTATION = "documentation",
    BUILD = "build"
}
export interface CodeStyle {
    indentation: IndentationType;
    indentSize: number;
    lineLength: number;
    bracketStyle: BracketStyle;
    namingConvention: NamingConvention;
    commentStyle: CommentStyle;
    importStyle: ImportStyle;
}
export declare enum IndentationType {
    SPACES = "spaces",
    TABS = "tabs"
}
export declare enum BracketStyle {
    SAME_LINE = "same_line",
    NEW_LINE = "new_line",
    EGYPTIAN = "egyptian"
}
export interface NamingConvention {
    functions: NamingStyle;
    variables: NamingStyle;
    classes: NamingStyle;
    constants: NamingStyle;
    files: NamingStyle;
}
export declare enum NamingStyle {
    CAMEL_CASE = "camelCase",
    PASCAL_CASE = "PascalCase",
    SNAKE_CASE = "snake_case",
    KEBAB_CASE = "kebab-case",
    SCREAMING_SNAKE_CASE = "SCREAMING_SNAKE_CASE"
}
export interface CommentStyle {
    singleLine: string;
    multiLineStart: string;
    multiLineEnd: string;
    documentation: DocumentationStyle;
}
export declare enum DocumentationStyle {
    JSDOC = "jsdoc",
    SPHINX = "sphinx",
    DOXYGEN = "doxygen",
    RUSTDOC = "rustdoc"
}
export interface ImportStyle {
    grouping: ImportGrouping;
    sorting: ImportSorting;
    spacing: boolean;
}
export declare enum ImportGrouping {
    NONE = "none",
    BY_TYPE = "by_type",
    BY_SOURCE = "by_source"
}
export declare enum ImportSorting {
    ALPHABETICAL = "alphabetical",
    BY_LENGTH = "by_length",
    CUSTOM = "custom"
}
export interface InsertionPoint {
    line: number;
    column: number;
    position: InsertionPosition;
}
export declare enum InsertionPosition {
    BEFORE = "before",
    AFTER = "after",
    REPLACE = "replace",
    APPEND = "append"
}
export interface GenerationConstraints {
    maxLines?: number;
    maxComplexity?: number;
    requiredPatterns?: string[];
    forbiddenPatterns?: string[];
    performanceRequirements?: PerformanceRequirements;
    securityRequirements?: SecurityRequirements;
    testRequirements?: TestRequirements;
}
export interface PerformanceRequirements {
    maxExecutionTime?: number;
    maxMemoryUsage?: number;
    minThroughput?: number;
    cacheStrategy?: CacheStrategy;
}
export declare enum CacheStrategy {
    NONE = "none",
    MEMORY = "memory",
    DISK = "disk",
    DISTRIBUTED = "distributed"
}
export interface SecurityRequirements {
    inputValidation: boolean;
    outputSanitization: boolean;
    authenticationRequired: boolean;
    encryptionRequired: boolean;
    auditLogging: boolean;
}
export interface TestRequirements {
    unitTests: boolean;
    integrationTests: boolean;
    coverageThreshold: number;
    testFramework: string;
    mockingStrategy: MockingStrategy;
}
export declare enum MockingStrategy {
    NONE = "none",
    MANUAL = "manual",
    AUTOMATIC = "automatic",
    DEPENDENCY_INJECTION = "dependency_injection"
}
export interface GenerationPreferences {
    verbosity: VerbosityLevel;
    includeComments: boolean;
    includeDocumentation: boolean;
    includeExamples: boolean;
    optimizeForReadability: boolean;
    optimizeForPerformance: boolean;
    followBestPractices: boolean;
}
export declare enum VerbosityLevel {
    MINIMAL = "minimal",
    STANDARD = "standard",
    DETAILED = "detailed",
    COMPREHENSIVE = "comprehensive"
}
export interface CodeGenerationResult {
    id: string;
    requestId: string;
    generatedCode: string;
    language: string;
    type: GenerationType;
    metadata: GenerationMetadata;
    quality: GenerationQuality;
    suggestions: GenerationSuggestion[];
    alternatives: CodeAlternative[];
}
export interface GenerationMetadata {
    linesGenerated: number;
    complexity: number;
    dependencies: string[];
    patterns: string[];
    estimatedTime: number;
    confidence: number;
    reasoning: string;
}
export interface GenerationQuality {
    overall: number;
    correctness: number;
    readability: number;
    maintainability: number;
    performance: number;
    security: number;
    testability: number;
}
export interface GenerationSuggestion {
    id: string;
    type: SuggestionType;
    description: string;
    impact: ImpactLevel;
    autoApplicable: boolean;
    code?: string;
}
export declare enum SuggestionType {
    OPTIMIZATION = "optimization",
    REFACTORING = "refactoring",
    DOCUMENTATION = "documentation",
    TESTING = "testing",
    SECURITY = "security",
    STYLE = "style"
}
export declare enum ImpactLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export interface CodeAlternative {
    id: string;
    description: string;
    code: string;
    tradeoffs: Tradeoff[];
    score: number;
}
export interface Tradeoff {
    aspect: TradeoffAspect;
    description: string;
    impact: ImpactLevel;
}
export declare enum TradeoffAspect {
    PERFORMANCE = "performance",
    READABILITY = "readability",
    MAINTAINABILITY = "maintainability",
    COMPLEXITY = "complexity",
    MEMORY_USAGE = "memory_usage",
    SECURITY = "security"
}
export declare class CodeGenerator {
    private redis;
    private embeddingManager;
    private codeAnalyzer;
    private readonly GENERATION_PREFIX;
    private readonly TEMPLATE_PREFIX;
    private readonly PATTERN_PREFIX;
    constructor(redis: Redis, embeddingManager: EmbeddingManager, codeAnalyzer: CodeAnalyzer);
    generateCode(request: CodeGenerationRequest): Promise<CodeGenerationResult>;
    generateFunction(request: CodeGenerationRequest, contextAnalysis: any, similarPatterns: any[]): Promise<string>;
    generateClass(request: CodeGenerationRequest, contextAnalysis: any, similarPatterns: any[]): Promise<string>;
    generateTest(request: CodeGenerationRequest, contextAnalysis: any, similarPatterns: any[]): Promise<string>;
    generateDocumentation(request: CodeGenerationRequest, contextAnalysis: any, similarPatterns: any[]): Promise<string>;
    generateRefactoring(request: CodeGenerationRequest, contextAnalysis: any, similarPatterns: any[]): Promise<string>;
    generateBoilerplate(request: CodeGenerationRequest, contextAnalysis: any, similarPatterns: any[]): Promise<string>;
    generateModule(request: CodeGenerationRequest, contextAnalysis: any, similarPatterns: any[]): Promise<string>;
    private analyzeGenerationContext;
    private findSimilarPatterns;
    private findExistingPatterns;
    private applyCodeStyle;
    private wrapLine;
    private calculateGenerationQuality;
    private generateSuggestions;
    private generateAlternatives;
    private createGenerationMetadata;
    private storeGenerationResult;
    private extractFunctionName;
    private extractParameters;
    private extractReturnType;
    private generateFunctionSignature;
    private generateFunctionBody;
    private generateFunctionDocumentation;
    private indentCode;
    private extractClassName;
    private extractProperties;
    private extractMethods;
    private extractInheritance;
    private findSimilarFunctions;
    private findSimilarClasses;
    private generateProperty;
    private generateConstructor;
    private generateMethod;
    private generateTestHeader;
    private extractFunctionsFromCode;
    private generateFunctionTests;
    private generateClassDocumentation;
    private applySuggestion;
    private applyDescriptionBasedRefactoring;
    private generateReactBoilerplate;
    private generateExpressBoilerplate;
    private generateNestJSBoilerplate;
    private generateVanillaJSBoilerplate;
    private generateFastAPIBoilerplate;
    private generateDjangoBoilerplate;
    private generatePythonBoilerplate;
    private extractModuleName;
    private extractExports;
    private extractImports;
    private getFileExtension;
    private estimateComplexity;
    private extractDependencies;
    private identifyPatterns;
    private generateResultId;
    private generateSuggestionId;
    private generateAlternativeId;
}
//# sourceMappingURL=code-generator.d.ts.map