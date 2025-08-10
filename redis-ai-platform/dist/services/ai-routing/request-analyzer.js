"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestAnalyzer = void 0;
exports.getRequestAnalyzer = getRequestAnalyzer;
exports.createRequestAnalyzer = createRequestAnalyzer;
const types_1 = require("@/types");
const logger_1 = __importDefault(require("@/utils/logger"));
class RequestAnalyzer {
    complexityPatterns = new Map();
    capabilityPatterns = new Map();
    urgencyPatterns = new Map();
    constructor() {
        this.initializePatterns();
    }
    analyzeRequest(request, context) {
        try {
            const content = request.content;
            const requestType = request.type;
            // Analyze content complexity
            const complexity = this.analyzeComplexity(content, requestType);
            // Estimate token count
            const estimatedTokens = this.estimateTokens(content, context);
            // Determine required capabilities
            const requiredCapabilities = this.determineCapabilities(content, requestType);
            // Analyze urgency
            const urgency = this.analyzeUrgency(request, context);
            // Calculate resource requirements
            const resourceRequirements = this.calculateResourceRequirements(complexity, estimatedTokens, requestType);
            // Determine context size
            const contextSize = this.calculateContextSize(context);
            // Estimate expected latency
            const expectedLatency = this.estimateLatency(complexity, estimatedTokens, requestType);
            // Determine quality requirements
            const qualityRequirements = this.analyzeQualityRequirements(request, context);
            // Get preferred models based on analysis
            const preferredModels = this.getPreferredModels(requestType, complexity, requiredCapabilities, context);
            const analysis = {
                complexity,
                estimatedTokens,
                requiredCapabilities,
                preferredModels,
                urgency,
                resourceRequirements,
                contextSize,
                expectedLatency,
                qualityRequirements,
            };
            logger_1.default.debug('Request analyzed', {
                requestId: request.id,
                requestType,
                analysis,
            });
            return analysis;
        }
        catch (error) {
            logger_1.default.error('Failed to analyze request', {
                requestId: request.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            // Return default analysis
            return this.getDefaultAnalysis();
        }
    }
    analyzeComplexity(content, requestType) {
        let complexityScore = 0;
        // Base complexity by request type
        const typeComplexity = {
            [types_1.AIRequestType.TEXT_GENERATION]: 2,
            [types_1.AIRequestType.CODE_GENERATION]: 3,
            [types_1.AIRequestType.IMAGE_ANALYSIS]: 3,
            [types_1.AIRequestType.AUDIO_TRANSCRIPTION]: 2,
            [types_1.AIRequestType.TRANSLATION]: 2,
            [types_1.AIRequestType.SUMMARIZATION]: 2,
            [types_1.AIRequestType.QUESTION_ANSWERING]: 2,
        };
        complexityScore += typeComplexity[requestType] || 2;
        // Content length factor
        const contentLength = content.length;
        if (contentLength > 5000)
            complexityScore += 2;
        else if (contentLength > 1000)
            complexityScore += 1;
        // Pattern-based complexity analysis
        for (const [pattern, score] of this.complexityPatterns) {
            if (pattern.test(content)) {
                complexityScore += score;
            }
        }
        // Technical terms and jargon
        const technicalTerms = [
            'algorithm', 'implementation', 'architecture', 'optimization',
            'performance', 'scalability', 'distributed', 'microservices',
            'machine learning', 'neural network', 'deep learning', 'ai',
        ];
        const technicalTermCount = technicalTerms.filter(term => content.toLowerCase().includes(term)).length;
        complexityScore += Math.min(technicalTermCount * 0.5, 2);
        // Determine final complexity level
        if (complexityScore >= 6)
            return 'high';
        if (complexityScore >= 3)
            return 'medium';
        return 'low';
    }
    estimateTokens(content, context) {
        // Basic token estimation (roughly 4 characters per token)
        let tokenCount = Math.ceil(content.length / 4);
        // Add context tokens
        if (context) {
            // Conversation history tokens
            const historyTokens = context.conversationHistory.reduce((total, message) => {
                return total + Math.ceil((message.content || '').length / 4);
            }, 0);
            // Limit context to reasonable size
            tokenCount += Math.min(historyTokens, 4000);
            // Previous requests context
            const previousRequestTokens = context.previousRequests.reduce((total, reqId) => {
                return total + 50; // Estimated tokens per previous request reference
            }, 0);
            tokenCount += previousRequestTokens;
        }
        // Add buffer for system prompts and formatting
        tokenCount += 200;
        return Math.min(tokenCount, 32000); // Cap at reasonable limit
    }
    determineCapabilities(content, requestType) {
        const capabilities = [];
        // Base capabilities by request type
        const typeCapabilities = {
            [types_1.AIRequestType.TEXT_GENERATION]: ['text-generation', 'creativity'],
            [types_1.AIRequestType.CODE_GENERATION]: ['code-generation', 'programming', 'syntax'],
            [types_1.AIRequestType.IMAGE_ANALYSIS]: ['vision', 'image-understanding'],
            [types_1.AIRequestType.AUDIO_TRANSCRIPTION]: ['audio-processing', 'speech-to-text'],
            [types_1.AIRequestType.TRANSLATION]: ['translation', 'multilingual'],
            [types_1.AIRequestType.SUMMARIZATION]: ['summarization', 'comprehension'],
            [types_1.AIRequestType.QUESTION_ANSWERING]: ['qa', 'reasoning', 'knowledge'],
        };
        capabilities.push(...(typeCapabilities[requestType] || []));
        // Pattern-based capability detection
        for (const [pattern, caps] of this.capabilityPatterns) {
            if (pattern.test(content)) {
                capabilities.push(...caps);
            }
        }
        // Language detection
        const languages = this.detectLanguages(content);
        if (languages.length > 1) {
            capabilities.push('multilingual');
        }
        // Code language detection
        const codeLanguages = this.detectCodeLanguages(content);
        capabilities.push(...codeLanguages.map(lang => `${lang}-programming`));
        // Domain-specific capabilities
        const domains = this.detectDomains(content);
        capabilities.push(...domains);
        return [...new Set(capabilities)]; // Remove duplicates
    }
    analyzeUrgency(request, context) {
        let urgencyScore = 0;
        // Check request metadata for priority
        if (request.metadata.priority === 'high')
            urgencyScore += 3;
        else if (request.metadata.priority === 'medium')
            urgencyScore += 1;
        // Check time constraints
        if (context?.timeConstraints) {
            if (context.timeConstraints.maxLatency < 1000)
                urgencyScore += 2;
            else if (context.timeConstraints.maxLatency < 5000)
                urgencyScore += 1;
            if (context.timeConstraints.deadline) {
                const timeToDeadline = context.timeConstraints.deadline.getTime() - Date.now();
                if (timeToDeadline < 60000)
                    urgencyScore += 3; // Less than 1 minute
                else if (timeToDeadline < 300000)
                    urgencyScore += 2; // Less than 5 minutes
                else if (timeToDeadline < 1800000)
                    urgencyScore += 1; // Less than 30 minutes
            }
        }
        // Pattern-based urgency detection
        for (const [pattern, score] of this.urgencyPatterns) {
            if (pattern.test(request.content)) {
                urgencyScore += score;
            }
        }
        // Request type urgency
        const typeUrgency = {
            [types_1.AIRequestType.QUESTION_ANSWERING]: 1,
            [types_1.AIRequestType.TRANSLATION]: 1,
            [types_1.AIRequestType.SUMMARIZATION]: 1,
            [types_1.AIRequestType.TEXT_GENERATION]: 0,
            [types_1.AIRequestType.CODE_GENERATION]: 0,
            [types_1.AIRequestType.IMAGE_ANALYSIS]: 0,
            [types_1.AIRequestType.AUDIO_TRANSCRIPTION]: 1,
        };
        urgencyScore += typeUrgency[request.type] || 0;
        if (urgencyScore >= 4)
            return 'high';
        if (urgencyScore >= 2)
            return 'medium';
        return 'low';
    }
    calculateResourceRequirements(complexity, estimatedTokens, requestType) {
        const baseRequirements = {
            low: { memory: 1, compute: 1, bandwidth: 1 },
            medium: { memory: 2, compute: 2, bandwidth: 1.5 },
            high: { memory: 4, compute: 4, bandwidth: 2 },
        };
        const base = baseRequirements[complexity];
        // Adjust based on token count
        const tokenMultiplier = Math.min(estimatedTokens / 1000, 10);
        // Adjust based on request type
        const typeMultipliers = {
            [types_1.AIRequestType.TEXT_GENERATION]: { memory: 1, compute: 1, bandwidth: 1 },
            [types_1.AIRequestType.CODE_GENERATION]: { memory: 1.2, compute: 1.5, bandwidth: 1 },
            [types_1.AIRequestType.IMAGE_ANALYSIS]: { memory: 2, compute: 2, bandwidth: 3 },
            [types_1.AIRequestType.AUDIO_TRANSCRIPTION]: { memory: 1.5, compute: 1.5, bandwidth: 4 },
            [types_1.AIRequestType.TRANSLATION]: { memory: 1, compute: 1, bandwidth: 1 },
            [types_1.AIRequestType.SUMMARIZATION]: { memory: 1, compute: 1.2, bandwidth: 1 },
            [types_1.AIRequestType.QUESTION_ANSWERING]: { memory: 1.5, compute: 1.3, bandwidth: 1 },
        };
        const typeMultiplier = typeMultipliers[requestType];
        return {
            memory: base.memory * tokenMultiplier * typeMultiplier.memory,
            compute: base.compute * tokenMultiplier * typeMultiplier.compute,
            bandwidth: base.bandwidth * tokenMultiplier * typeMultiplier.bandwidth,
        };
    }
    calculateContextSize(context) {
        if (!context)
            return 0;
        let contextSize = 0;
        // Conversation history
        contextSize += context.conversationHistory.length * 100; // Estimated size per message
        // Previous requests
        contextSize += context.previousRequests.length * 50;
        // User preferences
        if (context.userPreferences) {
            contextSize += JSON.stringify(context.userPreferences).length;
        }
        return contextSize;
    }
    estimateLatency(complexity, estimatedTokens, requestType) {
        const baseLatency = {
            low: 500,
            medium: 1500,
            high: 3000,
        };
        let latency = baseLatency[complexity];
        // Token-based latency adjustment
        latency += Math.min(estimatedTokens * 0.5, 2000);
        // Request type adjustment
        const typeLatency = {
            [types_1.AIRequestType.TEXT_GENERATION]: 1000,
            [types_1.AIRequestType.CODE_GENERATION]: 1500,
            [types_1.AIRequestType.IMAGE_ANALYSIS]: 2000,
            [types_1.AIRequestType.AUDIO_TRANSCRIPTION]: 3000,
            [types_1.AIRequestType.TRANSLATION]: 800,
            [types_1.AIRequestType.SUMMARIZATION]: 1200,
            [types_1.AIRequestType.QUESTION_ANSWERING]: 1000,
        };
        latency += typeLatency[requestType] || 1000;
        return Math.min(latency, 30000); // Cap at 30 seconds
    }
    analyzeQualityRequirements(request, context) {
        let accuracy = 0.7; // Default
        let creativity = 0.5; // Default
        let factuality = 0.8; // Default
        // Adjust based on request type
        const typeQuality = {
            [types_1.AIRequestType.TEXT_GENERATION]: { accuracy: 0.6, creativity: 0.8, factuality: 0.6 },
            [types_1.AIRequestType.CODE_GENERATION]: { accuracy: 0.9, creativity: 0.4, factuality: 0.9 },
            [types_1.AIRequestType.IMAGE_ANALYSIS]: { accuracy: 0.8, creativity: 0.3, factuality: 0.9 },
            [types_1.AIRequestType.AUDIO_TRANSCRIPTION]: { accuracy: 0.9, creativity: 0.1, factuality: 0.9 },
            [types_1.AIRequestType.TRANSLATION]: { accuracy: 0.9, creativity: 0.2, factuality: 0.9 },
            [types_1.AIRequestType.SUMMARIZATION]: { accuracy: 0.8, creativity: 0.3, factuality: 0.9 },
            [types_1.AIRequestType.QUESTION_ANSWERING]: { accuracy: 0.9, creativity: 0.2, factuality: 0.9 },
        };
        const typeReqs = typeQuality[request.type];
        if (typeReqs) {
            accuracy = typeReqs.accuracy;
            creativity = typeReqs.creativity;
            factuality = typeReqs.factuality;
        }
        // Adjust based on content patterns
        if (/creative|story|poem|fiction/i.test(request.content)) {
            creativity = Math.min(creativity + 0.3, 1.0);
            factuality = Math.max(factuality - 0.2, 0.1);
        }
        if (/fact|accurate|precise|correct/i.test(request.content)) {
            accuracy = Math.min(accuracy + 0.2, 1.0);
            factuality = Math.min(factuality + 0.2, 1.0);
            creativity = Math.max(creativity - 0.2, 0.1);
        }
        return { accuracy, creativity, factuality };
    }
    getPreferredModels(requestType, complexity, requiredCapabilities, context) {
        const preferredModels = [];
        // Model preferences based on request type and complexity
        const modelPreferences = {
            [types_1.AIRequestType.TEXT_GENERATION]: {
                low: ['gpt-3.5-turbo', 'claude-instant'],
                medium: ['gpt-4', 'claude-2'],
                high: ['gpt-4', 'claude-2', 'gpt-4-32k'],
            },
            [types_1.AIRequestType.CODE_GENERATION]: {
                low: ['codex', 'gpt-3.5-turbo'],
                medium: ['gpt-4', 'codex'],
                high: ['gpt-4', 'claude-2'],
            },
            [types_1.AIRequestType.IMAGE_ANALYSIS]: {
                low: ['gpt-4-vision'],
                medium: ['gpt-4-vision', 'claude-3-vision'],
                high: ['gpt-4-vision', 'claude-3-vision'],
            },
        };
        const typePrefs = modelPreferences[requestType];
        if (typePrefs && typePrefs[complexity]) {
            preferredModels.push(...typePrefs[complexity]);
        }
        // Add capability-specific model preferences
        if (requiredCapabilities.includes('multilingual')) {
            preferredModels.push('gpt-4', 'claude-2');
        }
        if (requiredCapabilities.includes('code-generation')) {
            preferredModels.push('codex', 'gpt-4');
        }
        // User preferences from context
        if (context?.userPreferences?.preferredModels) {
            preferredModels.push(...context.userPreferences.preferredModels);
        }
        return [...new Set(preferredModels)]; // Remove duplicates
    }
    detectLanguages(content) {
        // Simple language detection based on patterns
        const languages = ['en']; // Default to English
        // Add more sophisticated language detection here
        // For now, just detect some common patterns
        if (/[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i.test(content)) {
            languages.push('fr', 'es', 'de', 'it');
        }
        if (/[а-яё]/i.test(content)) {
            languages.push('ru');
        }
        if (/[一-龯]/i.test(content)) {
            languages.push('zh');
        }
        if (/[ひらがなカタカナ]/i.test(content)) {
            languages.push('ja');
        }
        return [...new Set(languages)];
    }
    detectCodeLanguages(content) {
        const languages = [];
        const codePatterns = {
            javascript: /\b(function|const|let|var|=>|require|import)\b/,
            python: /\b(def|import|from|class|if __name__|print)\b/,
            java: /\b(public class|private|protected|import java)\b/,
            cpp: /\b(#include|std::|cout|cin|namespace)\b/,
            csharp: /\b(using System|public class|private|protected)\b/,
            go: /\b(package|func|import|var|:=)\b/,
            rust: /\b(fn|let|mut|use|impl|struct)\b/,
            typescript: /\b(interface|type|export|import.*from)\b/,
        };
        for (const [lang, pattern] of Object.entries(codePatterns)) {
            if (pattern.test(content)) {
                languages.push(lang);
            }
        }
        return languages;
    }
    detectDomains(content) {
        const domains = [];
        const domainPatterns = {
            'medical': /\b(patient|diagnosis|treatment|medicine|doctor|hospital)\b/i,
            'legal': /\b(contract|law|legal|court|attorney|lawsuit)\b/i,
            'financial': /\b(investment|stock|finance|banking|loan|credit)\b/i,
            'technical': /\b(algorithm|database|server|api|framework|architecture)\b/i,
            'scientific': /\b(research|study|experiment|hypothesis|data|analysis)\b/i,
            'educational': /\b(learn|teach|student|course|curriculum|education)\b/i,
        };
        for (const [domain, pattern] of Object.entries(domainPatterns)) {
            if (pattern.test(content)) {
                domains.push(domain);
            }
        }
        return domains;
    }
    initializePatterns() {
        // Complexity patterns
        this.complexityPatterns.set(/\b(complex|complicated|advanced|sophisticated)\b/i, 2);
        this.complexityPatterns.set(/\b(simple|basic|easy|straightforward)\b/i, -1);
        this.complexityPatterns.set(/\b(algorithm|optimization|performance|scalability)\b/i, 1);
        this.complexityPatterns.set(/\b(detailed|comprehensive|thorough|in-depth)\b/i, 1);
        // Capability patterns
        this.capabilityPatterns.set(/\b(creative|story|poem|fiction|imaginative)\b/i, ['creativity', 'storytelling']);
        this.capabilityPatterns.set(/\b(code|programming|function|algorithm)\b/i, ['programming', 'code-generation']);
        this.capabilityPatterns.set(/\b(translate|translation|language)\b/i, ['translation', 'multilingual']);
        this.capabilityPatterns.set(/\b(summarize|summary|brief|overview)\b/i, ['summarization']);
        this.capabilityPatterns.set(/\b(analyze|analysis|examine|evaluate)\b/i, ['analysis', 'reasoning']);
        // Urgency patterns
        this.urgencyPatterns.set(/\b(urgent|asap|immediately|quickly|fast)\b/i, 2);
        this.urgencyPatterns.set(/\b(deadline|due|time-sensitive|priority)\b/i, 1);
        this.urgencyPatterns.set(/\b(emergency|critical|important)\b/i, 3);
    }
    getDefaultAnalysis() {
        return {
            complexity: 'medium',
            estimatedTokens: 1000,
            requiredCapabilities: ['text-generation'],
            preferredModels: ['gpt-3.5-turbo'],
            urgency: 'medium',
            resourceRequirements: {
                memory: 2,
                compute: 2,
                bandwidth: 1,
            },
            contextSize: 0,
            expectedLatency: 2000,
            qualityRequirements: {
                accuracy: 0.7,
                creativity: 0.5,
                factuality: 0.8,
            },
        };
    }
}
exports.RequestAnalyzer = RequestAnalyzer;
// Singleton instance
let requestAnalyzer = null;
function getRequestAnalyzer() {
    if (!requestAnalyzer) {
        requestAnalyzer = new RequestAnalyzer();
    }
    return requestAnalyzer;
}
function createRequestAnalyzer() {
    requestAnalyzer = new RequestAnalyzer();
    return requestAnalyzer;
}
//# sourceMappingURL=request-analyzer.js.map