import { Redis } from 'ioredis';
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
export declare enum VariableScope {
    GLOBAL = "global",
    CLASS = "class",
    FUNCTION = "function",
    BLOCK = "block"
}
export declare enum CommentType {
    SINGLE_LINE = "single_line",
    MULTI_LINE = "multi_line",
    DOCUMENTATION = "documentation",
    TODO = "todo",
    FIXME = "fixme"
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
export declare enum PatternCategory {
    DESIGN_PATTERN = "design_pattern",
    ANTI_PATTERN = "anti_pattern",
    BEST_PRACTICE = "best_practice",
    CODE_SMELL = "code_smell",
    SECURITY = "security",
    PERFORMANCE = "performance"
}
export declare enum PatternSeverity {
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
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
export declare enum SuggestionType {
    REFACTOR = "refactor",
    OPTIMIZE = "optimize",
    SIMPLIFY = "simplify",
    EXTRACT = "extract",
    RENAME = "rename",
    REMOVE = "remove",
    ADD = "add"
}
export declare enum SuggestionPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
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
export declare enum DependencyType {
    PRODUCTION = "production",
    DEVELOPMENT = "development",
    PEER = "peer",
    OPTIONAL = "optional"
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
export declare enum VulnerabilitySeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum SecurityRiskLevel {
    MINIMAL = "minimal",
    LOW = "low",
    MODERATE = "moderate",
    HIGH = "high",
    CRITICAL = "critical"
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
export declare class CodeAnalyzer {
    private redis;
    private embeddingManager;
    private readonly CODE_PREFIX;
    private readonly PATTERN_PREFIX;
    private readonly ANALYSIS_PREFIX;
    constructor(redis: Redis, embeddingManager: EmbeddingManager);
    analyzeCodeFile(codeFile: CodeFile): Promise<CodeAnalysisResult>;
    findSimilarCode(codeSnippet: string, language: string, limit?: number): Promise<CodeSimilarityResult[]>;
    detectCodeSmells(codeFile: CodeFile): Promise<DetectedPattern[]>;
    generateCodeSuggestions(codeFile: CodeFile, analysisResult: CodeAnalysisResult): Promise<CodeSuggestion[]>;
    private parseCodeStructure;
    private calculateCodeMetrics;
    private detectPatterns;
    private generateSuggestions;
    private analyzeDependencies;
    private calculateQualityScores;
    private storeAnalysisResult;
    private generateCodeEmbeddings;
    private calculateFunctionComplexity;
    private findFunctionEnd;
    private findClassEnd;
    private parseParameters;
    private parseExtends;
    private parseImplements;
    private extractDocumentation;
    private determineScope;
    private determineCommentType;
    private findAssociatedCode;
    private calculateMaintainabilityIndex;
    private calculateTechnicalDebt;
    private countDuplicateLines;
    private detectDesignPatterns;
    private detectAntiPatterns;
    private findDuplicateCode;
    private mapSeverityToPriority;
    private generateFunctionId;
    private generateClassId;
    private generateVariableId;
    private generateCommentId;
    private generateSuggestionId;
    private generateDependencyId;
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
//# sourceMappingURL=code-analyzer.d.ts.map