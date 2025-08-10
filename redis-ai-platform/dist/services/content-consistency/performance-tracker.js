"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceTracker = exports.Priority = exports.RecommendationType = exports.TrendDirection = exports.ImpactLevel = exports.InsightCategory = exports.InsightType = void 0;
const logger_1 = require("../../utils/logger");
expo;
rt;
var InsightType;
(function (InsightType) {
    InsightType["PERFORMANCE"] = "performance";
    InsightType["AUDIENCE"] = "audience";
    InsightType["CONTENT"] = "content";
    InsightType["TIMING"] = "timing";
    InsightType["PLATFORM"] = "platform";
    InsightType["COMPETITIVE"] = "competitive";
})(InsightType || (exports.InsightType = InsightType = {}));
var InsightCategory;
(function (InsightCategory) {
    InsightCategory["OPPORTUNITY"] = "opportunity";
    InsightCategory["RISK"] = "risk";
    InsightCategory["TREND"] = "trend";
    InsightCategory["ANOMALY"] = "anomaly";
    InsightCategory["BENCHMARK"] = "benchmark";
})(InsightCategory || (exports.InsightCategory = InsightCategory = {}));
var ImpactLevel;
(function (ImpactLevel) {
    ImpactLevel["HIGH"] = "high";
    ImpactLevel["MEDIUM"] = "medium";
    ImpactLevel["LOW"] = "low";
})(ImpactLevel || (exports.ImpactLevel = ImpactLevel = {}));
var TrendDirection;
(function (TrendDirection) {
    TrendDirection["INCREASING"] = "increasing";
    TrendDirection["DECREASING"] = "decreasing";
    TrendDirection["STABLE"] = "stable";
    TrendDirection["VOLATILE"] = "volatile";
})(TrendDirection || (exports.TrendDirection = TrendDirection = {}));
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["CONTENT_OPTIMIZATION"] = "content_optimization";
    RecommendationType["TIMING_ADJUSTMENT"] = "timing_adjustment";
    RecommendationType["AUDIENCE_TARGETING"] = "audience_targeting";
    RecommendationType["PLATFORM_STRATEGY"] = "platform_strategy";
    RecommendationType["CREATIVE_VARIATION"] = "creative_variation";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
var Priority;
(function (Priority) {
    Priority["HIGH"] = "high";
    Priority["MEDIUM"] = "medium";
    Priority["LOW"] = "low";
})(Priority || (exports.Priority = Priority = {}));
class PerformanceTracker {
    redis;
    PERFORMANCE_PREFIX = 'performance';
    INSIGHT_PREFIX = 'insight';
    REPORT_PREFIX = 'report';
    constructor(redis) {
        this.redis = redis;
    }
    async trackPerformance(performance) {
        const key = `${this.PERFORMANCE_PREFIX}:${performance.contentId}:${performance.platformId}`;
        // Store current performance data
        await this.redis.hset(key, 'data', JSON.stringify(performance));
        // Add to time series for trend analysis
        const timeSeriesKey = `${key}:timeseries`;
        await this.redis.zadd(timeSeriesKey, performance.timestamp.getTime(), JSON.stringify(performance));
        // Keep only last 90 days of data
        const cutoff = performance.timestamp.getTime() - (90 * 24 * 60 * 60 * 1000);
        await this.redis.zremrangebyscore(timeSeriesKey, 0, cutoff);
        logger_1.logger.info(`Tracked performance for content ${performance.contentId} on ${performance.platformId}`);
    }
    async getPerformance(contentId, platformId) {
        const key = `${this.PERFORMANCE_PREFIX}:${contentId}:${platformId}`;
        const data = await this.redis.hget(key, 'data');
        return data ? JSON.parse(data) : null;
    }
    async getPerformanceHistory(contentId, platformId, timeframe) {
        const key = `${this.PERFORMANCE_PREFIX}:${contentId}:${platformId}:timeseries`;
        const results = await this.redis.zrangebyscore(key, timeframe.start.getTime(), timeframe.end.getTime());
        return results.map(result => JSON.parse(result));
    }
    async generateInsights(contentIds, timeframe) {
        const insights = [];
        for (const contentId of contentIds) {
            // Get performance data for all platforms
            const platformKeys = await this.redis.keys(`${this.PERFORMANCE_PREFIX}:${contentId}:*`);
            for (const key of platformKeys) {
                const platformId = key.split(':').pop();
                if (!platformId)
                    continue;
                const history = await this.getPerformanceHistory(contentId, platformId, timeframe);
                if (history.length === 0)
                    continue;
                // Generate various types of insights
                const performanceInsights = await this.analyzePerformanceTrends(contentId, history);
                const audienceInsights = await this.analyzeAudiencePatterns(contentId, history);
                const timingInsights = await this.analyzeTimingPatterns(contentId, history);
                insights.push(...performanceInsights, ...audienceInsights, ...timingInsights);
            }
        }
        // Store insights
        for (const insight of insights) {
            await this.storeInsight(insight);
        }
        return insights;
    }
    async generatePerformanceReport(contentIds, timeframe) {
        const insights = await this.generateInsights(contentIds, timeframe);
        const summary = await this.generatePerformanceSummary(contentIds, timeframe);
        const recommendations = await this.generateRecommendations(insights, summary);
        const benchmarks = await this.generateBenchmarkComparisons(contentIds, timeframe);
        const report = {
            id: this.generateReportId(),
            contentIds,
            timeframe,
            summary,
            insights,
            recommendations,
            benchmarks,
            generatedAt: new Date()
        };
        await this.storeReport(report);
        return report;
    }
    async trackBrandImpact(contentId, brandImpact) {
        const key = `brand_impact:${contentId}`;
        await this.redis.hset(key, 'data', JSON.stringify({
            contentId,
            brandImpact,
            timestamp: new Date()
        }));
        logger_1.logger.info(`Tracked brand impact for content ${contentId}`);
    }
    async getBrandImpactTrends(contentIds, timeframe) {
        const trends = [];
        for (const contentId of contentIds) {
            const key = `brand_impact:${contentId}`;
            const data = await this.redis.hget(key, 'data');
            if (data) {
                const impactData = JSON.parse(data);
                // Analyze trends in brand impact metrics
                const trend = await this.analyzeBrandImpactTrend(impactData, timeframe);
                if (trend) {
                    trends.push(trend);
                }
            }
        }
        return trends;
    }
    async analyzePerformanceTrends(contentId, history) {
        const insights = [];
        if (history.length < 2)
            return insights;
        // Analyze engagement trend
        const engagementTrend = this.calculateTrend(history.map(h => h.engagement.engagementRate));
        if (Math.abs(engagementTrend.magnitude) > 0.1) {
            insights.push({
                id: this.generateInsightId(),
                contentId,
                type: InsightType.PERFORMANCE,
                category: engagementTrend.direction === TrendDirection.INCREASING ?
                    InsightCategory.OPPORTUNITY : InsightCategory.RISK,
                title: `Engagement ${engagementTrend.direction}`,
                description: `Engagement rate has been ${engagementTrend.direction} by ${(engagementTrend.magnitude * 100).toFixed(1)}%`,
                impact: this.categorizeImpact(engagementTrend.magnitude),
                confidence: 0.8,
                recommendations: this.generateEngagementRecommendations(engagementTrend),
                dataPoints: [{
                        metric: 'engagement_rate',
                        value: history[history.length - 1].engagement.engagementRate,
                        benchmark: history[0].engagement.engagementRate,
                        variance: engagementTrend.magnitude,
                        significance: 0.8
                    }],
                trends: [{
                        metric: 'engagement_rate',
                        direction: engagementTrend.direction,
                        magnitude: engagementTrend.magnitude,
                        duration: `${history.length} periods`,
                        prediction: {
                            nextPeriod: history[history.length - 1].engagement.engagementRate * (1 + engagementTrend.magnitude),
                            confidence: 0.7,
                            factors: ['historical trend', 'seasonal patterns']
                        }
                    }]
            });
        }
        return insights;
    }
    async analyzeAudiencePatterns(contentId, history) {
        const insights = [];
        // Analyze audience growth patterns
        const reachTrend = this.calculateTrend(history.map(h => h.reach.totalReach));
        if (reachTrend.magnitude > 0.15) {
            insights.push({
                id: this.generateInsightId(),
                contentId,
                type: InsightType.AUDIENCE,
                category: InsightCategory.OPPORTUNITY,
                title: 'Audience Growth Opportunity',
                description: `Content is reaching ${(reachTrend.magnitude * 100).toFixed(1)}% more people`,
                impact: ImpactLevel.HIGH,
                confidence: 0.85,
                recommendations: [
                    'Scale up similar content',
                    'Increase posting frequency',
                    'Expand to similar audiences'
                ],
                dataPoints: [],
                trends: []
            });
        }
        return insights;
    }
    async analyzeTimingPatterns(contentId, history) {
        const insights = [];
        // Analyze timing patterns based on performance data
        // This would involve more complex analysis of when content performs best
        return insights;
    }
    calculateTrend(values) {
        if (values.length < 2) {
            return { direction: TrendDirection.STABLE, magnitude: 0 };
        }
        const first = values[0];
        const last = values[values.length - 1];
        const change = (last - first) / first;
        let direction;
        if (Math.abs(change) < 0.05) {
            direction = TrendDirection.STABLE;
        }
        else if (change > 0) {
            direction = TrendDirection.INCREASING;
        }
        else {
            direction = TrendDirection.DECREASING;
        }
        return { direction, magnitude: Math.abs(change) };
    }
    categorizeImpact(magnitude) {
        if (magnitude > 0.2)
            return ImpactLevel.HIGH;
        if (magnitude > 0.1)
            return ImpactLevel.MEDIUM;
        return ImpactLevel.LOW;
    }
    generateEngagementRecommendations(trend) {
        if (trend.direction === TrendDirection.INCREASING) {
            return [
                'Continue current content strategy',
                'Scale up successful content types',
                'Analyze what\'s driving the improvement'
            ];
        }
        else {
            return [
                'Review recent content changes',
                'Test different content formats',
                'Analyze audience feedback for insights'
            ];
        }
    }
    async generatePerformanceSummary(contentIds, timeframe) {
        // Generate summary statistics across all content
        return {
            totalContent: contentIds.length,
            totalEngagement: 0,
            totalReach: 0,
            totalConversions: 0,
            averagePerformance: 0,
            topPerformers: [],
            underperformers: []
        };
    }
    async generateRecommendations(insights, summary) {
        // Generate actionable recommendations based on insights
        return [];
    }
    async generateBenchmarkComparisons(contentIds, timeframe) {
        // Generate benchmark comparisons
        return [];
    }
    async analyzeBrandImpactTrend(impactData, timeframe) {
        // Analyze brand impact trends
        return null;
    }
    async storeInsight(insight) {
        await this.redis.hset(`${this.INSIGHT_PREFIX}:${insight.id}`, 'data', JSON.stringify(insight));
    }
    async storeReport(report) {
        await this.redis.hset(`${this.REPORT_PREFIX}:${report.id}`, 'data', JSON.stringify(report));
    }
    generateInsightId() {
        return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.PerformanceTracker = PerformanceTracker;
//# sourceMappingURL=performance-tracker.js.map