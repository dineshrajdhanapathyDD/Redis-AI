"use strict";
// Core types for the Redis AI Platform
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningEventType = exports.BehaviorType = exports.NotificationType = exports.InsightType = exports.MessageType = exports.RelationshipType = exports.KnowledgeType = exports.ContributionType = exports.CollaboratorRole = exports.AIRequestType = exports.ContentType = void 0;
// Content Types
var ContentType;
(function (ContentType) {
    ContentType["TEXT"] = "text";
    ContentType["IMAGE"] = "image";
    ContentType["AUDIO"] = "audio";
    ContentType["CODE"] = "code";
    ContentType["VIDEO"] = "video";
})(ContentType || (exports.ContentType = ContentType = {}));
var AIRequestType;
(function (AIRequestType) {
    AIRequestType["TEXT_GENERATION"] = "text_generation";
    AIRequestType["CODE_GENERATION"] = "code_generation";
    AIRequestType["IMAGE_ANALYSIS"] = "image_analysis";
    AIRequestType["AUDIO_TRANSCRIPTION"] = "audio_transcription";
    AIRequestType["TRANSLATION"] = "translation";
    AIRequestType["SUMMARIZATION"] = "summarization";
    AIRequestType["QUESTION_ANSWERING"] = "question_answering";
})(AIRequestType || (exports.AIRequestType = AIRequestType = {}));
var CollaboratorRole;
(function (CollaboratorRole) {
    CollaboratorRole["OWNER"] = "owner";
    CollaboratorRole["ADMIN"] = "admin";
    CollaboratorRole["EDITOR"] = "editor";
    CollaboratorRole["VIEWER"] = "viewer";
})(CollaboratorRole || (exports.CollaboratorRole = CollaboratorRole = {}));
var ContributionType;
(function (ContributionType) {
    ContributionType["KNOWLEDGE_ADDITION"] = "knowledge_addition";
    ContributionType["INSIGHT_GENERATION"] = "insight_generation";
    ContributionType["PROBLEM_SOLVING"] = "problem_solving";
    ContributionType["COLLABORATION"] = "collaboration";
})(ContributionType || (exports.ContributionType = ContributionType = {}));
var KnowledgeType;
(function (KnowledgeType) {
    KnowledgeType["FACT"] = "fact";
    KnowledgeType["CONCEPT"] = "concept";
    KnowledgeType["PROCEDURE"] = "procedure";
    KnowledgeType["INSIGHT"] = "insight";
    KnowledgeType["DECISION"] = "decision";
    KnowledgeType["QUESTION"] = "question";
    KnowledgeType["SOLUTION"] = "solution";
})(KnowledgeType || (exports.KnowledgeType = KnowledgeType = {}));
var RelationshipType;
(function (RelationshipType) {
    RelationshipType["RELATED_TO"] = "related_to";
    RelationshipType["DEPENDS_ON"] = "depends_on";
    RelationshipType["CONTRADICTS"] = "contradicts";
    RelationshipType["SUPPORTS"] = "supports";
    RelationshipType["DERIVED_FROM"] = "derived_from";
    RelationshipType["PART_OF"] = "part_of";
    RelationshipType["SIMILAR_TO"] = "similar_to";
})(RelationshipType || (exports.RelationshipType = RelationshipType = {}));
var MessageType;
(function (MessageType) {
    MessageType["USER_MESSAGE"] = "user_message";
    MessageType["AI_RESPONSE"] = "ai_response";
    MessageType["SYSTEM_MESSAGE"] = "system_message";
    MessageType["KNOWLEDGE_UPDATE"] = "knowledge_update";
})(MessageType || (exports.MessageType = MessageType = {}));
var InsightType;
(function (InsightType) {
    InsightType["PATTERN"] = "pattern";
    InsightType["CORRELATION"] = "correlation";
    InsightType["PREDICTION"] = "prediction";
    InsightType["RECOMMENDATION"] = "recommendation";
    InsightType["ANOMALY"] = "anomaly";
})(InsightType || (exports.InsightType = InsightType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["WORKSPACE_ACTIVITY"] = "workspace_activity";
    NotificationType["AI_INSIGHTS"] = "ai_insights";
    NotificationType["SYSTEM_UPDATES"] = "system_updates";
    NotificationType["COLLABORATION_REQUESTS"] = "collaboration_requests";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var BehaviorType;
(function (BehaviorType) {
    BehaviorType["SEARCH_PATTERN"] = "search_pattern";
    BehaviorType["INTERACTION_PATTERN"] = "interaction_pattern";
    BehaviorType["CONTENT_PREFERENCE"] = "content_preference";
    BehaviorType["TIMING_PATTERN"] = "timing_pattern";
    BehaviorType["COLLABORATION_PATTERN"] = "collaboration_pattern";
})(BehaviorType || (exports.BehaviorType = BehaviorType = {}));
var LearningEventType;
(function (LearningEventType) {
    LearningEventType["FEEDBACK"] = "feedback";
    LearningEventType["INTERACTION"] = "interaction";
    LearningEventType["PREFERENCE_UPDATE"] = "preference_update";
    LearningEventType["BEHAVIOR_CHANGE"] = "behavior_change";
    LearningEventType["SKILL_ACQUISITION"] = "skill_acquisition";
})(LearningEventType || (exports.LearningEventType = LearningEventType = {}));
//# sourceMappingURL=index.js.map