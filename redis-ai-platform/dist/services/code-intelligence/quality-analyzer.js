"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConditionOperator = exports.QualityAnalyzer = exports.InsightSignificance = exports.ComparisonType = exports.TrendSignificance = exports.TrendDirection = exports.TrendPeriod = exports.ResourceType = exports.RecommendationPriority = exports.RecommendationType = exports.DebtCategory = exports.DebtUnit = exports.EffortComplexity = exports.IssueCategory = exports.IssueSeverity = exports.IssueType = exports.FactorImpact = exports.QualityGrade = void 0;
const logger_1 = require("../../utils/logger");
const code_analyzer_1 = require("./code-analyzer");
var QualityGrade;
(function (QualityGrade) {
    QualityGrade["A"] = "A";
    QualityGrade["B"] = "B";
    QualityGrade["C"] = "C";
    QualityGrade["D"] = "D";
    QualityGrade["F"] = "F";
})(QualityGrade || (exports.QualityGrade = QualityGrade = {}));
var FactorImpact;
(function (FactorImpact) {
    FactorImpact["POSITIVE"] = "positive";
    FactorImpact["NEGATIVE"] = "negative";
    FactorImpact["NEUTRAL"] = "neutral";
})(FactorImpact || (exports.FactorImpact = FactorImpact = {}));
var IssueType;
(function (IssueType) {
    IssueType["BUG"] = "bug";
    IssueType["VULNERABILITY"] = "vulnerability";
    IssueType["CODE_SMELL"] = "code_smell";
    IssueType["SECURITY_HOTSPOT"] = "security_hotspot";
    IssueType["MAINTAINABILITY"] = "maintainability";
    IssueType["RELIABILITY"] = "reliability";
    IssueType["PERFORMANCE"] = "performance";
})(IssueType || (exports.IssueType = IssueType = {}));
var IssueSeverity;
(function (IssueSeverity) {
    IssueSeverity["BLOCKER"] = "blocker";
    IssueSeverity["CRITICAL"] = "critical";
    IssueSeverity["MAJOR"] = "major";
    IssueSeverity["MINOR"] = "minor";
    IssueSeverity["INFO"] = "info";
})(IssueSeverity || (exports.IssueSeverity = IssueSeverity = {}));
var IssueCategory;
(function (IssueCategory) {
    IssueCategory["DESIGN"] = "design";
    IssueCategory["LOGIC"] = "logic";
    IssueCategory["STYLE"] = "style";
    IssueCategory["SECURITY"] = "security";
    IssueCategory["PERFORMANCE"] = "performance";
    IssueCategory["DOCUMENTATION"] = "documentation";
    IssueCategory["TESTING"] = "testing";
})(IssueCategory || (exports.IssueCategory = IssueCategory = {}));
var EffortComplexity;
(function (EffortComplexity) {
    EffortComplexity["TRIVIAL"] = "trivial";
    EffortComplexity["EASY"] = "easy";
    EffortComplexity["MEDIUM"] = "medium";
    EffortComplexity["HARD"] = "hard";
    EffortComplexity["COMPLEX"] = "complex";
})(EffortComplexity || (exports.EffortComplexity = EffortComplexity = {}));
var DebtUnit;
(function (DebtUnit) {
    DebtUnit["MINUTES"] = "minutes";
    DebtUnit["HOURS"] = "hours";
    DebtUnit["DAYS"] = "days";
})(DebtUnit || (exports.DebtUnit = DebtUnit = {}));
var DebtCategory;
(function (DebtCategory) {
    DebtCategory["MAINTAINABILITY"] = "maintainability";
    DebtCategory["RELIABILITY"] = "reliability";
    DebtCategory["SECURITY"] = "security";
    DebtCategory["PERFORMANCE"] = "performance";
})(DebtCategory || (exports.DebtCategory = DebtCategory = {}));
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["REFACTOR"] = "refactor";
    RecommendationType["OPTIMIZE"] = "optimize";
    RecommendationType["SECURE"] = "secure";
    RecommendationType["TEST"] = "test";
    RecommendationType["DOCUMENT"] = "document";
    RecommendationType["UPGRADE"] = "upgrade";
    RecommendationType["REMOVE"] = "remove";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
var RecommendationPriority;
(function (RecommendationPriority) {
    RecommendationPriority["CRITICAL"] = "critical";
    RecommendationPriority["HIGH"] = "high";
    RecommendationPriority["MEDIUM"] = "medium";
    RecommendationPriority["LOW"] = "low";
})(RecommendationPriority || (exports.RecommendationPriority = RecommendationPriority = {}));
var ResourceType;
(function (ResourceType) {
    ResourceType["DOCUMENTATION"] = "documentation";
    ResourceType["TUTORIAL"] = "tutorial";
    ResourceType["TOOL"] = "tool";
    ResourceType["LIBRARY"] = "library";
    ResourceType["BEST_PRACTICE"] = "best_practice";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var TrendPeriod;
(function (TrendPeriod) {
    TrendPeriod["DAILY"] = "daily";
    TrendPeriod["WEEKLY"] = "weekly";
    TrendPeriod["MONTHLY"] = "monthly";
    TrendPeriod["QUARTERLY"] = "quarterly";
})(TrendPeriod || (exports.TrendPeriod = TrendPeriod = {}));
var TrendDirection;
(function (TrendDirection) {
    TrendDirection["IMPROVING"] = "improving";
    TrendDirection["DECLINING"] = "declining";
    TrendDirection["STABLE"] = "stable";
    TrendDirection["VOLATILE"] = "volatile";
})(TrendDirection || (exports.TrendDirection = TrendDirection = {}));
var TrendSignificance;
(function (TrendSignificance) {
    TrendSignificance["SIGNIFICANT"] = "significant";
    TrendSignificance["MODERATE"] = "moderate";
    TrendSignificance["MINOR"] = "minor";
    TrendSignificance["NEGLIGIBLE"] = "negligible";
})(TrendSignificance || (exports.TrendSignificance = TrendSignificance = {}));
var ComparisonType;
(function (ComparisonType) {
    ComparisonType["HISTORICAL"] = "historical";
    ComparisonType["PEER"] = "peer";
    ComparisonType["INDUSTRY"] = "industry";
    ComparisonType["TARGET"] = "target";
})(ComparisonType || (exports.ComparisonType = ComparisonType = {}));
var InsightSignificance;
(function (InsightSignificance) {
    InsightSignificance["CRITICAL"] = "critical";
    InsightSignificance["IMPORTANT"] = "important";
    InsightSignificance["NOTABLE"] = "notable";
    InsightSignificance["MINOR"] = "minor";
})(InsightSignificance || (exports.InsightSignificance = InsightSignificance = {}));
class QualityAnalyzer {
    redis;
    codeAnalyzer;
    QUALITY_PREFIX = 'quality';
    REPORT_PREFIX = 'quality_report';
    TREND_PREFIX = 'quality_trend';
    constructor(redis, codeAnalyzer) {
        this.redis = redis;
        this.codeAnalyzer = codeAnalyzer;
    }
    async analyzeProjectQuality(projectId, files) {
        logger_1.logger.info(`Analyzing quality for project: ${projectId}`);
        // Analyze each file
        const fileAnalyses = [];
        for (const file of files) {
            const analysis = await this.codeAnalyzer.analyzeCodeFile(file);
            fileAnalyses.push(analysis);
        }
        // Calculate overall metrics
        const metrics = await this.calculateQualityMetrics(fileAnalyses);
        // Identify issues
        const issues = await this.identifyQualityIssues(fileAnalyses);
        // Generate recommendations
        const recommendations = await this.generateRecommendations(metrics, issues);
        // Calculate trends
        const trends = await this.calculateQualityTrends(projectId, metrics);
        // Generate comparisons
        const comparisons = await this.generateQualityComparisons(projectId, metrics);
        // Calculate overall score
        const overallScore = this.calculateOverallScore(metrics);
        const report = {
            id: this.generateReportId(),
            projectId,
            generatedAt: new Date(),
            overallScore,
            metrics,
            issues,
            recommendations,
            trends,
            comparisons
        };
        // Store report
        await this.storeQualityReport(report);
        // Update trends
        await this.updateQualityTrends(projectId, metrics);
        logger_1.logger.info(`Quality analysis completed for project: ${projectId}`);
        return report;
    }
    async getQualityGate(projectId, gateConfig) {
        const report = await this.getLatestQualityReport(projectId);
        if (!report) {
            throw new Error(`No quality report found for project: ${projectId}`);
        }
        const conditions = await this.evaluateQualityConditions(report, gateConfig);
        const passed = conditions.every(c => c.passed);
        return {
            projectId,
            gateName: gateConfig.name,
            passed,
            conditions,
            overallScore: report.overallScore,
            evaluatedAt: new Date()
        };
    }
    async compareQuality(projectId, baselineDate, targetDate) {
        const baseline = await this.getQualityReportByDate(projectId, baselineDate);
        const target = await this.getQualityReportByDate(projectId, targetDate);
        if (!baseline || !target) {
            throw new Error('Quality reports not found for comparison dates');
        }
        const delta = this.calculateQualityDelta(baseline.metrics, target.metrics);
        const insights = this.generateComparisonInsights(baseline.metrics, target.metrics, delta);
        return {
            type: ComparisonType.HISTORICAL,
            baseline: {
                name: 'Baseline',
                date: baselineDate,
                metrics: baseline.metrics,
                context: 'Historical baseline'
            },
            current: {
                date: targetDate,
                metrics: target.metrics
            },
            delta,
            insights
        };
    }
    async calculateQualityMetrics(analyses) {
        // Aggregate metrics from all file analyses
        const totalFiles = analyses.length;
        const totalLines = analyses.reduce((sum, a) => sum + a.metrics.linesOfCode, 0);
        const totalComplexity = analyses.reduce((sum, a) => sum + a.metrics.cyclomaticComplexity, 0);
        const totalFunctions = analyses.reduce((sum, a) => sum + a.metrics.functionCount, 0);
        const totalClasses = analyses.reduce((sum, a) => sum + a.metrics.classCount, 0);
        // Calculate maintainability
        const maintainability = this.calculateMaintainabilityMetric(analyses);
        // Calculate reliability
        const reliability = this.calculateReliabilityMetric(analyses);
        // Calculate security
        const security = this.calculateSecurityMetric(analyses);
        // Calculate performance
        const performance = this.calculatePerformanceMetric(analyses);
        // Calculate testability
        const testability = this.calculateTestabilityMetric(analyses);
        // Calculate readability
        const readability = this.calculateReadabilityMetric(analyses);
        // Calculate complexity metrics
        const complexity = {
            cyclomaticComplexity: totalComplexity / Math.max(totalFiles, 1),
            cognitiveComplexity: this.calculateCognitiveComplexity(analyses),
            nestingDepth: this.calculateAverageNestingDepth(analyses),
            functionLength: totalLines / Math.max(totalFunctions, 1),
            classSize: totalLines / Math.max(totalClasses, 1),
            parameterCount: this.calculateAverageParameterCount(analyses)
        };
        // Calculate coverage metrics (would integrate with test coverage tools)
        const coverage = {
            linesCovered: 0,
            totalLines,
            percentage: 0,
            branchesCovered: 0,
            totalBranches: 0,
            branchPercentage: 0,
            functionsCovered: 0,
            totalFunctions,
            functionPercentage: 0
        };
        // Calculate duplication metrics
        const duplication = {
            duplicatedLines: analyses.reduce((sum, a) => sum + a.metrics.duplicateLines, 0),
            totalLines,
            percentage: 0,
            duplicatedBlocks: 0,
            duplicatedFiles: 0
        };
        duplication.percentage = (duplication.duplicatedLines / totalLines) * 100;
        // Calculate documentation metrics
        const documentation = {
            documentedFunctions: 0,
            totalFunctions,
            percentage: 0,
            documentedClasses: 0,
            totalClasses,
            classPercentage: 0,
            commentDensity: this.calculateCommentDensity(analyses)
        };
        return {
            maintainability,
            reliability,
            security,
            performance,
            testability,
            readability,
            complexity,
            coverage,
            duplication,
            documentation
        };
    }
    calculateMaintainabilityMetric(analyses) {
        const scores = analyses.map(a => a.quality.maintainability);
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const factors = [
            {
                name: 'Code Complexity',
                value: this.calculateAverageComplexity(analyses),
                weight: 0.3,
                impact: FactorImpact.NEGATIVE
            },
            {
                name: 'Code Duplication',
                value: this.calculateDuplicationRatio(analyses),
                weight: 0.2,
                impact: FactorImpact.NEGATIVE
            },
            {
                name: 'Documentation Coverage',
                value: this.calculateDocumentationCoverage(analyses),
                weight: 0.2,
                impact: FactorImpact.POSITIVE
            },
            {
                name: 'Code Size',
                value: this.calculateAverageFileSize(analyses),
                weight: 0.15,
                impact: FactorImpact.NEGATIVE
            },
            {
                name: 'Code Smells',
                value: this.calculateCodeSmellDensity(analyses),
                weight: 0.15,
                impact: FactorImpact.NEGATIVE
            }
        ];
        return {
            score: averageScore,
            grade: this.scoreToGrade(averageScore),
            description: 'Measures how easy it is to maintain and modify the code',
            factors,
            threshold: {
                excellent: 0.9,
                good: 0.8,
                acceptable: 0.6,
                poor: 0.4
            }
        };
    }
    calculateReliabilityMetric(analyses) {
        const scores = analyses.map(a => a.quality.reliability);
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const factors = [
            {
                name: 'Bug Density',
                value: this.calculateBugDensity(analyses),
                weight: 0.4,
                impact: FactorImpact.NEGATIVE
            },
            {
                name: 'Test Coverage',
                value: 0, // Would integrate with test coverage tools
                weight: 0.3,
                impact: FactorImpact.POSITIVE
            },
            {
                name: 'Error Handling',
                value: this.calculateErrorHandlingCoverage(analyses),
                weight: 0.2,
                impact: FactorImpact.POSITIVE
            },
            {
                name: 'Code Complexity',
                value: this.calculateAverageComplexity(analyses),
                weight: 0.1,
                impact: FactorImpact.NEGATIVE
            }
        ];
        return {
            score: averageScore,
            grade: this.scoreToGrade(averageScore),
            description: 'Measures the likelihood of code working correctly under various conditions',
            factors,
            threshold: {
                excellent: 0.95,
                good: 0.85,
                acceptable: 0.7,
                poor: 0.5
            }
        };
    }
    calculateSecurityMetric(analyses) {
        const scores = analyses.map(a => a.quality.security);
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const factors = [
            {
                name: 'Security Vulnerabilities',
                value: this.calculateSecurityVulnerabilityCount(analyses),
                weight: 0.5,
                impact: FactorImpact.NEGATIVE
            },
            {
                name: 'Input Validation',
                value: this.calculateInputValidationCoverage(analyses),
                weight: 0.2,
                impact: FactorImpact.POSITIVE
            },
            {
                name: 'Authentication Usage',
                value: this.calculateAuthenticationUsage(analyses),
                weight: 0.15,
                impact: FactorImpact.POSITIVE
            },
            {
                name: 'Encryption Usage',
                value: this.calculateEncryptionUsage(analyses),
                weight: 0.15,
                impact: FactorImpact.POSITIVE
            }
        ];
        return {
            score: averageScore,
            grade: this.scoreToGrade(averageScore),
            description: 'Measures the security posture of the codebase',
            factors,
            threshold: {
                excellent: 0.95,
                good: 0.85,
                acceptable: 0.7,
                poor: 0.5
            }
        };
    }
    calculatePerformanceMetric(analyses) {
        const scores = analyses.map(a => a.quality.performance);
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const factors = [
            {
                name: 'Algorithmic Complexity',
                value: this.calculateAlgorithmicComplexity(analyses),
                weight: 0.3,
                impact: FactorImpact.NEGATIVE
            },
            {
                name: 'Memory Usage Patterns',
                value: this.calculateMemoryUsagePatterns(analyses),
                weight: 0.25,
                impact: FactorImpact.NEGATIVE
            },
            {
                name: 'I/O Operations',
                value: this.calculateIOOperationEfficiency(analyses),
                weight: 0.2,
                impact: FactorImpact.NEGATIVE
            },
            {
                name: 'Caching Usage',
                value: this.calculateCachingUsage(analyses),
                weight: 0.15,
                impact: FactorImpact.POSITIVE
            },
            {
                name: 'Resource Management',
                value: this.calculateResourceManagement(analyses),
                weight: 0.1,
                impact: FactorImpact.POSITIVE
            }
        ];
        return {
            score: averageScore,
            grade: this.scoreToGrade(averageScore),
            description: 'Measures the efficiency and performance characteristics of the code',
            factors,
            threshold: {
                excellent: 0.9,
                good: 0.8,
                acceptable: 0.6,
                poor: 0.4
            }
        };
    }
    calculateTestabilityMetric(analyses) {
        const scores = analyses.map(a => a.quality.testability);
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const factors = [
            {
                name: 'Cyclomatic Complexity',
                value: this.calculateAverageComplexity(analyses),
                weight: 0.3,
                impact: FactorImpact.NEGATIVE
            },
            {
                name: 'Dependency Coupling',
                value: this.calculateDependencyCoupling(analyses),
                weight: 0.25,
                impact: FactorImpact.NEGATIVE
            },
            {
                name: 'Method Length',
                value: this.calculateAverageMethodLength(analyses),
                weight: 0.2,
                impact: FactorImpact.NEGATIVE
            },
            {
                name: 'Dependency Injection',
                value: this.calculateDependencyInjectionUsage(analyses),
                weight: 0.15,
                impact: FactorImpact.POSITIVE
            },
            {
                name: 'Pure Functions',
                value: this.calculatePureFunctionRatio(analyses),
                weight: 0.1,
                impact: FactorImpact.POSITIVE
            }
        ];
        return {
            score: averageScore,
            grade: this.scoreToGrade(averageScore),
            description: 'Measures how easy it is to write effective tests for the code',
            factors,
            threshold: {
                excellent: 0.9,
                good: 0.8,
                acceptable: 0.6,
                poor: 0.4
            }
        };
    }
    calculateReadabilityMetric(analyses) {
        const scores = analyses.map(a => a.quality.readability);
        const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const factors = [
            {
                name: 'Naming Quality',
                value: this.calculateNamingQuality(analyses),
                weight: 0.3,
                impact: FactorImpact.POSITIVE
            },
            {
                name: 'Comment Quality',
                value: this.calculateCommentQuality(analyses),
                weight: 0.25,
                impact: FactorImpact.POSITIVE
            },
            {
                name: 'Code Formatting',
                value: this.calculateFormattingConsistency(analyses),
                weight: 0.2,
                impact: FactorImpact.POSITIVE
            },
            {
                name: 'Function Length',
                value: this.calculateAverageFunctionLength(analyses),
                weight: 0.15,
                impact: FactorImpact.NEGATIVE
            },
            {
                name: 'Nesting Depth',
                value: this.calculateAverageNestingDepth(analyses),
                weight: 0.1,
                impact: FactorImpact.NEGATIVE
            }
        ];
        return {
            score: averageScore,
            grade: this.scoreToGrade(averageScore),
            description: 'Measures how easy it is to read and understand the code',
            factors,
            threshold: {
                excellent: 0.9,
                good: 0.8,
                acceptable: 0.6,
                poor: 0.4
            }
        };
    }
    async identifyQualityIssues(analyses) {
        const issues = [];
        for (const analysis of analyses) {
            // Convert detected patterns to quality issues
            for (const pattern of analysis.patterns) {
                issues.push({
                    id: this.generateIssueId(),
                    type: this.mapPatternToIssueType(pattern.category),
                    severity: this.mapPatternSeverityToIssueSeverity(pattern.severity),
                    category: this.mapPatternToIssueCategory(pattern.category),
                    title: pattern.name,
                    description: pattern.description,
                    location: {
                        file: pattern.location.file,
                        startLine: pattern.location.startLine,
                        endLine: pattern.location.endLine,
                        startColumn: pattern.location.startColumn,
                        endColumn: pattern.location.endColumn
                    },
                    rule: pattern.patternId,
                    effort: this.estimateFixEffort(pattern),
                    debt: this.calculateTechnicalDebt(pattern),
                    tags: [pattern.category.toLowerCase()]
                });
            }
            // Add metric-based issues
            if (analysis.metrics.cyclomaticComplexity > 20) {
                issues.push({
                    id: this.generateIssueId(),
                    type: IssueType.CODE_SMELL,
                    severity: IssueSeverity.MAJOR,
                    category: IssueCategory.DESIGN,
                    title: 'High Cyclomatic Complexity',
                    description: `File has high cyclomatic complexity (${analysis.metrics.cyclomaticComplexity})`,
                    location: {
                        file: analysis.fileId,
                        startLine: 1,
                        endLine: analysis.metrics.linesOfCode,
                        startColumn: 0,
                        endColumn: 0
                    },
                    rule: 'complexity-threshold',
                    effort: {
                        minutes: 120,
                        hours: 2,
                        days: 0.25,
                        complexity: EffortComplexity.MEDIUM
                    },
                    debt: {
                        amount: 2,
                        unit: DebtUnit.HOURS,
                        ratio: 0.1,
                        category: DebtCategory.MAINTAINABILITY
                    },
                    tags: ['complexity', 'maintainability']
                });
            }
        }
        return issues;
    }
    async generateRecommendations(metrics, issues) {
        const recommendations = [];
        // Generate recommendations based on metrics
        if (metrics.maintainability.score < 0.7) {
            recommendations.push({
                id: this.generateRecommendationId(),
                type: RecommendationType.REFACTOR,
                priority: RecommendationPriority.HIGH,
                title: 'Improve Code Maintainability',
                description: 'The codebase has low maintainability scores that should be addressed',
                rationale: 'Low maintainability leads to increased development time and higher bug rates',
                impact: {
                    qualityImprovement: 0.2,
                    maintainabilityGain: 0.3,
                    performanceGain: 0.05,
                    securityGain: 0.1,
                    riskReduction: 0.25
                },
                effort: {
                    minutes: 480,
                    hours: 8,
                    days: 1,
                    complexity: EffortComplexity.MEDIUM
                },
                steps: [
                    {
                        order: 1,
                        description: 'Identify and refactor complex methods',
                        automated: false,
                        toolSupport: true
                    },
                    {
                        order: 2,
                        description: 'Extract common functionality into utilities',
                        automated: false,
                        toolSupport: true
                    },
                    {
                        order: 3,
                        description: 'Improve naming conventions',
                        automated: true,
                        toolSupport: true
                    }
                ],
                resources: [
                    {
                        type: ResourceType.BEST_PRACTICE,
                        title: 'Clean Code Principles',
                        description: 'Guidelines for writing maintainable code'
                    },
                    {
                        type: ResourceType.TOOL,
                        title: 'Code Analysis Tools',
                        description: 'Tools to help identify maintainability issues'
                    }
                ]
            });
        }
        // Generate recommendations based on issues
        const criticalIssues = issues.filter(i => i.severity === IssueSeverity.CRITICAL || i.severity === IssueSeverity.BLOCKER);
        if (criticalIssues.length > 0) {
            recommendations.push({
                id: this.generateRecommendationId(),
                type: RecommendationType.SECURE,
                priority: RecommendationPriority.CRITICAL,
                title: 'Address Critical Issues',
                description: `${criticalIssues.length} critical issues need immediate attention`,
                rationale: 'Critical issues can lead to system failures or security breaches',
                impact: {
                    qualityImprovement: 0.3,
                    maintainabilityGain: 0.2,
                    performanceGain: 0.1,
                    securityGain: 0.4,
                    riskReduction: 0.5
                },
                effort: {
                    minutes: 240,
                    hours: 4,
                    days: 0.5,
                    complexity: EffortComplexity.HARD
                },
                steps: [
                    {
                        order: 1,
                        description: 'Review and prioritize critical issues',
                        automated: false,
                        toolSupport: true
                    },
                    {
                        order: 2,
                        description: 'Fix security vulnerabilities first',
                        automated: false,
                        toolSupport: false
                    },
                    {
                        order: 3,
                        description: 'Address reliability issues',
                        automated: false,
                        toolSupport: true
                    }
                ],
                resources: [
                    {
                        type: ResourceType.DOCUMENTATION,
                        title: 'Security Best Practices',
                        description: 'Guidelines for secure coding practices'
                    }
                ]
            });
        }
        return recommendations;
    }
    async calculateQualityTrends(projectId, currentMetrics) {
        // Get historical data
        const historicalData = await this.getHistoricalQualityData(projectId, 30); // Last 30 days
        const trends = [];
        // Calculate trend for each metric
        const metricNames = ['maintainability', 'reliability', 'security', 'performance', 'testability', 'readability'];
        for (const metricName of metricNames) {
            const dataPoints = historicalData.map(data => ({
                date: data.date,
                value: data.metrics[metricName].score,
                context: 'Daily measurement'
            }));
            if (dataPoints.length > 1) {
                const trend = this.calculateTrendDirection(dataPoints);
                trends.push({
                    metric: metricName,
                    period: TrendPeriod.DAILY,
                    direction: trend.direction,
                    change: trend.change,
                    significance: trend.significance,
                    dataPoints
                });
            }
        }
        return trends;
    }
    async generateQualityComparisons(projectId, currentMetrics) {
        const comparisons = [];
        // Historical comparison (30 days ago)
        const historicalBaseline = await this.getQualityReportByDate(projectId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
        if (historicalBaseline) {
            const delta = this.calculateQualityDelta(historicalBaseline.metrics, currentMetrics);
            const insights = this.generateComparisonInsights(historicalBaseline.metrics, currentMetrics, delta);
            comparisons.push({
                type: ComparisonType.HISTORICAL,
                baseline: {
                    name: '30 Days Ago',
                    date: historicalBaseline.generatedAt,
                    metrics: historicalBaseline.metrics,
                    context: 'Historical baseline from 30 days ago'
                },
                current: {
                    date: new Date(),
                    metrics: currentMetrics
                },
                delta,
                insights
            });
        }
        return comparisons;
    }
    calculateOverallScore(metrics) {
        const weights = {
            maintainability: 0.25,
            reliability: 0.2,
            security: 0.2,
            performance: 0.15,
            testability: 0.1,
            readability: 0.1
        };
        return (metrics.maintainability.score * weights.maintainability +
            metrics.reliability.score * weights.reliability +
            metrics.security.score * weights.security +
            metrics.performance.score * weights.performance +
            metrics.testability.score * weights.testability +
            metrics.readability.score * weights.readability);
    }
    scoreToGrade(score) {
        if (score >= 0.9)
            return QualityGrade.A;
        if (score >= 0.8)
            return QualityGrade.B;
        if (score >= 0.6)
            return QualityGrade.C;
        if (score >= 0.4)
            return QualityGrade.D;
        return QualityGrade.F;
    }
    // Helper methods for metric calculations
    calculateAverageComplexity(analyses) {
        const totalComplexity = analyses.reduce((sum, a) => sum + a.metrics.cyclomaticComplexity, 0);
        return totalComplexity / Math.max(analyses.length, 1);
    }
    calculateDuplicationRatio(analyses) {
        const totalLines = analyses.reduce((sum, a) => sum + a.metrics.linesOfCode, 0);
        const duplicateLines = analyses.reduce((sum, a) => sum + a.metrics.duplicateLines, 0);
        return duplicateLines / Math.max(totalLines, 1);
    }
    calculateDocumentationCoverage(analyses) {
        // Simplified calculation - would need more sophisticated analysis
        return 0.5;
    }
    calculateAverageFileSize(analyses) {
        const totalLines = analyses.reduce((sum, a) => sum + a.metrics.linesOfCode, 0);
        return totalLines / Math.max(analyses.length, 1);
    }
    calculateCodeSmellDensity(analyses) {
        const totalLines = analyses.reduce((sum, a) => sum + a.metrics.linesOfCode, 0);
        const codeSmells = analyses.reduce((sum, a) => sum + a.patterns.filter(p => p.category === code_analyzer_1.PatternCategory.CODE_SMELL).length, 0);
        return codeSmells / Math.max(totalLines / 1000, 1); // Per 1000 lines
    }
    // Additional helper methods would be implemented here...
    calculateBugDensity(analyses) { return 0; }
    calculateErrorHandlingCoverage(analyses) { return 0; }
    calculateSecurityVulnerabilityCount(analyses) { return 0; }
    calculateInputValidationCoverage(analyses) { return 0; }
    calculateAuthenticationUsage(analyses) { return 0; }
    calculateEncryptionUsage(analyses) { return 0; }
    calculateAlgorithmicComplexity(analyses) { return 0; }
    calculateMemoryUsagePatterns(analyses) { return 0; }
    calculateIOOperationEfficiency(analyses) { return 0; }
    calculateCachingUsage(analyses) { return 0; }
    calculateResourceManagement(analyses) { return 0; }
    calculateDependencyCoupling(analyses) { return 0; }
    calculateAverageMethodLength(analyses) { return 0; }
    calculateDependencyInjectionUsage(analyses) { return 0; }
    calculatePureFunctionRatio(analyses) { return 0; }
    calculateNamingQuality(analyses) { return 0; }
    calculateCommentQuality(analyses) { return 0; }
    calculateFormattingConsistency(analyses) { return 0; }
    calculateAverageFunctionLength(analyses) { return 0; }
    calculateAverageNestingDepth(analyses) { return 0; }
    calculateCognitiveComplexity(analyses) { return 0; }
    calculateAverageParameterCount(analyses) { return 0; }
    calculateCommentDensity(analyses) { return 0; }
    mapPatternToIssueType(category) {
        switch (category) {
            case code_analyzer_1.PatternCategory.SECURITY: return IssueType.VULNERABILITY;
            case code_analyzer_1.PatternCategory.CODE_SMELL: return IssueType.CODE_SMELL;
            case code_analyzer_1.PatternCategory.PERFORMANCE: return IssueType.PERFORMANCE;
            case code_analyzer_1.PatternCategory.ANTI_PATTERN: return IssueType.MAINTAINABILITY;
            default: return IssueType.CODE_SMELL;
        }
    }
    mapPatternSeverityToIssueSeverity(severity) {
        switch (severity) {
            case code_analyzer_1.PatternSeverity.CRITICAL: return IssueSeverity.CRITICAL;
            case code_analyzer_1.PatternSeverity.ERROR: return IssueSeverity.MAJOR;
            case code_analyzer_1.PatternSeverity.WARNING: return IssueSeverity.MINOR;
            case code_analyzer_1.PatternSeverity.INFO: return IssueSeverity.INFO;
            default: return IssueSeverity.MINOR;
        }
    }
    mapPatternToIssueCategory(category) {
        switch (category) {
            case code_analyzer_1.PatternCategory.SECURITY: return IssueCategory.SECURITY;
            case code_analyzer_1.PatternCategory.PERFORMANCE: return IssueCategory.PERFORMANCE;
            case code_analyzer_1.PatternCategory.DESIGN_PATTERN: return IssueCategory.DESIGN;
            case code_analyzer_1.PatternCategory.CODE_SMELL: return IssueCategory.STYLE;
            default: return IssueCategory.DESIGN;
        }
    }
    estimateFixEffort(pattern) {
        let minutes = 30; // Base effort
        switch (pattern.severity) {
            case code_analyzer_1.PatternSeverity.CRITICAL:
                minutes = 120;
                break;
            case code_analyzer_1.PatternSeverity.ERROR:
                minutes = 60;
                break;
            case code_analyzer_1.PatternSeverity.WARNING:
                minutes = 30;
                break;
            case code_analyzer_1.PatternSeverity.INFO:
                minutes = 15;
                break;
        }
        return {
            minutes,
            hours: minutes / 60,
            days: minutes / (60 * 8),
            complexity: minutes > 60 ? EffortComplexity.MEDIUM : EffortComplexity.EASY
        };
    }
    calculateTechnicalDebt(pattern) {
        const effort = this.estimateFixEffort(pattern);
        return {
            amount: effort.minutes,
            unit: DebtUnit.MINUTES,
            ratio: 0.1, // 10% of development time
            category: this.mapPatternToDebtCategory(pattern.category)
        };
    }
    mapPatternToDebtCategory(category) {
        switch (category) {
            case code_analyzer_1.PatternCategory.SECURITY: return DebtCategory.SECURITY;
            case code_analyzer_1.PatternCategory.PERFORMANCE: return DebtCategory.PERFORMANCE;
            case code_analyzer_1.PatternCategory.CODE_SMELL: return DebtCategory.MAINTAINABILITY;
            default: return DebtCategory.MAINTAINABILITY;
        }
    }
    calculateTrendDirection(dataPoints) {
        if (dataPoints.length < 2) {
            return { direction: TrendDirection.STABLE, change: 0, significance: TrendSignificance.NEGLIGIBLE };
        }
        const first = dataPoints[0].value;
        const last = dataPoints[dataPoints.length - 1].value;
        const change = last - first;
        const changePercent = Math.abs(change / first) * 100;
        let direction;
        if (Math.abs(change) < 0.01) {
            direction = TrendDirection.STABLE;
        }
        else if (change > 0) {
            direction = TrendDirection.IMPROVING;
        }
        else {
            direction = TrendDirection.DECLINING;
        }
        let significance;
        if (changePercent > 20) {
            significance = TrendSignificance.SIGNIFICANT;
        }
        else if (changePercent > 10) {
            significance = TrendSignificance.MODERATE;
        }
        else if (changePercent > 5) {
            significance = TrendSignificance.MINOR;
        }
        else {
            significance = TrendSignificance.NEGLIGIBLE;
        }
        return { direction, change, significance };
    }
    calculateQualityDelta(baseline, current) {
        return {
            overall: this.calculateOverallScore(current) - this.calculateOverallScore(baseline),
            maintainability: current.maintainability.score - baseline.maintainability.score,
            reliability: current.reliability.score - baseline.reliability.score,
            security: current.security.score - baseline.security.score,
            performance: current.performance.score - baseline.performance.score,
            testability: current.testability.score - baseline.testability.score,
            readability: current.readability.score - baseline.readability.score
        };
    }
    generateComparisonInsights(baseline, current, delta) {
        const insights = [];
        if (Math.abs(delta.maintainability) > 0.1) {
            insights.push({
                metric: 'maintainability',
                observation: `Maintainability ${delta.maintainability > 0 ? 'improved' : 'declined'} by ${Math.abs(delta.maintainability * 100).toFixed(1)}%`,
                significance: Math.abs(delta.maintainability) > 0.2 ? InsightSignificance.CRITICAL : InsightSignificance.IMPORTANT,
                recommendation: delta.maintainability < 0 ? 'Focus on reducing code complexity and improving documentation' : undefined
            });
        }
        if (Math.abs(delta.security) > 0.1) {
            insights.push({
                metric: 'security',
                observation: `Security score ${delta.security > 0 ? 'improved' : 'declined'} by ${Math.abs(delta.security * 100).toFixed(1)}%`,
                significance: InsightSignificance.CRITICAL,
                recommendation: delta.security < 0 ? 'Address security vulnerabilities immediately' : undefined
            });
        }
        return insights;
    }
    // Storage and retrieval methods
    async storeQualityReport(report) {
        const key = `${this.REPORT_PREFIX}:${report.projectId}:${report.id}`;
        await this.redis.hset(key, 'data', JSON.stringify(report), 'timestamp', report.generatedAt.toISOString());
        // Store latest report reference
        await this.redis.set(`${this.REPORT_PREFIX}:${report.projectId}:latest`, report.id);
    }
    async getLatestQualityReport(projectId) {
        const latestId = await this.redis.get(`${this.REPORT_PREFIX}:${projectId}:latest`);
        if (!latestId)
            return null;
        const data = await this.redis.hget(`${this.REPORT_PREFIX}:${projectId}:${latestId}`, 'data');
        return data ? JSON.parse(data) : null;
    }
    async getQualityReportByDate(projectId, date) {
        // Simplified - would need more sophisticated date-based lookup
        return this.getLatestQualityReport(projectId);
    }
    async getHistoricalQualityData(projectId, days) {
        // Simplified - would query historical data from Redis
        return [];
    }
    async updateQualityTrends(projectId, metrics) {
        const trendKey = `${this.TREND_PREFIX}:${projectId}`;
        const timestamp = Date.now();
        // Store trend data points
        await this.redis.zadd(trendKey, timestamp, JSON.stringify({
            timestamp,
            metrics
        }));
        // Keep only last 90 days
        const cutoff = timestamp - (90 * 24 * 60 * 60 * 1000);
        await this.redis.zremrangebyscore(trendKey, 0, cutoff);
    }
    async evaluateQualityConditions(report, gateConfig) {
        // Simplified quality gate evaluation
        return [];
    }
    // ID generation methods
    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateIssueId() {
        return `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateRecommendationId() {
        return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.QualityAnalyzer = QualityAnalyzer;
var ConditionOperator;
(function (ConditionOperator) {
    ConditionOperator["GREATER_THAN"] = "gt";
    ConditionOperator["LESS_THAN"] = "lt";
    ConditionOperator["EQUALS"] = "eq";
    ConditionOperator["NOT_EQUALS"] = "ne";
})(ConditionOperator || (exports.ConditionOperator = ConditionOperator = {}));
//# sourceMappingURL=quality-analyzer.js.map