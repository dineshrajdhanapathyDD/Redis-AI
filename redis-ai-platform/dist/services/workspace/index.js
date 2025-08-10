"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceService = void 0;
__exportStar(require("./workspace-manager"), exports);
__exportStar(require("./sync-engine"), exports);
__exportStar(require("./access-control"), exports);
__exportStar(require("./knowledge-graph"), exports);
const workspace_manager_1 = require("./workspace-manager");
const sync_engine_1 = require("./sync-engine");
const access_control_1 = require("./access-control");
const knowledge_graph_1 = require("./knowledge-graph");
class WorkspaceService {
    manager;
    sync;
    access;
    knowledgeGraph;
    constructor(redis, embeddingManager) {
        this.manager = new workspace_manager_1.WorkspaceManager(redis, embeddingManager);
        this.sync = new sync_engine_1.SyncEngine(redis, this.manager);
        this.access = new access_control_1.AccessControl(redis);
        this.knowledgeGraph = new knowledge_graph_1.KnowledgeGraph(redis, embeddingManager);
    }
    async initialize() {
        // Any initialization logic for the workspace service
        // This could include setting up default policies, cleaning up expired data, etc.
    }
    async shutdown() {
        // Cleanup logic when shutting down the service
        // This could include unsubscribing from Redis channels, saving state, etc.
    }
}
exports.WorkspaceService = WorkspaceService;
//# sourceMappingURL=index.js.map