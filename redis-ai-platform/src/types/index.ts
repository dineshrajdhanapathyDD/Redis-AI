// Core types for the Redis AI Platform

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Content Types
export enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  CODE = 'code',
  VIDEO = 'video',
}

export interface Content {
  id: string;
  type: ContentType;
  data: string | Buffer;
  metadata: ContentMetadata;
  embeddings?: number[];
}

export interface ContentMetadata {
  title?: string;
  description?: string;
  tags: string[];
  source: string;
  language?: string;
  format?: string;
  size?: number;
  duration?: number; // for audio/video
  dimensions?: { width: number; height: number }; // for images/video
}

// Vector Embeddings
export interface VectorEmbedding extends BaseEntity {
  vector: number[];
  contentId: string;
  contentType: ContentType;
  metadata: EmbeddingMetadata;
  relationships: EmbeddingRelationships;
}

export interface EmbeddingMetadata {
  source: string;
  timestamp: Date;
  version: number;
  tags: string[];
  model: string;
  dimensions: number;
}

export interface EmbeddingRelationships {
  parentId?: string;
  childIds: string[];
  similarIds: string[];
  crossModalIds: string[];
}

// Search
export interface SearchQuery {
  query: string;
  modalities: ContentType[];
  filters?: SearchFilters;
  limit?: number;
  threshold?: number;
}

export interface SearchFilters {
  contentType?: ContentType[];
  tags?: string[];
  source?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  metadata?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  content: Content;
  type: ContentType;
  relevanceScore: number;
  crossModalMatches: CrossModalMatch[];
  metadata: SearchResultMetadata;
}

export interface CrossModalMatch {
  contentId: string;
  type: ContentType;
  score: number;
  relationship: string;
}

export interface SearchResultMetadata {
  searchTime: number;
  totalResults: number;
  appliedFilters: SearchFilters;
  suggestions: string[];
}

// AI Model Routing
export interface AIRequest {
  id: string;
  content: string;
  type: AIRequestType;
  context?: AIContext;
  preferences?: UserPreferences;
  metadata: AIRequestMetadata;
}

export enum AIRequestType {
  TEXT_GENERATION = 'text_generation',
  CODE_GENERATION = 'code_generation',
  IMAGE_ANALYSIS = 'image_analysis',
  AUDIO_TRANSCRIPTION = 'audio_transcription',
  TRANSLATION = 'translation',
  SUMMARIZATION = 'summarization',
  QUESTION_ANSWERING = 'question_answering',
}

export interface AIContext {
  conversationHistory: Message[];
  workspaceId?: string;
  userId: string;
  sessionId: string;
  previousRequests: string[];
}

export interface AIRequestMetadata {
  priority: 'low' | 'medium' | 'high';
  maxLatency: number;
  maxCost: number;
  requiredCapabilities: string[];
  timestamp: Date;
}

export interface ModelEndpoint {
  id: string;
  name: string;
  provider: string;
  url: string;
  capabilities: string[];
  pricing: ModelPricing;
  performance: ModelPerformance;
}

export interface ModelPricing {
  inputTokenCost: number;
  outputTokenCost: number;
  currency: string;
}

export interface ModelPerformance {
  averageLatency: number;
  throughput: number;
  accuracy: number;
  availability: number;
  errorRate: number;
}

// Collaborative Workspace
export interface Workspace extends BaseEntity {
  name: string;
  description: string;
  ownerId: string;
  collaborators: Collaborator[];
  knowledgeGraph: KnowledgeGraph;
  sharedContext: SharedContext;
  settings: WorkspaceSettings;
}

export interface Collaborator {
  userId: string;
  role: CollaboratorRole;
  permissions: Permission[];
  joinedAt: Date;
  lastActive: Date;
  contributions: Contribution[];
}

export enum CollaboratorRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
}

export interface Permission {
  resource: string;
  actions: string[];
}

export interface Contribution {
  id: string;
  type: ContributionType;
  content: string;
  timestamp: Date;
  impact: number;
}

export enum ContributionType {
  KNOWLEDGE_ADDITION = 'knowledge_addition',
  INSIGHT_GENERATION = 'insight_generation',
  PROBLEM_SOLVING = 'problem_solving',
  COLLABORATION = 'collaboration',
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  metadata: KnowledgeGraphMetadata;
}

export interface KnowledgeNode {
  id: string;
  type: KnowledgeType;
  content: string;
  embeddings: number[];
  metadata: KnowledgeNodeMetadata;
  relationships: string[];
}

export enum KnowledgeType {
  FACT = 'fact',
  CONCEPT = 'concept',
  PROCEDURE = 'procedure',
  INSIGHT = 'insight',
  DECISION = 'decision',
  QUESTION = 'question',
  SOLUTION = 'solution',
}

export interface KnowledgeNodeMetadata {
  source: string;
  confidence: number;
  timestamp: Date;
  contributors: string[];
  tags: string[];
  version: number;
}

export interface KnowledgeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationshipType;
  weight: number;
  metadata: KnowledgeEdgeMetadata;
}

export enum RelationshipType {
  RELATED_TO = 'related_to',
  DEPENDS_ON = 'depends_on',
  CONTRADICTS = 'contradicts',
  SUPPORTS = 'supports',
  DERIVED_FROM = 'derived_from',
  PART_OF = 'part_of',
  SIMILAR_TO = 'similar_to',
}

export interface KnowledgeEdgeMetadata {
  confidence: number;
  timestamp: Date;
  source: string;
  reasoning: string;
}

export interface KnowledgeGraphMetadata {
  totalNodes: number;
  totalEdges: number;
  lastUpdated: Date;
  version: number;
  statistics: GraphStatistics;
}

export interface GraphStatistics {
  nodeTypeDistribution: Record<KnowledgeType, number>;
  edgeTypeDistribution: Record<RelationshipType, number>;
  averageConnectivity: number;
  clusteringCoefficient: number;
}

export interface SharedContext {
  conversationHistory: Message[];
  insights: Insight[];
  decisions: Decision[];
  activeTopics: Topic[];
  metadata: SharedContextMetadata;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  type: MessageType;
  timestamp: Date;
  metadata: MessageMetadata;
}

export enum MessageType {
  USER_MESSAGE = 'user_message',
  AI_RESPONSE = 'ai_response',
  SYSTEM_MESSAGE = 'system_message',
  KNOWLEDGE_UPDATE = 'knowledge_update',
}

export interface MessageMetadata {
  model?: string;
  confidence?: number;
  processingTime?: number;
  tokens?: number;
  cost?: number;
}

export interface Insight {
  id: string;
  content: string;
  type: InsightType;
  confidence: number;
  sources: string[];
  timestamp: Date;
  contributors: string[];
  embeddings: number[];
}

export enum InsightType {
  PATTERN = 'pattern',
  CORRELATION = 'correlation',
  PREDICTION = 'prediction',
  RECOMMENDATION = 'recommendation',
  ANOMALY = 'anomaly',
}

export interface Decision {
  id: string;
  title: string;
  description: string;
  options: DecisionOption[];
  selectedOption?: string;
  reasoning: string;
  timestamp: Date;
  contributors: string[];
  impact: DecisionImpact;
}

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
  score: number;
}

export interface DecisionImpact {
  scope: string[];
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  timeframe: string;
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  relevanceScore: number;
  lastDiscussed: Date;
  participants: string[];
}

export interface SharedContextMetadata {
  totalMessages: number;
  totalInsights: number;
  totalDecisions: number;
  lastActivity: Date;
  activeParticipants: number;
}

export interface WorkspaceSettings {
  privacy: 'private' | 'public' | 'restricted';
  aiAssistance: boolean;
  knowledgeRetention: number; // days
  maxCollaborators: number;
  features: WorkspaceFeature[];
}

export interface WorkspaceFeature {
  name: string;
  enabled: boolean;
  configuration: Record<string, any>;
}

// User and Personalization
export interface User extends BaseEntity {
  email: string;
  username: string;
  profile: UserProfile;
  preferences: UserPreferences;
  behaviorPatterns: BehaviorPattern[];
  learningHistory: LearningEvent[];
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  timezone: string;
  language: string;
}

export interface UserPreferences {
  aiModels: ModelPreference[];
  searchSettings: SearchPreferences;
  interfaceSettings: InterfacePreferences;
  privacySettings: PrivacySettings;
  notificationSettings: NotificationSettings;
}

export interface ModelPreference {
  modelId: string;
  preference: number; // -1 to 1
  contexts: string[];
}

export interface SearchPreferences {
  defaultModalities: ContentType[];
  resultLimit: number;
  threshold: number;
  sortBy: 'relevance' | 'date' | 'popularity';
  filters: SearchFilters;
}

export interface InterfacePreferences {
  theme: 'light' | 'dark' | 'auto';
  layout: 'compact' | 'comfortable' | 'spacious';
  shortcuts: KeyboardShortcut[];
  widgets: WidgetConfiguration[];
}

export interface KeyboardShortcut {
  key: string;
  action: string;
  context: string;
}

export interface WidgetConfiguration {
  id: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  settings: Record<string, any>;
}

export interface PrivacySettings {
  dataCollection: boolean;
  personalization: boolean;
  analytics: boolean;
  sharing: boolean;
  retention: number; // days
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  types: NotificationType[];
}

export enum NotificationType {
  WORKSPACE_ACTIVITY = 'workspace_activity',
  AI_INSIGHTS = 'ai_insights',
  SYSTEM_UPDATES = 'system_updates',
  COLLABORATION_REQUESTS = 'collaboration_requests',
}

export interface BehaviorPattern {
  id: string;
  type: BehaviorType;
  pattern: string;
  frequency: number;
  confidence: number;
  lastObserved: Date;
  context: BehaviorContext;
}

export enum BehaviorType {
  SEARCH_PATTERN = 'search_pattern',
  INTERACTION_PATTERN = 'interaction_pattern',
  CONTENT_PREFERENCE = 'content_preference',
  TIMING_PATTERN = 'timing_pattern',
  COLLABORATION_PATTERN = 'collaboration_pattern',
}

export interface BehaviorContext {
  timeOfDay: string;
  dayOfWeek: string;
  workspaceType: string;
  contentType: ContentType[];
  collaborators: string[];
}

export interface LearningEvent {
  id: string;
  type: LearningEventType;
  content: string;
  outcome: LearningOutcome;
  timestamp: Date;
  metadata: LearningEventMetadata;
}

export enum LearningEventType {
  FEEDBACK = 'feedback',
  INTERACTION = 'interaction',
  PREFERENCE_UPDATE = 'preference_update',
  BEHAVIOR_CHANGE = 'behavior_change',
  SKILL_ACQUISITION = 'skill_acquisition',
}

export interface LearningOutcome {
  success: boolean;
  improvement: number;
  confidence: number;
  impact: string[];
}

export interface LearningEventMetadata {
  source: string;
  context: string;
  duration: number;
  effort: number;
}

// System and Performance
export interface SystemMetrics {
  timestamp: Date;
  performance: PerformanceMetrics;
  resources: ResourceMetrics;
  errors: ErrorMetrics;
  ai: AIMetrics;
}

export interface PerformanceMetrics {
  responseTime: {
    p50: number;
    p95: number;
    p99: number;
  };
  throughput: number;
  concurrentUsers: number;
  cacheHitRate: number;
}

export interface ResourceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: NetworkMetrics;
  redis: RedisMetrics;
}

export interface NetworkMetrics {
  inbound: number;
  outbound: number;
  connections: number;
}

export interface RedisMetrics {
  memoryUsage: number;
  keyCount: number;
  operations: number;
  hitRate: number;
  evictions: number;
}

export interface ErrorMetrics {
  total: number;
  rate: number;
  types: Record<string, number>;
  severity: Record<string, number>;
}

export interface AIMetrics {
  requests: number;
  averageLatency: number;
  modelUsage: Record<string, number>;
  costs: number;
  accuracy: number;
}