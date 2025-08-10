"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeDefs = void 0;
const apollo_server_express_1 = require("apollo-server-express");
exports.typeDefs = (0, apollo_server_express_1.gql) `
  scalar Date
  scalar JSON

  # Search Types
  enum ContentType {
    TEXT
    IMAGE
    AUDIO
    CODE
  }

  type SearchResult {
    id: ID!
    content: String!
    contentType: ContentType!
    score: Float!
    metadata: JSON
    crossModalMatches: [SearchResult!]
  }

  type SearchResponse {
    query: String!
    results: [SearchResult!]!
    totalResults: Int!
    searchTime: Int!
  }

  # Workspace Types
  enum CollaboratorRole {
    OWNER
    ADMIN
    EDITOR
    VIEWER
  }

  enum KnowledgeType {
    INSIGHT
    DECISION
    QUESTION
    ANSWER
    DOCUMENT
    CODE
    DISCUSSION
  }

  enum RelationshipType {
    RELATES_TO
    DEPENDS_ON
    CONTRADICTS
    SUPPORTS
    DERIVED_FROM
    REFERENCES
  }

  type Collaborator {
    userId: ID!
    role: CollaboratorRole!
    joinedAt: Date!
    lastActive: Date!
    contributions: Int!
  }

  type KnowledgeNode {
    id: ID!
    type: KnowledgeType!
    content: String!
    metadata: JSON!
    createdBy: ID!
    createdAt: Date!
  }

  type KnowledgeEdge {
    id: ID!
    sourceId: ID!
    targetId: ID!
    relationship: RelationshipType!
    strength: Float!
    createdAt: Date!
  }

  type KnowledgeGraph {
    nodes: [KnowledgeNode!]!
    edges: [KnowledgeEdge!]!
    nodeCount: Int!
    edgeCount: Int!
    lastUpdated: Date!
  }

  type Workspace {
    id: ID!
    name: String!
    description: String!
    ownerId: ID!
    createdAt: Date!
    updatedAt: Date!
    isPublic: Boolean!
    collaborators: [Collaborator!]!
    knowledgeGraph: KnowledgeGraph!
    settings: JSON!
  }

  # AI Routing Types
  type AIModel {
    id: ID!
    name: String!
    provider: String!
    capabilities: [String!]!
    status: String!
    performance: ModelPerformance!
    pricing: JSON!
  }

  type ModelPerformance {
    averageLatency: Float!
    successRate: Float!
    qualityScore: Float!
  }

  type RoutingResult {
    selectedModel: AIModel!
    reason: String!
    confidence: Float!
    estimatedLatency: Float!
    estimatedCost: Float!
    routingTime: Int!
  }

  # Learning Types
  type UserPattern {
    id: ID!
    type: String!
    description: String!
    frequency: Float!
    confidence: Float!
    strength: Float!
    context: JSON!
    firstObserved: Date!
    lastObserved: Date!
  }

  type Recommendation {
    id: ID!
    type: String!
    title: String!
    description: String!
    confidence: Float!
    relevanceScore: Float!
    reasoning: String!
    metadata: JSON!
  }

  # Adaptive UI Types
  type PersonalizationSuggestion {
    id: ID!
    type: String!
    component: String!
    suggestion: String!
    confidence: Float!
    impact: JSON!
  }

  type AdaptationResult {
    success: Boolean!
    adaptations: [JSON!]!
    errors: [JSON!]!
    metrics: JSON!
  }

  # Input Types
  input SearchInput {
    query: String!
    contentTypes: [ContentType!]
    limit: Int = 10
    threshold: Float = 0.7
  }

  input WorkspaceInput {
    name: String!
    description: String!
    ownerId: ID!
    isPublic: Boolean = false
    maxCollaborators: Int = 10
    settings: JSON
  }

  input KnowledgeInput {
    type: KnowledgeType!
    content: String!
    metadata: JSON
    createdBy: ID!
  }

  input AIRequestInput {
    prompt: String!
    context: JSON
    requirements: JSON
    userId: ID
    sessionId: String
  }

  input BehaviorInput {
    userId: ID!
    action: String!
    context: JSON
    metadata: JSON
  }

  input InteractionInput {
    id: ID
    userId: ID!
    type: String!
    timestamp: Date
    element: JSON!
    context: JSON!
    metadata: JSON
  }

  input AdaptationRequestInput {
    userId: ID!
    context: JSON!
    priority: String = "medium"
    constraints: [JSON!] = []
  }

  # Queries
  type Query {
    # Search
    search(input: SearchInput!): SearchResponse!
    searchSuggestions(query: String!, limit: Int = 5): [String!]!

    # Workspace
    workspace(id: ID!): Workspace
    workspaces(userId: ID!): [Workspace!]!
    workspaceKnowledge(workspaceId: ID!, query: String!, limit: Int = 10): [KnowledgeNode!]!
    workspaceInsights(workspaceId: ID!): [JSON!]!
    workspaceClusters(workspaceId: ID!, algorithm: String = "community"): [JSON!]!
    workspaceMetrics(workspaceId: ID!): JSON!

    # AI Routing
    availableModels(capability: String, provider: String): [AIModel!]!
    modelMetrics(modelId: ID!, timeframe: String = "24h"): JSON!
    routingAnalytics(timeframe: String = "24h"): JSON!

    # Learning
    userPatterns(userId: ID!, timeframe: String = "7d", limit: Int = 20): [UserPattern!]!
    recommendations(userId: ID!, context: JSON, limit: Int = 10): [Recommendation!]!
    userPreferences(userId: ID!): JSON
    similarUsers(userId: ID!, threshold: Float = 0.7, limit: Int = 10): [JSON!]!

    # Code Intelligence
    analyzeCode(code: String!, language: String, filePath: String, context: JSON): JSON!
    searchCode(query: String!, language: String, limit: Int = 10): [JSON!]!

    # Content Consistency
    analyzeBrandConsistency(content: String!, brandId: ID!, contentType: String, platform: String): JSON!

    # Optimization
    systemMetrics(timeframe: String = "1h"): JSON!
    optimizationRecommendations: [JSON!]!
    anomalies(timeframe: String = "24h"): [JSON!]!

    # Adaptive UI
    personalizationSuggestions(userId: ID!): [PersonalizationSuggestion!]!
    userInteractions(userId: ID!, limit: Int = 50): [JSON!]!
  }

  # Mutations
  type Mutation {
    # Workspace
    createWorkspace(input: WorkspaceInput!): Workspace!
    joinWorkspace(workspaceId: ID!, userId: ID!, role: CollaboratorRole = VIEWER): Boolean!
    leaveWorkspace(workspaceId: ID!, userId: ID!): Boolean!
    addKnowledge(workspaceId: ID!, input: KnowledgeInput!): KnowledgeNode!
    addKnowledgeRelationship(
      workspaceId: ID!
      sourceId: ID!
      targetId: ID!
      relationship: RelationshipType!
      strength: Float = 1.0
    ): Boolean!
    updateWorkspaceSettings(workspaceId: ID!, settings: JSON!): Boolean!

    # AI Routing
    routeAIRequest(input: AIRequestInput!): RoutingResult!
    updateModel(modelId: ID!, updates: JSON!): AIModel!
    testModelConnectivity(modelId: ID!, testPrompt: String): JSON!

    # Learning
    trackBehavior(input: BehaviorInput!): Boolean!
    updateUserPreferences(userId: ID!, preferences: JSON!): Boolean!
    provideFeedback(
      userId: ID!
      recommendationId: ID!
      feedback: String!
      rating: Int
      context: JSON
    ): Boolean!

    # Code Intelligence
    generateCode(prompt: String!, language: String, context: JSON, style: JSON): JSON!

    # Content Consistency
    adaptContent(
      content: String!
      sourcePlatform: String
      targetPlatform: String!
      brandId: ID
    ): JSON!

    # Adaptive UI
    trackInteraction(input: InteractionInput!): Boolean!
    processAdaptationRequest(input: AdaptationRequestInput!): AdaptationResult!

    # Data Management
    exportUserData(userId: ID!, format: String = "json"): JSON!
    deleteUserData(userId: ID!, confirm: Boolean!): Boolean!
  }

  # Subscriptions
  type Subscription {
    # Workspace
    workspaceUpdates(workspaceId: ID!): JSON!
    knowledgeAdded(workspaceId: ID!): KnowledgeNode!
    userJoined(workspaceId: ID!): Collaborator!
    userLeft(workspaceId: ID!): ID!

    # AI Routing
    modelStatusChanged(modelId: ID): AIModel!
    routingMetricsUpdated: JSON!

    # Learning
    newRecommendation(userId: ID!): Recommendation!
    patternDiscovered(userId: ID!): UserPattern!

    # Adaptive UI
    uiAdaptationApplied(userId: ID!): JSON!
    personalizationUpdated(userId: ID!): [PersonalizationSuggestion!]!

    # System
    systemAlert: JSON!
    anomalyDetected: JSON!
  }
`;
//# sourceMappingURL=schema.js.map