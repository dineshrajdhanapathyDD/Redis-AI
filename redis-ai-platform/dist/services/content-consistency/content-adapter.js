"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentAdapter = exports.AdaptationType = exports.VariableType = exports.ContentLifespan = exports.AttentionSpan = exports.VisualImportance = exports.InteractionLevel = exports.ContentPace = exports.CommunicationStyle = exports.PlatformType = void 0;
const logger_1 = require("../../utils/logger");
const brand_analyzer_1 = require("./brand-analyzer");
var PlatformType;
(function (PlatformType) {
    PlatformType["SOCIAL_MEDIA"] = "social_media";
    PlatformType["EMAIL"] = "email";
    PlatformType["WEBSITE"] = "website";
    PlatformType["BLOG"] = "blog";
    PlatformType["ADVERTISING"] = "advertising";
    PlatformType["PRINT"] = "print";
    PlatformType["VIDEO"] = "video";
    PlatformType["PODCAST"] = "podcast";
})(PlatformType || (exports.PlatformType = PlatformType = {}));
var CommunicationStyle;
(function (CommunicationStyle) {
    CommunicationStyle["FORMAL"] = "formal";
    CommunicationStyle["CASUAL"] = "casual";
    CommunicationStyle["CONVERSATIONAL"] = "conversational";
    CommunicationStyle["PROFESSIONAL"] = "professional";
    CommunicationStyle["PLAYFUL"] = "playful";
})(CommunicationStyle || (exports.CommunicationStyle = CommunicationStyle = {}));
var ContentPace;
(function (ContentPace) {
    ContentPace["FAST"] = "fast";
    ContentPace["MEDIUM"] = "medium";
    ContentPace["SLOW"] = "slow";
})(ContentPace || (exports.ContentPace = ContentPace = {}));
var InteractionLevel;
(function (InteractionLevel) {
    InteractionLevel["HIGH"] = "high";
    InteractionLevel["MEDIUM"] = "medium";
    InteractionLevel["LOW"] = "low";
})(InteractionLevel || (exports.InteractionLevel = InteractionLevel = {}));
var VisualImportance;
(function (VisualImportance) {
    VisualImportance["CRITICAL"] = "critical";
    VisualImportance["IMPORTANT"] = "important";
    VisualImportance["MODERATE"] = "moderate";
    VisualImportance["MINIMAL"] = "minimal";
})(VisualImportance || (exports.VisualImportance = VisualImportance = {}));
var AttentionSpan;
(function (AttentionSpan) {
    AttentionSpan["VERY_SHORT"] = "very_short";
    AttentionSpan["SHORT"] = "short";
    AttentionSpan["MEDIUM"] = "medium";
    AttentionSpan["LONG"] = "long";
    AttentionSpan["EXTENDED"] = "extended"; // > 5 minutes
})(AttentionSpan || (exports.AttentionSpan = AttentionSpan = {}));
var ContentLifespan;
(function (ContentLifespan) {
    ContentLifespan["EPHEMERAL"] = "ephemeral";
    ContentLifespan["SHORT"] = "short";
    ContentLifespan["MEDIUM"] = "medium";
    ContentLifespan["LONG"] = "long";
    ContentLifespan["EVERGREEN"] = "evergreen"; // > 6 months
})(ContentLifespan || (exports.ContentLifespan = ContentLifespan = {}));
e;
xport;
int;
erface;
ContentFormat;
{
    id: string;
    name: string;
    type: brand_analyzer_1.ContentType;
    specifications: FormatSpecifications;
    templates: ContentTemplate[];
    optimization: OptimizationRules;
}
i;
nterface;
TemplateVariable;
{
    name: string;
    type: VariableType;
    description: string;
    defaultValue ?  : any;
    constraints ?  : VariableConstraints;
    examples: any[];
}
var VariableType;
(function (VariableType) {
    VariableType["TEXT"] = "text";
    VariableType["NUMBER"] = "number";
    VariableType["BOOLEAN"] = "boolean";
    VariableType["DATE"] = "date";
    VariableType["URL"] = "url";
    VariableType["IMAGE"] = "image";
    VariableType["COLOR"] = "color";
    VariableType["LIST"] = "list";
})(VariableType || (exports.VariableType = VariableType = {}));
var AdaptationType;
(function (AdaptationType) {
    AdaptationType["TEXT_LENGTH"] = "text_length";
    AdaptationType["TONE_ADJUSTMENT"] = "tone_adjustment";
    AdaptationType["FORMAT_CHANGE"] = "format_change";
    AdaptationType["VISUAL_OPTIMIZATION"] = "visual_optimization";
    AdaptationType["STRUCTURE_MODIFICATION"] = "structure_modification";
    AdaptationType["CALL_TO_ACTION"] = "call_to_action";
    AdaptationType["HASHTAG_OPTIMIZATION"] = "hashtag_optimization";
})(AdaptationType || (exports.AdaptationType = AdaptationType = {}));
class ContentAdapter {
    redis;
    embeddingManager;
    PLATFORM_PREFIX = 'platform';
    ADAPTATION_PREFIX = 'adaptation';
    TEMPLATE_PREFIX = 'template';
    constructor(redis, embeddingManager) {
        this.redis = redis;
        this.embeddingManager = embeddingManager;
    }
    async adaptContent(request) {
        logger_1.logger.info(`Adapting content for ${request.targetPlatforms.length} platforms`);
        const adaptedContent = [];
        for (const platformId of request.targetPlatforms) {
            const platform = await this.getPlatform(platformId);
            if (!platform) {
                logger_1.logger.warn(`Platform not found: ${platformId}`);
                continue;
            }
            const adapted = await this.adaptForPlatform(request.sourceContent, platform, request.brandProfile, request.preferences);
            adaptedContent.push(adapted);
        }
        const consistencyScore = await this.calculateConsistencyScore(adaptedContent, request.brandProfile);
        const brandAlignmentScore = await this.calculateBrandAlignmentScore(adaptedContent, request.brandProfile);
        const platformOptimizationScore = await this.calculatePlatformOptimizationScore(adaptedContent);
        const recommendations = await this.generateAdaptationRecommendations(adaptedContent, request);
        const result = {
            id: this.generateAdaptationId(),
            requestId: request.id,
            adaptedContent,
            consistencyScore,
            brandAlignmentScore,
            platformOptimizationScore,
            recommendations,
            generatedAt: new Date()
        };
        await this.storeAdaptationResult(result);
        return result;
    }
    async registerPlatform(platform) {
        await this.redis.hset(`${this.PLATFORM_PREFIX}:${platform.id}`, 'data', JSON.stringify(platform));
        logger_1.logger.info(`Registered platform: ${platform.name}`);
    }
    async getPlatform(id) {
        const data = await this.redis.hget(`${this.PLATFORM_PREFIX}:${id}`, 'data');
        return data ? JSON.parse(data) : null;
    }
    async createContentTemplate(template) {
        await this.redis.hset(`${this.TEMPLATE_PREFIX}:${template.id}`, 'data', JSON.stringify(template));
        logger_1.logger.info(`Created content template: ${template.name}`);
    }
    async getContentTemplate(id) {
        const data = await this.redis.hget(`${this.TEMPLATE_PREFIX}:${id}`, 'data');
        return data ? JSON.parse(data) : null;
    }
    async adaptForPlatform(sourceContent, platform, brandProfile, preferences) {
        const adaptations = [];
        let adaptedContent = { ...sourceContent };
        // Adapt text length
        if (platform.constraints.textLimits.maxCharacters) {
            const textAdaptation = await this.adaptTextLength(adaptedContent.content, platform.constraints.textLimits.maxCharacters, brandProfile);
            if (textAdaptation) {
                adaptations.push(textAdaptation);
                adaptedContent.content = textAdaptation.adaptedValue;
            }
        }
        // Adapt tone
        if (preferences.maintainBrandVoice) {
            const toneAdaptation = await this.adaptTone(adaptedContent.content, platform.characteristics.communicationStyle, brandProfile);
            if (toneAdaptation) {
                adaptations.push(toneAdaptation);
                adaptedContent.content = toneAdaptation.adaptedValue;
            }
        }
        // Adapt format
        const formatAdaptation = await this.adaptFormat(adaptedContent, platform);
        if (formatAdaptation) {
            adaptations.push(formatAdaptation);
        }
        // Generate performance prediction
        const performance = await this.predictPerformance(adaptedContent, platform, brandProfile);
        // Generate alternatives
        const alternatives = await this.generateAlternatives(adaptedContent, platform, brandProfile);
        return {
            platformId: platform.id,
            content: adaptedContent,
            adaptations,
            performance,
            alternatives
        };
    }
    async adaptTextLength(content, maxLength, brandProfile) {
        if (content.length <= maxLength) {
            return null;
        }
        // Intelligent text shortening while preserving key messages
        const shortenedContent = await this.intelligentTextShortening(content, maxLength, brandProfile);
        return {
            type: AdaptationType.TEXT_LENGTH,
            description: `Shortened text from ${content.length} to ${shortenedContent.length} characters`,
            originalValue: content,
            adaptedValue: shortenedContent,
            reason: `Platform requires maximum ${maxLength} characters`,
            confidence: 0.8
        };
    }
    async adaptTone(content, targetStyle, brandProfile) {
        // Analyze current tone and adapt if necessary
        const currentTone = await this.analyzeTone(content);
        const targetTone = this.mapCommunicationStyleToTone(targetStyle);
        if (currentTone === targetTone) {
            return null;
        }
        const adaptedContent = await this.adjustTone(content, targetTone, brandProfile);
        return {
            type: AdaptationType.TONE_ADJUSTMENT,
            description: `Adjusted tone from ${currentTone} to ${targetTone}`,
            originalValue: content,
            adaptedValue: adaptedContent,
            reason: `Platform prefers ${targetStyle} communication style`,
            confidence: 0.7
        };
    }
    async adaptFormat(content, platform) {
        // Format adaptation logic would be implemented here
        return null;
    }
    async predictPerformance(content, platform, brandProfile) {
        // Performance prediction logic would be implemented here
        return {
            engagementScore: 0.7,
            reachScore: 0.6,
            conversionScore: 0.5,
            brandScore: 0.8,
            factors: [
                {
                    factor: 'Content length',
                    impact: 0.1,
                    confidence: 0.8,
                    explanation: 'Optimal length for platform'
                }
            ]
        };
    }
    async generateAlternatives(content, platform, brandProfile) {
        // Alternative generation logic would be implemented here
        return [];
    }
    async calculateConsistencyScore(adaptedContent, brandProfile) {
        // Calculate how consistent the adaptations are with each other
        if (adaptedContent.length < 2)
            return 1.0;
        let totalSimilarity = 0;
        let comparisons = 0;
        for (let i = 0; i < adaptedContent.length; i++) {
            for (let j = i + 1; j < adaptedContent.length; j++) {
                const similarity = await this.calculateContentSimilarity(adaptedContent[i].content, adaptedContent[j].content);
                totalSimilarity += similarity;
                comparisons++;
            }
        }
        return comparisons > 0 ? totalSimilarity / comparisons : 1.0;
    }
    async calculateBrandAlignmentScore(adaptedContent, brandProfile) {
        let totalScore = 0;
        for (const adapted of adaptedContent) {
            const score = await this.calculateBrandAlignment(adapted.content, brandProfile);
            totalScore += score;
        }
        return adaptedContent.length > 0 ? totalScore / adaptedContent.length : 0;
    }
    async calculatePlatformOptimizationScore(adaptedContent) {
        let totalScore = 0;
        for (const adapted of adaptedContent) {
            const platform = await this.getPlatform(adapted.platformId);
            if (platform) {
                const score = await this.calculatePlatformOptimization(adapted.content, platform);
                totalScore += score;
            }
        }
        return adaptedContent.length > 0 ? totalScore / adaptedContent.length : 0;
    }
    async generateAdaptationRecommendations(adaptedContent, request) {
        // Generate recommendations based on adaptation results
        return [];
    }
    // Helper methods
    async intelligentTextShortening(content, maxLength, brandProfile) {
        // Implement intelligent text shortening logic
        if (content.length <= maxLength)
            return content;
        // Simple truncation for now - would implement more sophisticated logic
        return content.substring(0, maxLength - 3) + '...';
    }
    async analyzeTone(content) {
        // Implement tone analysis
        return 'neutral';
    }
    mapCommunicationStyleToTone(style) {
        const mapping = {
            [CommunicationStyle.FORMAL]: 'formal',
            [CommunicationStyle.CASUAL]: 'casual',
            [CommunicationStyle.CONVERSATIONAL]: 'friendly',
            [CommunicationStyle.PROFESSIONAL]: 'professional',
            [CommunicationStyle.PLAYFUL]: 'playful'
        };
        return mapping[style] || 'neutral';
    }
    async adjustTone(content, targetTone, brandProfile) {
        // Implement tone adjustment logic
        return content;
    }
    async calculateContentSimilarity(content1, content2) {
        const embedding1 = await this.embeddingManager.generateEmbedding(content1.content);
        const embedding2 = await this.embeddingManager.generateEmbedding(content2.content);
        // Calculate cosine similarity
        return this.cosineSimilarity(embedding1, embedding2);
    }
    cosineSimilarity(a, b) {
        const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
        const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
        const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }
    async calculateBrandAlignment(content, brandProfile) {
        // Calculate how well content aligns with brand profile
        const contentEmbedding = await this.embeddingManager.generateEmbedding(content.content);
        return this.cosineSimilarity(contentEmbedding, brandProfile.embeddings.overallEmbedding);
    }
    async calculatePlatformOptimization(content, platform) {
        // Calculate how well content is optimized for platform
        let score = 1.0;
        // Check text length constraints
        if (platform.constraints.textLimits.maxCharacters) {
            if (content.content.length > platform.constraints.textLimits.maxCharacters) {
                score -= 0.3;
            }
        }
        // Additional optimization checks would be implemented here
        return Math.max(0, score);
    }
    async storeAdaptationResult(result) {
        await this.redis.hset(`${this.ADAPTATION_PREFIX}:${result.id}`, 'data', JSON.stringify(result));
    }
    generateAdaptationId() {
        return `adaptation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.ContentAdapter = ContentAdapter;
//# sourceMappingURL=content-adapter.js.map