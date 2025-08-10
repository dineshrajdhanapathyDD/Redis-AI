import { getCacheManager } from './cache-manager';
import { getSemanticCache } from './semantic-cache';
import { AIRequestType } from '@/types';
import { createCacheableRequest } from './index';
import logger from '@/utils/logger';

export interface CacheWarmingConfig {
  enablePredictiveWarming: boolean;
  enablePatternBasedWarming: boolean;
  enableScheduledWarming: boolean;
  warmingBatchSize: number;
  warmingInterval: number; // in milliseconds
  maxWarmingQueries: number;
  popularityThreshold: number;
}

export interface WarmingQuery {
  query: string;
  type: AIRequestType;
  model?: string;
  priority: number;
  frequ