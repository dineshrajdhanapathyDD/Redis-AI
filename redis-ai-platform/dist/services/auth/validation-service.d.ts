export interface ValidationRule {
    field: string;
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'email' | 'url' | 'uuid' | 'date' | 'array' | 'object';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    custom?: (value: any) => boolean | string;
    sanitize?: boolean;
    allowHtml?: boolean;
}
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    sanitizedData?: any;
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
}
export declare class ValidationService {
    /**
     * Validate data against rules
     */
    validate(data: any, rules: ValidationRule[]): ValidationResult;
    /**
     * Validate a single field
     */
    private validateField;
    /**
     * Validate type
     */
    private validateType;
    /**
     * Sanitize value
     */
    private sanitizeValue;
    /**
     * Escape special characters
     */
    private escapeSpecialChars;
    /**
     * Get nested value from object
     */
    private getNestedValue;
    /**
     * Set nested value in object
     */
    private setNestedValue;
    /**
     * Common validation rules
     */
    static commonRules: {
        email: {
            field: string;
            required: boolean;
            type: "email";
            maxLength: number;
            sanitize: boolean;
        };
        password: {
            field: string;
            required: boolean;
            type: "string";
            minLength: number;
            maxLength: number;
            pattern: RegExp;
        };
        username: {
            field: string;
            required: boolean;
            type: "string";
            minLength: number;
            maxLength: number;
            pattern: RegExp;
            sanitize: boolean;
        };
        name: {
            field: string;
            type: "string";
            maxLength: number;
            pattern: RegExp;
            sanitize: boolean;
        };
        uuid: {
            field: string;
            required: boolean;
            type: "uuid";
        };
        url: {
            field: string;
            type: "url";
            sanitize: boolean;
        };
        phoneNumber: {
            field: string;
            type: "string";
            pattern: RegExp;
            sanitize: boolean;
        };
        mfaCode: {
            field: string;
            type: "string";
            pattern: RegExp;
        };
        backupCode: {
            field: string;
            type: "string";
            pattern: RegExp;
        };
    };
    /**
     * Validate login request
     */
    static validateLoginRequest(data: any): ValidationResult;
    /**
     * Validate registration request
     */
    static validateRegistrationRequest(data: any): ValidationResult;
    /**
     * Validate password reset request
     */
    static validatePasswordResetRequest(data: any): ValidationResult;
    /**
     * Validate password change request
     */
    static validatePasswordChangeRequest(data: any): ValidationResult;
    /**
     * Validate workspace creation request
     */
    static validateWorkspaceRequest(data: any): ValidationResult;
    /**
     * Validate search query
     */
    static validateSearchQuery(data: any): ValidationResult;
}
//# sourceMappingURL=validation-service.d.ts.map