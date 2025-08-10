# Deployment Guide

This guide covers deploying the Redis AI Platform to various environments, from local development to production-scale deployments.

## Table of Contents

- [Local Development](#local-development)
- [Docker Deployment](#docker-deployment)
- [Kubernetes Deployment](#kubernetes-deployment)
- [Cloud Deployments](#cloud-deployments)
- [Production Considerations](#production-considerations)
- [Monitoring and Observability](#monitoring-and-observability)
- [Backup and Recovery](#backup-and-recovery)

## Local Development

### Prerequisites

- Node.js 18+
- Redis 7.0+ with modules (RedisSearch, RedisTimeSeries, RedisJSON)
- Docker and Docker Compose (recommended)

### Quick Setup

```bash
# Clone repository
git clone https://github.com/your-org/redis-ai-platform.git
cd redis-ai-platform

# Install dependencies
npm install

# Start Redis with required modules
docker-compose up -d redis

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Run migrations
npm run migrate

# Start development server
npm run dev
```

### Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Authentication
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# AI Model APIs
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
HUGGINGFACE_API_KEY=your-huggingface-api-key

# Performance
ENABLE_PERFORMANCE_OPTIMIZATION=true
CONNECTION_POOL_MIN=5
CONNECTION_POOL_MAX=20
CACHE_MAX_SIZE=100000000

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
HEALTH_CHECK_INTERVAL=30000
```

## Docker Deployment

### Single Container

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t redis-ai-platform .
docker run -p 3000:3000 --env-file .env redis-ai-platform
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis/redis-stack:latest
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - app
    restart: unless-stopped

volumes:
  redis_data:
```

```bash
# Deploy with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale app=3
```

## Kubernetes Deployment

### Namespace

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: redis-ai-platform
  labels:
    name: redis-ai-platform
```

### ConfigMap

```yaml
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: redis-ai-config
  namespace: redis-ai-platform
data:
  NODE_ENV: "production"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  PORT: "3000"
  ENABLE_PERFORMANCE_OPTIMIZATION: "true"
  CONNECTION_POOL_MIN: "10"
  CONNECTION_POOL_MAX: "50"
```

### Secrets

```yaml
# k8s/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: redis-ai-secrets
  namespace: redis-ai-platform
type: Opaque
data:
  JWT_SECRET: <base64-encoded-secret>
  OPENAI_API_KEY: <base64-encoded-key>
  ANTHROPIC_API_KEY: <base64-encoded-key>
  REDIS_PASSWORD: <base64-encoded-password>
```

### Redis Deployment

```yaml
# k8s/redis-deployment.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: redis-ai-platform
spec:
  serviceName: redis-service
  replicas: 3
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis/redis-stack:latest
        ports:
        - containerPort: 6379
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: redis-ai-secrets
              key: REDIS_PASSWORD
        volumeMounts:
        - name: redis-data
          mountPath: /data
        - name: redis-config
          mountPath: /usr/local/etc/redis/redis.conf
          subPath: redis.conf
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        livenessProbe:
          exec:
            command:
            - redis-cli
            - ping
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - redis-cli
            - ping
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: redis-config
        configMap:
          name: redis-config
  volumeClaimTemplates:
  - metadata:
      name: redis-data
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
```

### Application Deployment

```yaml
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-ai-api
  namespace: redis-ai-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: redis-ai-api
  template:
    metadata:
      labels:
        app: redis-ai-api
    spec:
      containers:
      - name: api
        image: redis-ai-platform:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: redis-ai-config
        - secretRef:
            name: redis-ai-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: POD_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: POD_NAMESPACE
          valueFrom:
            fieldRef:
              fieldPath: metadata.namespace
```

### Services

```yaml
# k8s/services.yaml
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: redis-ai-platform
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: redis-ai-api-service
  namespace: redis-ai-platform
spec:
  selector:
    app: redis-ai-api
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
```

### Ingress

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: redis-ai-ingress
  namespace: redis-ai-platform
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.redis-ai-platform.com
    secretName: redis-ai-tls
  rules:
  - host: api.redis-ai-platform.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: redis-ai-api-service
            port:
              number: 80
```

### Horizontal Pod Autoscaler

```yaml
# k8s/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: redis-ai-api-hpa
  namespace: redis-ai-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: redis-ai-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Deployment Commands

```bash
# Apply all configurations
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n redis-ai-platform

# View logs
kubectl logs -f deployment/redis-ai-api -n redis-ai-platform

# Scale deployment
kubectl scale deployment redis-ai-api --replicas=5 -n redis-ai-platform

# Update deployment
kubectl set image deployment/redis-ai-api api=redis-ai-platform:v1.1.0 -n redis-ai-platform

# Rollback deployment
kubectl rollout undo deployment/redis-ai-api -n redis-ai-platform
```

## Cloud Deployments

### AWS EKS

```bash
# Create EKS cluster
eksctl create cluster --name redis-ai-platform --region us-west-2 --nodes 3

# Configure kubectl
aws eks update-kubeconfig --region us-west-2 --name redis-ai-platform

# Deploy application
kubectl apply -f k8s/
```

### Google GKE

```bash
# Create GKE cluster
gcloud container clusters create redis-ai-platform \
  --zone us-central1-a \
  --num-nodes 3 \
  --enable-autoscaling \
  --min-nodes 1 \
  --max-nodes 10

# Get credentials
gcloud container clusters get-credentials redis-ai-platform --zone us-central1-a

# Deploy application
kubectl apply -f k8s/
```

### Azure AKS

```bash
# Create AKS cluster
az aks create \
  --resource-group redis-ai-platform \
  --name redis-ai-platform \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group redis-ai-platform --name redis-ai-platform

# Deploy application
kubectl apply -f k8s/
```

## Production Considerations

### Security

1. **Network Security**
   ```yaml
   # Network policies
   apiVersion: networking.k8s.io/v1
   kind: NetworkPolicy
   metadata:
     name: redis-ai-network-policy
   spec:
     podSelector:
       matchLabels:
         app: redis-ai-api
     policyTypes:
     - Ingress
     - Egress
     ingress:
     - from:
       - podSelector:
           matchLabels:
             app: frontend
       ports:
       - protocol: TCP
         port: 3000
   ```

2. **Pod Security Standards**
   ```yaml
   apiVersion: v1
   kind: Pod
   spec:
     securityContext:
       runAsNonRoot: true
       runAsUser: 1001
       fsGroup: 1001
     containers:
     - name: api
       securityContext:
         allowPrivilegeEscalation: false
         readOnlyRootFilesystem: true
         capabilities:
           drop:
           - ALL
   ```

3. **Secrets Management**
   ```bash
   # Use external secret management
   kubectl apply -f https://raw.githubusercontent.com/external-secrets/external-secrets/main/deploy/crds/bundle.yaml
   kubectl apply -f https://raw.githubusercontent.com/external-secrets/external-secrets/main/deploy/charts/external-secrets/templates/deployment.yaml
   ```

### Performance Optimization

1. **Resource Limits**
   ```yaml
   resources:
     requests:
       memory: "1Gi"
       cpu: "500m"
     limits:
       memory: "2Gi"
       cpu: "1000m"
   ```

2. **Node Affinity**
   ```yaml
   affinity:
     nodeAffinity:
       requiredDuringSchedulingIgnoredDuringExecution:
         nodeSelectorTerms:
         - matchExpressions:
           - key: node-type
             operator: In
             values:
             - compute-optimized
   ```

3. **Pod Disruption Budget**
   ```yaml
   apiVersion: policy/v1
   kind: PodDisruptionBudget
   metadata:
     name: redis-ai-api-pdb
   spec:
     minAvailable: 2
     selector:
       matchLabels:
         app: redis-ai-api
   ```

### High Availability

1. **Multi-Zone Deployment**
   ```yaml
   affinity:
     podAntiAffinity:
       preferredDuringSchedulingIgnoredDuringExecution:
       - weight: 100
         podAffinityTerm:
           labelSelector:
             matchExpressions:
             - key: app
               operator: In
               values:
               - redis-ai-api
           topologyKey: topology.kubernetes.io/zone
   ```

2. **Redis Cluster**
   ```yaml
   # Redis cluster configuration
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: redis-cluster-config
   data:
     redis.conf: |
       cluster-enabled yes
       cluster-config-file nodes.conf
       cluster-node-timeout 5000
       appendonly yes
   ```

## Monitoring and Observability

### Prometheus Monitoring

```yaml
# k8s/monitoring/prometheus.yaml
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: redis-ai-platform
spec:
  selector:
    matchLabels:
      app: redis-ai-api
  endpoints:
  - port: metrics
    interval: 30s
    path: /metrics
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Redis AI Platform",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
          }
        ]
      }
    ]
  }
}
```

### Logging

```yaml
# Fluentd configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*redis-ai*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
      format json
    </source>
    
    <match kubernetes.**>
      @type elasticsearch
      host elasticsearch.logging.svc.cluster.local
      port 9200
      index_name redis-ai-platform
    </match>
```

## Backup and Recovery

### Redis Backup

```bash
#!/bin/bash
# scripts/backup-redis.sh

BACKUP_DIR="/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="redis_backup_${DATE}.rdb"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup Redis data
kubectl exec -n redis-ai-platform redis-0 -- redis-cli BGSAVE
kubectl cp redis-ai-platform/redis-0:/data/dump.rdb $BACKUP_DIR/$BACKUP_FILE

# Compress backup
gzip $BACKUP_DIR/$BACKUP_FILE

# Upload to cloud storage (example with AWS S3)
aws s3 cp $BACKUP_DIR/${BACKUP_FILE}.gz s3://redis-ai-backups/

# Clean up old backups (keep last 7 days)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_FILE}.gz"
```

### Automated Backup CronJob

```yaml
# k8s/backup-cronjob.yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: redis-backup
  namespace: redis-ai-platform
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: redis:alpine
            command:
            - /bin/sh
            - -c
            - |
              redis-cli -h redis-service BGSAVE
              sleep 10
              cp /data/dump.rdb /backup/redis_backup_$(date +%Y%m%d_%H%M%S).rdb
            volumeMounts:
            - name: backup-storage
              mountPath: /backup
          volumes:
          - name: backup-storage
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

### Disaster Recovery

```bash
#!/bin/bash
# scripts/restore-redis.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

# Stop Redis
kubectl scale statefulset redis --replicas=0 -n redis-ai-platform

# Restore backup
kubectl cp $BACKUP_FILE redis-ai-platform/redis-0:/data/dump.rdb

# Start Redis
kubectl scale statefulset redis --replicas=3 -n redis-ai-platform

# Wait for Redis to be ready
kubectl wait --for=condition=ready pod/redis-0 -n redis-ai-platform --timeout=300s

echo "Redis restored from backup: $BACKUP_FILE"
```

## Troubleshooting

### Common Issues

1. **Pod Startup Issues**
   ```bash
   # Check pod status
   kubectl describe pod <pod-name> -n redis-ai-platform
   
   # View logs
   kubectl logs <pod-name> -n redis-ai-platform
   
   # Check events
   kubectl get events -n redis-ai-platform --sort-by='.lastTimestamp'
   ```

2. **Redis Connection Issues**
   ```bash
   # Test Redis connectivity
   kubectl exec -it redis-0 -n redis-ai-platform -- redis-cli ping
   
   # Check Redis logs
   kubectl logs redis-0 -n redis-ai-platform
   ```

3. **Performance Issues**
   ```bash
   # Check resource usage
   kubectl top pods -n redis-ai-platform
   
   # View metrics
   kubectl port-forward svc/prometheus 9090:9090
   ```

### Health Checks

```bash
#!/bin/bash
# scripts/health-check.sh

# Check API health
curl -f http://api.redis-ai-platform.com/api/health || exit 1

# Check Redis health
kubectl exec redis-0 -n redis-ai-platform -- redis-cli ping || exit 1

# Check all pods are running
kubectl get pods -n redis-ai-platform | grep -v Running && exit 1

echo "All health checks passed"
```

This deployment guide provides comprehensive instructions for deploying the Redis AI Platform across different environments, from local development to production-scale Kubernetes deployments. The configurations include security best practices, monitoring, backup strategies, and troubleshooting guidance.