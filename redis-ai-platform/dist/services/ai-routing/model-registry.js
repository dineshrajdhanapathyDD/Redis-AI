"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelRegistry = void 0;
exports.getModelRegistry = getModelRegistry;
exports.createModelRegistry = createModelRegistry;
const types_1 = require("@/types");
const logger_1 = __importDefault(require("@/utils/logger"));
class ModelRegistry {
    models = new Map();
    capabilityIndex = new Map(); // requestType -> modelIds
    providerIndex = new Map(); // provider -> modelIds
    registerModel(modelConfig) {
        const model = {
            ...modelConfig,
            performance: {
                averageLatency: 0,
                throughput: 0,
                accuracy: 0,
                availability: 1.0,
                errorRate: 0,
            },
            isActive: true,
            priority: modelConfig.priority || 50,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.models.set(model.id, model);
        this.updateIndices(model);
        logger_1.default.info('Model registered', {
            modelId: model.id,
            name: model.name,
            provider: model.provider,
            capabilities: model.capabilities.map(c => c.requestType),
        });
    }
    unregisterModel(modelId) {
        const model = this.models.get(modelId);
        if (!model) {
            return false;
        }
        this.models.delete(modelId);
        this.removeFromIndices(model);
        logger_1.default.info('Model unregistered', {
            modelId,
            name: model.name,
        });
        return true;
    }
    getModel(modelId) {
        return this.models.get(modelId);
    }
    getAllModels() {
        return Array.from(this.models.values());
    }
    getActiveModels() {
        return Array.from(this.models.values()).filter(model => model.isActive);
    }
    getModelsForRequestType(requestType) {
        const modelIds = this.capabilityIndex.get(requestType) || [];
        return modelIds
            .map(id => this.models.get(id))
            .filter((model) => model !== undefined && model.isActive);
    }
    getModelsByProvider(provider) {
        const modelIds = this.providerIndex.get(provider) || [];
        return modelIds
            .map(id => this.models.get(id))
            .filter((model) => model !== undefined);
    }
    updateModelPerformance(modelId, performance) {
        const model = this.models.get(modelId);
        if (!model) {
            logger_1.default.warn('Attempted to update performance for unknown model', { modelId });
            return;
        }
        model.performance = { ...model.performance, ...performance };
        model.updatedAt = new Date();
        logger_1.default.debug('Model performance updated', {
            modelId,
            performance: model.performance,
        });
    }
    setModelActive(modelId, isActive) {
        const model = this.models.get(modelId);
        if (!model) {
            logger_1.default.warn('Attempted to set active status for unknown model', { modelId });
            return;
        }
        model.isActive = isActive;
        model.updatedAt = new Date();
        logger_1.default.info('Model active status changed', {
            modelId,
            name: model.name,
            isActive,
        });
    }
    findBestModelsForRequest(requestType, requirements = {}) {
        const candidateModels = this.getModelsForRequestType(requestType);
        // Filter models based on requirements
        const filteredModels = candidateModels.filter(model => {
            // Check latency requirement
            if (requirements.maxLatency && model.performance.averageLatency > requirements.maxLatency) {
                return false;
            }
            // Check accuracy requirement
            if (requirements.minAccuracy && model.performance.accuracy < requirements.minAccuracy) {
                return false;
            }
            // Check cost requirement
            if (requirements.maxCost) {
                const capability = model.capabilities.find(c => c.requestType === requestType);
                if (capability && model.endpoint.pricing.inputTokenCost > requirements.maxCost) {
                    return false;
                }
            }
            // Check required capabilities
            if (requirements.requiredCapabilities) {
                const capability = model.capabilities.find(c => c.requestType === requestType);
                if (!capability)
                    return false;
                const hasAllCapabilities = requirements.requiredCapabilities.every(reqCap => capability.specializations.includes(reqCap));
                if (!hasAllCapabilities)
                    return false;
            }
            // Check excluded providers
            if (requirements.excludeProviders && requirements.excludeProviders.includes(model.provider)) {
                return false;
            }
            return true;
        });
        // Sort by composite score (performance + priority)
        return filteredModels.sort((a, b) => {
            const scoreA = this.calculateModelScore(a, requestType);
            const scoreB = this.calculateModelScore(b, requestType);
            return scoreB - scoreA;
        });
    }
    calculateModelScore(model, requestType) {
        const capability = model.capabilities.find(c => c.requestType === requestType);
        if (!capability)
            return 0;
        // Weighted score combining multiple factors
        const performanceScore = ((1 - model.performance.errorRate) * 0.3 +
            model.performance.availability * 0.2 +
            model.performance.accuracy * 0.2 +
            capability.qualityScore * 0.2 +
            (model.priority / 100) * 0.1);
        // Penalize high latency
        const latencyPenalty = Math.max(0, (model.performance.averageLatency - 1000) / 10000);
        return Math.max(0, performanceScore - latencyPenalty);
    }
    updateIndices(model) {
        // Update capability index
        for (const capability of model.capabilities) {
            const modelIds = this.capabilityIndex.get(capability.requestType) || [];
            if (!modelIds.includes(model.id)) {
                modelIds.push(model.id);
                this.capabilityIndex.set(capability.requestType, modelIds);
            }
        }
        // Update provider index
        const providerModels = this.providerIndex.get(model.provider) || [];
        if (!providerModels.includes(model.id)) {
            providerModels.push(model.id);
            this.providerIndex.set(model.provider, providerModels);
        }
    }
    removeFromIndices(model) {
        // Remove from capability index
        for (const capability of model.capabilities) {
            const modelIds = this.capabilityIndex.get(capability.requestType) || [];
            const index = modelIds.indexOf(model.id);
            if (index > -1) {
                modelIds.splice(index, 1);
                if (modelIds.length === 0) {
                    this.capabilityIndex.delete(capability.requestType);
                }
                else {
                    this.capabilityIndex.set(capability.requestType, modelIds);
                }
            }
        }
        // Remove from provider index
        const providerModels = this.providerIndex.get(model.provider) || [];
        const index = providerModels.indexOf(model.id);
        if (index > -1) {
            providerModels.splice(index, 1);
            if (providerModels.length === 0) {
                this.providerIndex.delete(model.provider);
            }
            else {
                this.providerIndex.set(model.provider, providerModels);
            }
        }
    }
    getRegistryStats() {
        const allModels = this.getAllModels();
        const activeModels = this.getActiveModels();
        const modelsByProvider = {};
        const modelsByRequestType = {};
        let totalLatency = 0;
        let totalAccuracy = 0;
        let totalAvailability = 0;
        let totalErrorRate = 0;
        for (const model of allModels) {
            // Count by provider
            modelsByProvider[model.provider] = (modelsByProvider[model.provider] || 0) + 1;
            // Count by request type
            for (const capability of model.capabilities) {
                modelsByRequestType[capability.requestType] =
                    (modelsByRequestType[capability.requestType] || 0) + 1;
            }
            // Accumulate performance metrics
            totalLatency += model.performance.averageLatency;
            totalAccuracy += model.performance.accuracy;
            totalAvailability += model.performance.availability;
            totalErrorRate += model.performance.errorRate;
        }
        const modelCount = allModels.length || 1; // Avoid division by zero
        return {
            totalModels: allModels.length,
            activeModels: activeModels.length,
            modelsByProvider,
            modelsByRequestType,
            averagePerformance: {
                latency: totalLatency / modelCount,
                accuracy: totalAccuracy / modelCount,
                availability: totalAvailability / modelCount,
                errorRate: totalErrorRate / modelCount,
            },
        };
    }
    // Method to validate model configuration
    validateModelConfig(config) {
        const errors = [];
        if (!config.id || typeof config.id !== 'string') {
            errors.push('Model ID is required and must be a string');
        }
        if (!config.name || typeof config.name !== 'string') {
            errors.push('Model name is required and must be a string');
        }
        if (!config.provider || typeof config.provider !== 'string') {
            errors.push('Model provider is required and must be a string');
        }
        if (!config.endpoint || typeof config.endpoint !== 'object') {
            errors.push('Model endpoint configuration is required');
        }
        if (!Array.isArray(config.capabilities) || config.capabilities.length === 0) {
            errors.push('Model must have at least one capability');
        }
        if (!config.constraints || typeof config.constraints !== 'object') {
            errors.push('Model constraints are required');
        }
        // Validate capabilities
        if (Array.isArray(config.capabilities)) {
            for (let i = 0; i < config.capabilities.length; i++) {
                const capability = config.capabilities[i];
                if (!Object.values(types_1.AIRequestType).includes(capability.requestType)) {
                    errors.push(`Invalid request type in capability ${i}: ${capability.requestType}`);
                }
                if (typeof capability.qualityScore !== 'number' || capability.qualityScore < 0 || capability.qualityScore > 1) {
                    errors.push(`Quality score in capability ${i} must be a number between 0 and 1`);
                }
            }
        }
        return {
            isValid: errors.length === 0,
            errors,
        };
    }
}
exports.ModelRegistry = ModelRegistry;
// Singleton instance
let modelRegistry = null;
function getModelRegistry() {
    if (!modelRegistry) {
        modelRegistry = new ModelRegistry();
    }
    return modelRegistry;
}
function createModelRegistry() {
    modelRegistry = new ModelRegistry();
    return modelRegistry;
}
//# sourceMappingURL=model-registry.js.map