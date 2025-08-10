"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecommendationPriority = exports.RecommendationType = exports.ContentType = exports.BrandAnalyzer = exports.ActionType = exports.ConditionOperator = exports.ConditionType = exports.RuleSeverity = exports.ContentRuleCategory = exports.CredibilityLevel = exports.MessageLength = exports.CapitalizationStyle = exports.ExclamationRule = exports.EllipsisRule = exports.QuotationStyle = exports.ContractionRule = exports.WCAGLevel = exports.CTAStyle = exports.Perspective = exports.EmotionalTone = exports.ComplexityLevel = exports.FormalityLevel = void 0;
const logger_1 = require("../../utils/logger");
var FormalityLevel;
(function (FormalityLevel) {
    FormalityLevel["VERY_FORMAL"] = "very_formal";
    FormalityLevel["FORMAL"] = "formal";
    FormalityLevel["SEMI_FORMAL"] = "semi_formal";
    FormalityLevel["CASUAL"] = "casual";
    FormalityLevel["VERY_CASUAL"] = "very_casual";
})(FormalityLevel || (exports.FormalityLevel = FormalityLevel = {}));
var ComplexityLevel;
(function (ComplexityLevel) {
    ComplexityLevel["TECHNICAL"] = "technical";
    ComplexityLevel["ADVANCED"] = "advanced";
    ComplexityLevel["INTERMEDIATE"] = "intermediate";
    ComplexityLevel["SIMPLE"] = "simple";
    ComplexityLevel["BASIC"] = "basic";
})(ComplexityLevel || (exports.ComplexityLevel = ComplexityLevel = {}));
var EmotionalTone;
(function (EmotionalTone) {
    EmotionalTone["ENTHUSIASTIC"] = "enthusiastic";
    EmotionalTone["CONFIDENT"] = "confident";
    EmotionalTone["FRIENDLY"] = "friendly";
    EmotionalTone["PROFESSIONAL"] = "professional";
    EmotionalTone["EMPATHETIC"] = "empathetic";
    EmotionalTone["AUTHORITATIVE"] = "authoritative";
    EmotionalTone["PLAYFUL"] = "playful";
})(EmotionalTone || (exports.EmotionalTone = EmotionalTone = {}));
var Perspective;
(function (Perspective) {
    Perspective["FIRST_PERSON"] = "first_person";
    Perspective["SECOND_PERSON"] = "second_person";
    Perspective["THIRD_PERSON"] = "third_person";
})(Perspective || (exports.Perspective = Perspective = {}));
var CTAStyle;
(function (CTAStyle) {
    CTAStyle["DIRECT"] = "direct";
    CTAStyle["SUGGESTIVE"] = "suggestive";
    CTAStyle["URGENT"] = "urgent";
    CTAStyle["GENTLE"] = "gentle";
    CTAStyle["EDUCATIONAL"] = "educational";
})(CTAStyle || (exports.CTAStyle = CTAStyle = {}));
var WCAGLevel;
(function (WCAGLevel) {
    WCAGLevel["AA"] = "AA";
    WCAGLevel["AAA"] = "AAA";
})(WCAGLevel || (exports.WCAGLevel = WCAGLevel = {}));
var ContractionRule;
(function (ContractionRule) {
    ContractionRule["ALWAYS"] = "always";
    ContractionRule["NEVER"] = "never";
    ContractionRule["CONTEXT_DEPENDENT"] = "context_dependent";
})(ContractionRule || (exports.ContractionRule = ContractionRule = {}));
var QuotationStyle;
(function (QuotationStyle) {
    QuotationStyle["AMERICAN"] = "american";
    QuotationStyle["BRITISH"] = "british";
})(QuotationStyle || (exports.QuotationStyle = QuotationStyle = {}));
var EllipsisRule;
(function (EllipsisRule) {
    EllipsisRule["MINIMAL"] = "minimal";
    EllipsisRule["MODERATE"] = "moderate";
    EllipsisRule["LIBERAL"] = "liberal";
})(EllipsisRule || (exports.EllipsisRule = EllipsisRule = {}));
var ExclamationRule;
(function (ExclamationRule) {
    ExclamationRule["AVOID"] = "avoid";
    ExclamationRule["SPARINGLY"] = "sparingly";
    ExclamationRule["FREELY"] = "freely";
})(ExclamationRule || (exports.ExclamationRule = ExclamationRule = {}));
var CapitalizationStyle;
(function (CapitalizationStyle) {
    CapitalizationStyle["TITLE_CASE"] = "title_case";
    CapitalizationStyle["SENTENCE_CASE"] = "sentence_case";
    CapitalizationStyle["ALL_CAPS"] = "all_caps";
})(CapitalizationStyle || (exports.CapitalizationStyle = CapitalizationStyle = {}));
var MessageLength;
(function (MessageLength) {
    MessageLength["SHORT"] = "short";
    MessageLength["MEDIUM"] = "medium";
    MessageLength["LONG"] = "long";
})(MessageLength || (exports.MessageLength = MessageLength = {}));
var CredibilityLevel;
(function (CredibilityLevel) {
    CredibilityLevel["HIGH"] = "high";
    CredibilityLevel["MEDIUM"] = "medium";
    CredibilityLevel["LOW"] = "low";
})(CredibilityLevel || (exports.CredibilityLevel = CredibilityLevel = {}));
var ContentRuleCategory;
(function (ContentRuleCategory) {
    ContentRuleCategory["VOICE_TONE"] = "voice_tone";
    ContentRuleCategory["VISUAL_STYLE"] = "visual_style";
    ContentRuleCategory["MESSAGING"] = "messaging";
    ContentRuleCategory["FORMATTING"] = "formatting";
    ContentRuleCategory["ACCESSIBILITY"] = "accessibility";
    ContentRuleCategory["BRAND_COMPLIANCE"] = "brand_compliance";
})(ContentRuleCategory || (exports.ContentRuleCategory = ContentRuleCategory = {}));
var RuleSeverity;
(function (RuleSeverity) {
    RuleSeverity["ERROR"] = "error";
    RuleSeverity["WARNING"] = "warning";
    RuleSeverity["INFO"] = "info";
})(RuleSeverity || (exports.RuleSeverity = RuleSeverity = {}));
var ConditionType;
(function (ConditionType) {
    ConditionType["TEXT_CONTENT"] = "text_content";
    ConditionType["VISUAL_ELEMENT"] = "visual_element";
    ConditionType["METADATA"] = "metadata";
    ConditionType["CONTEXT"] = "context";
})(ConditionType || (exports.ConditionType = ConditionType = {}));
var ConditionOperator;
(function (ConditionOperator) {
    ConditionOperator["EQUALS"] = "equals";
    ConditionOperator["CONTAINS"] = "contains";
    ConditionOperator["MATCHES"] = "matches";
    ConditionOperator["GREATER_THAN"] = "greater_than";
    ConditionOperator["LESS_THAN"] = "less_than";
    ConditionOperator["IN_RANGE"] = "in_range";
})(ConditionOperator || (exports.ConditionOperator = ConditionOperator = {}));
var ActionType;
(function (ActionType) {
    ActionType["SUGGEST_CHANGE"] = "suggest_change";
    ActionType["AUTO_CORRECT"] = "auto_correct";
    ActionType["FLAG_VIOLATION"] = "flag_violation";
    ActionType["REQUEST_REVIEW"] = "request_review";
})(ActionType || (exports.ActionType = ActionType = {}));
class BrandAnalyzer {
    redis;
    embeddingManager;
    BRAND_PREFIX = 'brand';
    PROFILE_PREFIX = 'brand_profile';
    ANALYSIS_PREFIX = 'brand_analysis';
    constructor(redis, embeddingManager) {
        this.redis = redis;
        this.embeddingManager = embeddingManager;
    }
    async createBrandProfile(profile) {
        const brandProfile = {
            ...profile,
            id: this.generateBrandId(),
            embeddings: await this.generateBrandEmbeddings(profile),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        await this.storeBrandProfile(brandProfile);
        logger_1.logger.info(`Created brand profile: ${brandProfile.name}`);
        return brandProfile;
    }
    async updateBrandProfile(id, updates) {
        const existingProfile = await this.getBrandProfile(id);
        if (!existingProfile) {
            throw new Error(`Brand profile not found: ${id}`);
        }
        const updatedProfile = {
            ...existingProfile,
            ...updates,
            embeddings: await this.generateBrandEmbeddings({ ...existingProfile, ...updates }),
            updatedAt: new Date()
        };
        await this.storeBrandProfile(updatedProfile);
        logger_1.logger.info(`Updated brand profile: ${updatedProfile.name}`);
        return updatedProfile;
    }
    async getBrandProfile(id) {
        const data = await this.redis.hget(`${this.PROFILE_PREFIX}:${id}`, 'data');
        return data ? JSON.parse(data) : null;
    }
    async analyzeBrandConsistency(brandId, content) {
        const brandProfile = await this.getBrandProfile(brandId);
        if (!brandProfile) {
            throw new Error(`Brand profile not found: ${brandId}`);
        }
        const violations = [];
        const scores = [];
        for (const item of content) {
            const itemViolations = await this.analyzeContentItem(brandProfile, item);
            violations.push(...itemViolations);
            const itemScore = await this.calculateConsistencyScore(brandProfile, item);
            scores.push(itemScore);
        }
        const overallScore = this.calculateOverallScore(scores);
        const recommendations = await this.generateRecommendations(brandProfile, violations);
        const report = {
            id: this.generateReportId(),
            brandId,
            contentItems: content.length,
            overallScore,
            violations,
            scores,
            recommendations,
            generatedAt: new Date()
        };
        await this.storeConsistencyReport(report);
        return report;
    }
    async generateBrandEmbeddings(profile) {
        // Generate embeddings for different aspects of the brand
        const voiceText = this.extractVoiceText(profile.voiceAndTone);
        const styleText = this.extractStyleText(profile.styleElements);
        const visualText = this.extractVisualText(profile.visualIdentity);
        const messagingText = this.extractMessagingText(profile.voiceAndTone?.messagingFramework);
        const overallText = `${voiceText} ${styleText} ${visualText} ${messagingText}`;
        const [voiceEmbedding, styleEmbedding, visualEmbedding, messagingEmbedding, overallEmbedding] = await Promise.all([
            this.embeddingManager.generateEmbedding(voiceText),
            this.embeddingManager.generateEmbedding(styleText),
            this.embeddingManager.generateEmbedding(visualText),
            this.embeddingManager.generateEmbedding(messagingText),
            this.embeddingManager.generateEmbedding(overallText)
        ]);
        return {
            voiceEmbedding,
            styleEmbedding,
            visualEmbedding,
            messagingEmbedding,
            overallEmbedding
        };
    }
    extractVoiceText(voiceAndTone) {
        if (!voiceAndTone)
            return '';
        const characteristics = voiceAndTone.brandVoice?.characteristics?.join(' ') || '';
        const doStatements = voiceAndTone.brandVoice?.doStatements?.join(' ') || '';
        const toneVariations = voiceAndTone.toneVariations?.map(t => `${t.context}: ${t.tone}`).join(' ') || '';
        return `${characteristics} ${doStatements} ${toneVariations}`.trim();
    }
    extractStyleText(styleElements) {
        if (!styleElements)
            return '';
        const typography = styleElements.typography?.primaryFont?.family || '';
        const colors = styleElements.colorPalette?.primary?.name || '';
        const imagery = styleElements.imagery?.photographyStyle?.mood?.join(' ') || '';
        return `${typography} ${colors} ${imagery}`.trim();
    }
    extractVisualText(visualIdentity) {
        if (!visualIdentity)
            return '';
        const logo = visualIdentity.logo?.variations?.map(v => v.name).join(' ') || '';
        const layout = visualIdentity.layoutPrinciples?.gridUsage?.map(g => g.context).join(' ') || '';
        return `${logo} ${layout}`.trim();
    }
    extractMessagingText(messagingFramework) {
        if (!messagingFramework)
            return '';
        const coreMessages = messagingFramework.coreMessages?.map(m => m.message).join(' ') || '';
        const valueProps = messagingFramework.valuePropositions?.map(v => v.proposition).join(' ') || '';
        return `${coreMessages} ${valueProps}`.trim();
    }
    async storeBrandProfile(profile) {
        await this.redis.hset(`${this.PROFILE_PREFIX}:${profile.id}`, 'data', JSON.stringify(profile));
    }
    async storeConsistencyReport(report) {
        await this.redis.hset(`${this.ANALYSIS_PREFIX}:${report.id}`, 'data', JSON.stringify(report));
    }
    generateBrandId() {
        return `brand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Additional methods would be implemented here for content analysis
    async analyzeContentItem(brandProfile, content) {
        // Implementation would analyze content against brand rules
        return [];
    }
    async calculateConsistencyScore(brandProfile, content) {
        // Implementation would calculate consistency scores
        return {
            contentId: content.id,
            overallScore: 0.8,
            voiceScore: 0.8,
            styleScore: 0.8,
            visualScore: 0.8,
            messagingScore: 0.8
        };
    }
    calculateOverallScore(scores) {
        if (scores.length === 0)
            return 0;
        return scores.reduce((sum, score) => sum + score.overallScore, 0) / scores.length;
    }
    async generateRecommendations(brandProfile, violations) {
        // Implementation would generate recommendations based on violations
        return [];
    }
}
exports.BrandAnalyzer = BrandAnalyzer;
var ContentType;
(function (ContentType) {
    ContentType["ARTICLE"] = "article";
    ContentType["SOCIAL_POST"] = "social_post";
    ContentType["EMAIL"] = "email";
    ContentType["ADVERTISEMENT"] = "advertisement";
    ContentType["WEBPAGE"] = "webpage";
    ContentType["VIDEO"] = "video";
    ContentType["IMAGE"] = "image";
})(ContentType || (exports.ContentType = ContentType = {}));
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["VOICE_ADJUSTMENT"] = "voice_adjustment";
    RecommendationType["STYLE_CORRECTION"] = "style_correction";
    RecommendationType["VISUAL_ALIGNMENT"] = "visual_alignment";
    RecommendationType["MESSAGE_REFINEMENT"] = "message_refinement";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
var RecommendationPriority;
(function (RecommendationPriority) {
    RecommendationPriority["HIGH"] = "high";
    RecommendationPriority["MEDIUM"] = "medium";
    RecommendationPriority["LOW"] = "low";
})(RecommendationPriority || (exports.RecommendationPriority = RecommendationPriority = {}));
//# sourceMappingURL=brand-analyzer.js.map