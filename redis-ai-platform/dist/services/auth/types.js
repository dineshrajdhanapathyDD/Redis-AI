"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspacePermission = exports.WorkspaceRole = exports.SecurityEventType = void 0;
var SecurityEventType;
(function (SecurityEventType) {
    SecurityEventType["LOGIN_SUCCESS"] = "login_success";
    SecurityEventType["LOGIN_FAILED"] = "login_failed";
    SecurityEventType["LOGIN_BLOCKED"] = "login_blocked";
    SecurityEventType["LOGOUT"] = "logout";
    SecurityEventType["PASSWORD_CHANGED"] = "password_changed";
    SecurityEventType["PASSWORD_RESET_REQUESTED"] = "password_reset_requested";
    SecurityEventType["PASSWORD_RESET_COMPLETED"] = "password_reset_completed";
    SecurityEventType["MFA_ENABLED"] = "mfa_enabled";
    SecurityEventType["MFA_DISABLED"] = "mfa_disabled";
    SecurityEventType["MFA_BACKUP_USED"] = "mfa_backup_used";
    SecurityEventType["ACCOUNT_LOCKED"] = "account_locked";
    SecurityEventType["ACCOUNT_UNLOCKED"] = "account_unlocked";
    SecurityEventType["PERMISSION_DENIED"] = "permission_denied";
    SecurityEventType["SUSPICIOUS_ACTIVITY"] = "suspicious_activity";
    SecurityEventType["TOKEN_REFRESH"] = "token_refresh";
    SecurityEventType["TOKEN_REVOKED"] = "token_revoked";
})(SecurityEventType || (exports.SecurityEventType = SecurityEventType = {}));
var WorkspaceRole;
(function (WorkspaceRole) {
    WorkspaceRole["OWNER"] = "owner";
    WorkspaceRole["ADMIN"] = "admin";
    WorkspaceRole["MEMBER"] = "member";
    WorkspaceRole["VIEWER"] = "viewer";
    WorkspaceRole["GUEST"] = "guest";
})(WorkspaceRole || (exports.WorkspaceRole = WorkspaceRole = {}));
var WorkspacePermission;
(function (WorkspacePermission) {
    WorkspacePermission["READ"] = "read";
    WorkspacePermission["WRITE"] = "write";
    WorkspacePermission["DELETE"] = "delete";
    WorkspacePermission["INVITE"] = "invite";
    WorkspacePermission["MANAGE_MEMBERS"] = "manage_members";
    WorkspacePermission["MANAGE_SETTINGS"] = "manage_settings";
    WorkspacePermission["EXPORT_DATA"] = "export_data";
    WorkspacePermission["VIEW_ANALYTICS"] = "view_analytics";
})(WorkspacePermission || (exports.WorkspacePermission = WorkspacePermission = {}));
//# sourceMappingURL=types.js.map