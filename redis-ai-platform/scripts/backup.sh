#!/bin/bash

# Redis AI Platform Backup Script
# This script creates backups of Redis data, PostgreSQL database, and application configurations

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ENVIRONMENT="${ENVIRONMENT:-production}"

# Logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${BACKUP_DIR}/backup.log"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "${BACKUP_DIR}/backup.log" >&2
    exit 1
}

# Create backup directory
mkdir -p "${BACKUP_DIR}"

log "Starting backup process for environment: ${ENVIRONMENT}"

# Function to backup Redis data
backup_redis() {
    log "Starting Redis backup..."
    
    local redis_host="${REDIS_HOST:-redis-cluster}"
    local redis_port="${REDIS_PORT:-6379}"
    local redis_password="${REDIS_PASSWORD}"
    local backup_file="${BACKUP_DIR}/redis_backup_${TIMESTAMP}.rdb"
    
    if [[ -z "${redis_password}" ]]; then
        error "REDIS_PASSWORD environment variable is required"
    fi
    
    # Create Redis backup using BGSAVE
    redis-cli -h "${redis_host}" -p "${redis_port}" -a "${redis_password}" --no-auth-warning BGSAVE
    
    # Wait for backup to complete
    while [[ $(redis-cli -h "${redis_host}" -p "${redis_port}" -a "${redis_password}" --no-auth-warning LASTSAVE) -eq $(redis-cli -h "${redis_host}" -p "${redis_port}" -a "${redis_password}" --no-auth-warning LASTSAVE) ]]; do
        sleep 1
    done
    
    # Copy the RDB file
    kubectl exec -n redis-ai-platform deployment/redis-cluster -- cat /data/dump.rdb > "${backup_file}"
    
    # Compress the backup
    gzip "${backup_file}"
    
    log "Redis backup completed: ${backup_file}.gz"
}

# Function to backup PostgreSQL database
backup_postgres() {
    log "Starting PostgreSQL backup..."
    
    local db_host="${DB_HOST}"
    local db_port="${DB_PORT:-5432}"
    local db_name="${DB_NAME:-ai_platform}"
    local db_user="${DB_USER:-postgres}"
    local db_password="${DB_PASSWORD}"
    local backup_file="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.sql"
    
    if [[ -z "${db_host}" || -z "${db_password}" ]]; then
        error "DB_HOST and DB_PASSWORD environment variables are required"
    fi
    
    # Set password for pg_dump
    export PGPASSWORD="${db_password}"
    
    # Create database backup
    pg_dump -h "${db_host}" -p "${db_port}" -U "${db_user}" -d "${db_name}" \
        --verbose --clean --no-owner --no-privileges > "${backup_file}"
    
    # Compress the backup
    gzip "${backup_file}"
    
    log "PostgreSQL backup completed: ${backup_file}.gz"
    
    # Unset password
    unset PGPASSWORD
}

# Function to backup Kubernetes configurations
backup_k8s_configs() {
    log "Starting Kubernetes configurations backup..."
    
    local config_backup_dir="${BACKUP_DIR}/k8s_configs_${TIMESTAMP}"
    mkdir -p "${config_backup_dir}"
    
    # Backup all resources in the redis-ai-platform namespace
    kubectl get all,configmaps,secrets,pvc,ingress -n redis-ai-platform -o yaml > "${config_backup_dir}/redis-ai-platform-resources.yaml"
    
    # Backup monitoring namespace
    kubectl get all,configmaps,secrets,pvc -n monitoring -o yaml > "${config_backup_dir}/monitoring-resources.yaml"
    
    # Backup custom resource definitions
    kubectl get crd -o yaml > "${config_backup_dir}/custom-resources.yaml"
    
    # Backup RBAC configurations
    kubectl get clusterroles,clusterrolebindings,roles,rolebindings -o yaml > "${config_backup_dir}/rbac-configs.yaml"
    
    # Compress the configurations
    tar -czf "${config_backup_dir}.tar.gz" -C "${BACKUP_DIR}" "k8s_configs_${TIMESTAMP}"
    rm -rf "${config_backup_dir}"
    
    log "Kubernetes configurations backup completed: ${config_backup_dir}.tar.gz"
}

# Function to backup application data
backup_app_data() {
    log "Starting application data backup..."
    
    local app_backup_dir="${BACKUP_DIR}/app_data_${TIMESTAMP}"
    mkdir -p "${app_backup_dir}"
    
    # Backup persistent volume data
    kubectl exec -n redis-ai-platform deployment/api-server -- tar -czf - /app/uploads 2>/dev/null | tar -xzf - -C "${app_backup_dir}" || true
    
    # Backup logs
    kubectl logs -n redis-ai-platform deployment/api-server --tail=10000 > "${app_backup_dir}/api-server.log" || true
    kubectl logs -n redis-ai-platform deployment/frontend --tail=10000 > "${app_backup_dir}/frontend.log" || true
    
    # Compress the application data
    tar -czf "${app_backup_dir}.tar.gz" -C "${BACKUP_DIR}" "app_data_${TIMESTAMP}"
    rm -rf "${app_backup_dir}"
    
    log "Application data backup completed: ${app_backup_dir}.tar.gz"
}

# Function to upload backups to S3
upload_to_s3() {
    log "Uploading backups to S3..."
    
    local s3_bucket="${S3_BACKUP_BUCKET}"
    local s3_prefix="${S3_BACKUP_PREFIX:-backups/${ENVIRONMENT}}"
    
    if [[ -z "${s3_bucket}" ]]; then
        log "S3_BACKUP_BUCKET not set, skipping S3 upload"
        return
    fi
    
    # Upload all backup files
    for file in "${BACKUP_DIR}"/*_${TIMESTAMP}*; do
        if [[ -f "${file}" ]]; then
            local filename=$(basename "${file}")
            aws s3 cp "${file}" "s3://${s3_bucket}/${s3_prefix}/${filename}" --storage-class STANDARD_IA
            log "Uploaded ${filename} to S3"
        fi
    done
    
    log "S3 upload completed"
}

# Function to clean up old backups
cleanup_old_backups() {
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."
    
    # Clean up local backups
    find "${BACKUP_DIR}" -name "*_[0-9]*" -type f -mtime +${RETENTION_DAYS} -delete
    
    # Clean up S3 backups if configured
    local s3_bucket="${S3_BACKUP_BUCKET}"
    local s3_prefix="${S3_BACKUP_PREFIX:-backups/${ENVIRONMENT}}"
    
    if [[ -n "${s3_bucket}" ]]; then
        local cutoff_date=$(date -d "${RETENTION_DAYS} days ago" +%Y-%m-%d)
        aws s3 ls "s3://${s3_bucket}/${s3_prefix}/" | while read -r line; do
            local file_date=$(echo "${line}" | awk '{print $1}')
            local file_name=$(echo "${line}" | awk '{print $4}')
            
            if [[ "${file_date}" < "${cutoff_date}" ]]; then
                aws s3 rm "s3://${s3_bucket}/${s3_prefix}/${file_name}"
                log "Deleted old S3 backup: ${file_name}"
            fi
        done
    fi
    
    log "Cleanup completed"
}

# Function to verify backups
verify_backups() {
    log "Verifying backup integrity..."
    
    local verification_failed=false
    
    # Verify Redis backup
    local redis_backup="${BACKUP_DIR}/redis_backup_${TIMESTAMP}.rdb.gz"
    if [[ -f "${redis_backup}" ]]; then
        if gzip -t "${redis_backup}"; then
            log "Redis backup verification: PASSED"
        else
            log "Redis backup verification: FAILED"
            verification_failed=true
        fi
    fi
    
    # Verify PostgreSQL backup
    local postgres_backup="${BACKUP_DIR}/postgres_backup_${TIMESTAMP}.sql.gz"
    if [[ -f "${postgres_backup}" ]]; then
        if gzip -t "${postgres_backup}"; then
            log "PostgreSQL backup verification: PASSED"
        else
            log "PostgreSQL backup verification: FAILED"
            verification_failed=true
        fi
    fi
    
    # Verify Kubernetes configs backup
    local k8s_backup="${BACKUP_DIR}/k8s_configs_${TIMESTAMP}.tar.gz"
    if [[ -f "${k8s_backup}" ]]; then
        if tar -tzf "${k8s_backup}" >/dev/null 2>&1; then
            log "Kubernetes configs backup verification: PASSED"
        else
            log "Kubernetes configs backup verification: FAILED"
            verification_failed=true
        fi
    fi
    
    if [[ "${verification_failed}" == "true" ]]; then
        error "Backup verification failed"
    else
        log "All backup verifications passed"
    fi
}

# Function to send notifications
send_notification() {
    local status="$1"
    local message="$2"
    
    # Send Slack notification if webhook is configured
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color="good"
        if [[ "${status}" == "error" ]]; then
            color="danger"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"${color}\",\"title\":\"Backup ${status}\",\"text\":\"${message}\",\"footer\":\"Redis AI Platform\",\"ts\":$(date +%s)}]}" \
            "${SLACK_WEBHOOK_URL}" || true
    fi
    
    # Send email notification if configured
    if [[ -n "${EMAIL_RECIPIENT:-}" ]]; then
        echo "${message}" | mail -s "Redis AI Platform Backup ${status}" "${EMAIL_RECIPIENT}" || true
    fi
}

# Main execution
main() {
    local start_time=$(date +%s)
    
    trap 'error "Backup process interrupted"' INT TERM
    
    # Check required tools
    command -v kubectl >/dev/null 2>&1 || error "kubectl is required but not installed"
    command -v redis-cli >/dev/null 2>&1 || error "redis-cli is required but not installed"
    command -v pg_dump >/dev/null 2>&1 || error "pg_dump is required but not installed"
    
    # Perform backups
    backup_redis
    backup_postgres
    backup_k8s_configs
    backup_app_data
    
    # Verify backups
    verify_backups
    
    # Upload to S3 if configured
    upload_to_s3
    
    # Clean up old backups
    cleanup_old_backups
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    local success_message="Backup completed successfully in ${duration} seconds for environment: ${ENVIRONMENT}"
    log "${success_message}"
    send_notification "success" "${success_message}"
}

# Run main function
main "$@"