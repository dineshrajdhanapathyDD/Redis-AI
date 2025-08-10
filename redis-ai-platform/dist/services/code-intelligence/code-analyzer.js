"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeAnalyzer = exports.SecurityRiskLevel = exports.VulnerabilitySeverity = exports.DependencyType = exports.SuggestionPriority = exports.SuggestionType = exports.PatternSeverity = exports.PatternCategory = exports.CommentType = exports.VariableScope = void 0;
const logger_1 = require("../../utils/logger");
var VariableScope;
(function (VariableScope) {
    VariableScope["GLOBAL"] = "global";
    VariableScope["CLASS"] = "class";
    VariableScope["FUNCTION"] = "function";
    VariableScope["BLOCK"] = "block";
})(VariableScope || (exports.VariableScope = VariableScope = {}));
var CommentType;
(function (CommentType) {
    CommentType["SINGLE_LINE"] = "single_line";
    CommentType["MULTI_LINE"] = "multi_line";
    CommentType["DOCUMENTATION"] = "documentation";
    CommentType["TODO"] = "todo";
    CommentType["FIXME"] = "fixme";
})(CommentType || (exports.CommentType = CommentType = {}));
var PatternCategory;
(function (PatternCategory) {
    PatternCategory["DESIGN_PATTERN"] = "design_pattern";
    PatternCategory["ANTI_PATTERN"] = "anti_pattern";
    PatternCategory["BEST_PRACTICE"] = "best_practice";
    PatternCategory["CODE_SMELL"] = "code_smell";
    PatternCategory["SECURITY"] = "security";
    PatternCategory["PERFORMANCE"] = "performance";
})(PatternCategory || (exports.PatternCategory = PatternCategory = {}));
var PatternSeverity;
(function (PatternSeverity) {
    PatternSeverity["INFO"] = "info";
    PatternSeverity["WARNING"] = "warning";
    PatternSeverity["ERROR"] = "error";
    PatternSeverity["CRITICAL"] = "critical";
})(PatternSeverity || (exports.PatternSeverity = PatternSeverity = {}));
var SuggestionType;
(function (SuggestionType) {
    SuggestionType["REFACTOR"] = "refactor";
    SuggestionType["OPTIMIZE"] = "optimize";
    SuggestionType["SIMPLIFY"] = "simplify";
    SuggestionType["EXTRACT"] = "extract";
    SuggestionType["RENAME"] = "rename";
    SuggestionType["REMOVE"] = "remove";
    SuggestionType["ADD"] = "add";
})(SuggestionType || (exports.SuggestionType = SuggestionType = {}));
var SuggestionPriority;
(function (SuggestionPriority) {
    SuggestionPriority["LOW"] = "low";
    SuggestionPriority["MEDIUM"] = "medium";
    SuggestionPriority["HIGH"] = "high";
    SuggestionPriority["CRITICAL"] = "critical";
})(SuggestionPriority || (exports.SuggestionPriority = SuggestionPriority = {}));
var DependencyType;
(function (DependencyType) {
    DependencyType["PRODUCTION"] = "production";
    DependencyType["DEVELOPMENT"] = "development";
    DependencyType["PEER"] = "peer";
    DependencyType["OPTIONAL"] = "optional";
})(DependencyType || (exports.DependencyType = DependencyType = {}));
var VulnerabilitySeverity;
(function (VulnerabilitySeverity) {
    VulnerabilitySeverity["LOW"] = "low";
    VulnerabilitySeverity["MEDIUM"] = "medium";
    VulnerabilitySeverity["HIGH"] = "high";
    VulnerabilitySeverity["CRITICAL"] = "critical";
})(VulnerabilitySeverity || (exports.VulnerabilitySeverity = VulnerabilitySeverity = {}));
var SecurityRiskLevel;
(function (SecurityRiskLevel) {
    SecurityRiskLevel["MINIMAL"] = "minimal";
    SecurityRiskLevel["LOW"] = "low";
    SecurityRiskLevel["MODERATE"] = "moderate";
    SecurityRiskLevel["HIGH"] = "high";
    SecurityRiskLevel["CRITICAL"] = "critical";
})(SecurityRiskLevel || (exports.SecurityRiskLevel = SecurityRiskLevel = {}));
class CodeAnalyzer {
    redis;
    embeddingManager;
    CODE_PREFIX = 'code';
    PATTERN_PREFIX = 'pattern';
    ANALYSIS_PREFIX = 'analysis';
    constructor(redis, embeddingManager) {
        this.redis = redis;
        this.embeddingManager = embeddingManager;
    }
    async analyzeCodeFile(codeFile) {
        logger_1.logger.info(`Analyzing code file: ${codeFile.path}`);
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
        const analysisResult = {
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
        logger_1.logger.info(`Code analysis completed for ${codeFile.path}`);
        return analysisResult;
    }
    async findSimilarCode(codeSnippet, language, limit = 10) {
        // Generate embedding for the code snippet
        const queryEmbedding = await this.embeddingManager.generateEmbedding(codeSnippet);
        // Search for similar code using vector similarity
        const indexName = `${this.CODE_PREFIX}:${language}:index`;
        try {
            const results = await this.redis.call('FT.SEARCH', indexName, `*=>[KNN ${limit} @embeddings $query_vec AS score]`, 'PARAMS', '2', 'query_vec', Buffer.from(new Float32Array(queryEmbedding).buffer), 'SORTBY', 'score', 'RETURN', '8', 'content', 'path', 'function_name', 'class_name', 'start_line', 'end_line', 'complexity', 'score', 'DIALECT', '2');
            const similarityResults = [];
            for (let i = 1; i < results.length; i += 2) {
                const fields = results[i + 1];
                const fieldsObj = {};
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
        }
        catch (error) {
            logger_1.logger.error(`Similar code search failed: ${error.message}`);
            return [];
        }
    }
    async detectCodeSmells(codeFile) {
        const codeSmells = [];
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
    async generateCodeSuggestions(codeFile, analysisResult) {
        const suggestions = [];
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
    async parseCodeStructure(codeFile) {
        // This is a simplified parser - in a real implementation, you'd use
        // language-specific parsers like TypeScript compiler API, Babel, etc.
        const lines = codeFile.content.split('\n');
        const functions = [];
        const classes = [];
        const variables = [];
        const comments = [];
        const imports = [];
        const exports = [];
        let complexity = 0;
        let currentClass = null;
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
    async calculateCodeMetrics(codeFile, metadata) {
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
    async detectPatterns(codeFile, metadata) {
        const patterns = [];
        // Detect design patterns
        patterns.push(...await this.detectDesignPatterns(codeFile, metadata));
        // Detect anti-patterns
        patterns.push(...await this.detectAntiPatterns(codeFile, metadata));
        // Detect code smells
        patterns.push(...await this.detectCodeSmells(codeFile));
        return patterns;
    }
    async generateSuggestions(codeFile, metadata, patterns) {
        const suggestions = [];
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
    async analyzeDependencies(codeFile, metadata) {
        const dependencies = [];
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
    async calculateQualityScores(metrics, patterns, suggestions) {
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
    async storeAnalysisResult(result) {
        const key = `${this.ANALYSIS_PREFIX}:${result.fileId}`;
        await this.redis.hset(key, 'data', JSON.stringify(result), 'timestamp', result.analysisDate.toISOString());
    }
    async generateCodeEmbeddings(codeFile, metadata) {
        // Generate embeddings for functions
        for (const func of metadata.functions) {
            const embedding = await this.embeddingManager.generateEmbedding(func.signature + ' ' + func.documentation);
            func.embeddings = embedding;
            // Store in vector index
            await this.redis.hset(`${this.CODE_PREFIX}:${codeFile.language}:${func.id}`, 'content', func.signature, 'path', codeFile.path, 'function_name', func.name, 'start_line', func.startLine.toString(), 'end_line', func.endLine.toString(), 'complexity', func.complexity.toString(), 'embeddings', Buffer.from(new Float32Array(embedding).buffer));
        }
        // Generate embeddings for classes
        for (const cls of metadata.classes) {
            const classContent = `class ${cls.name} ${cls.documentation}`;
            const embedding = await this.embeddingManager.generateEmbedding(classContent);
            cls.embeddings = embedding;
            // Store in vector index
            await this.redis.hset(`${this.CODE_PREFIX}:${codeFile.language}:${cls.id}`, 'content', classContent, 'path', codeFile.path, 'class_name', cls.name, 'start_line', cls.startLine.toString(), 'end_line', cls.endLine.toString(), 'embeddings', Buffer.from(new Float32Array(embedding).buffer));
        }
    }
    // Helper methods
    calculateFunctionComplexity(lines, startIndex) {
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
    findFunctionEnd(lines, startIndex) {
        let braceCount = 0;
        let inFunction = false;
        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i];
            for (const char of line) {
                if (char === '{') {
                    braceCount++;
                    inFunction = true;
                }
                else if (char === '}') {
                    braceCount--;
                    if (inFunction && braceCount === 0) {
                        return i + 1;
                    }
                }
            }
        }
        return lines.length;
    }
    findClassEnd(lines, startIndex) {
        return this.findFunctionEnd(lines, startIndex); // Similar logic
    }
    parseParameters(signature) {
        const paramMatch = signature.match(/\(([^)]*)\)/);
        if (!paramMatch)
            return [];
        const paramString = paramMatch[1];
        if (!paramString.trim())
            return [];
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
    parseExtends(line) {
        const match = line.match(/extends\s+(\w+)/);
        return match ? [match[1]] : [];
    }
    parseImplements(line) {
        const match = line.match(/implements\s+([\w,\s]+)/);
        return match ? match[1].split(',').map(s => s.trim()) : [];
    }
    extractDocumentation(lines, index) {
        let doc = '';
        for (let i = index - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith('/**') || line.startsWith('*') || line.startsWith('*/')) {
                doc = line + '\n' + doc;
            }
            else if (line.startsWith('//')) {
                doc = line + '\n' + doc;
            }
            else if (line.length > 0) {
                break;
            }
        }
        return doc.trim();
    }
    determineScope(lines, index, currentClass) {
        if (currentClass)
            return VariableScope.CLASS;
        // Simple scope detection - would need more sophisticated parsing
        for (let i = index - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.includes('function ') || line.includes('=> ')) {
                return VariableScope.FUNCTION;
            }
        }
        return VariableScope.GLOBAL;
    }
    determineCommentType(line) {
        if (line.includes('TODO'))
            return CommentType.TODO;
        if (line.includes('FIXME'))
            return CommentType.FIXME;
        if (line.startsWith('/**'))
            return CommentType.DOCUMENTATION;
        if (line.startsWith('/*'))
            return CommentType.MULTI_LINE;
        return CommentType.SINGLE_LINE;
    }
    findAssociatedCode(lines, commentIndex) {
        for (let i = commentIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.length > 0 && !line.startsWith('//') && !line.startsWith('*')) {
                return line;
            }
        }
        return '';
    }
    calculateMaintainabilityIndex(metadata) {
        // Simplified maintainability index calculation
        const volume = metadata.linesOfCode * Math.log2(metadata.functions.length + metadata.classes.length + 1);
        const complexity = metadata.complexity;
        const linesOfCode = metadata.linesOfCode;
        return Math.max(0, (171 - 5.2 * Math.log(volume) - 0.23 * complexity - 16.2 * Math.log(linesOfCode)) / 171);
    }
    calculateTechnicalDebt(metadata) {
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
    async countDuplicateLines(codeFile) {
        // Simplified duplicate detection
        const lines = codeFile.content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        const lineCount = new Map();
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
    async detectDesignPatterns(codeFile, metadata) {
        // Simplified design pattern detection
        const patterns = [];
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
    async detectAntiPatterns(codeFile, metadata) {
        const patterns = [];
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
    async findDuplicateCode(codeFile) {
        // Simplified duplicate code detection
        return [];
    }
    mapSeverityToPriority(severity) {
        switch (severity) {
            case PatternSeverity.CRITICAL: return SuggestionPriority.CRITICAL;
            case PatternSeverity.ERROR: return SuggestionPriority.HIGH;
            case PatternSeverity.WARNING: return SuggestionPriority.MEDIUM;
            case PatternSeverity.INFO: return SuggestionPriority.LOW;
            default: return SuggestionPriority.LOW;
        }
    }
    // ID generation methods
    generateFunctionId(fileId, functionName) {
        return `func_${fileId}_${functionName}_${Date.now()}`;
    }
    generateClassId(fileId, className) {
        return `class_${fileId}_${className}_${Date.now()}`;
    }
    generateVariableId(fileId, variableName) {
        return `var_${fileId}_${variableName}_${Date.now()}`;
    }
    generateCommentId(fileId, line) {
        return `comment_${fileId}_${line}_${Date.now()}`;
    }
    generateSuggestionId() {
        return `suggestion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateDependencyId(name) {
        return `dep_${name}_${Date.now()}`;
    }
}
exports.CodeAnalyzer = CodeAnalyzer;
//# sourceMappingURL=code-analyzer.js.map