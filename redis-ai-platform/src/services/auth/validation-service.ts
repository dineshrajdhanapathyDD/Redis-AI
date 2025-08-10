import validator from 'validator';
import DOMPurify from 'isomorphic-dompurify';
import { logger } from '../../utils/logger';

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

export class ValidationService {
  /**
   * Validate data against rules
   */
  validate(data: any, rules: ValidationRule[]): ValidationResult {
    const errors: ValidationError[] = [];
    const sanitizedData: any = {};

    for (const rule of rules) {
      const value = this.getNestedValue(data, rule.field);
      const fieldErrors = this.validateField(rule.field, value, rule);
      
      if (fieldErrors.length > 0) {
        errors.push(...fieldErrors);
      } else {
        // Sanitize the value if validation passed
        const sanitizedValue = rule.sanitize ? this.sanitizeValue(value, rule) : value;
        this.setNestedValue(sanitizedData, rule.field, sanitizedValue);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined,
    };
  }

  /**
   * Validate a single field
   */
  private validateField(fieldName: string, value: any, rule: ValidationRule): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check required
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field: fieldName,
        message: `${fieldName} is required`,
        value,
      });
      return errors;
    }

    // Skip further validation if value is empty and not required
    if (!rule.required && (value === undefined || value === null || value === '')) {
      return errors;
    }

    // Type validation
    if (rule.type) {
      const typeError = this.validateType(fieldName, value, rule.type);
      if (typeError) {
        errors.push(typeError);
        return errors;
      }
    }

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rule.minLength} characters long`,
          value,
        });
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be no more than ${rule.maxLength} characters long`,
          value,
        });
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field: fieldName,
          message: `${fieldName} format is invalid`,
          value,
        });
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be at least ${rule.min}`,
          value,
        });
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must be no more than ${rule.max}`,
          value,
        });
      }
    }

    // Array validations
    if (Array.isArray(value)) {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must have at least ${rule.minLength} items`,
          value,
        });
      }

      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        errors.push({
          field: fieldName,
          message: `${fieldName} must have no more than ${rule.maxLength} items`,
          value,
        });
      }
    }

    // Enum validation
    if (rule.enum && !rule.enum.includes(value)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be one of: ${rule.enum.join(', ')}`,
        value,
      });
    }

    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value);
      if (customResult !== true) {
        errors.push({
          field: fieldName,
          message: typeof customResult === 'string' ? customResult : `${fieldName} is invalid`,
          value,
        });
      }
    }

    return errors;
  }

  /**
   * Validate type
   */
  private validateType(fieldName: string, value: any, type: string): ValidationError | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return {
            field: fieldName,
            message: `${fieldName} must be a string`,
            value,
          };
        }
        break;

      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return {
            field: fieldName,
            message: `${fieldName} must be a number`,
            value,
          };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return {
            field: fieldName,
            message: `${fieldName} must be a boolean`,
            value,
          };
        }
        break;

      case 'email':
        if (typeof value !== 'string' || !validator.isEmail(value)) {
          return {
            field: fieldName,
            message: `${fieldName} must be a valid email address`,
            value,
          };
        }
        break;

      case 'url':
        if (typeof value !== 'string' || !validator.isURL(value)) {
          return {
            field: fieldName,
            message: `${fieldName} must be a valid URL`,
            value,
          };
        }
        break;

      case 'uuid':
        if (typeof value !== 'string' || !validator.isUUID(value)) {
          return {
            field: fieldName,
            message: `${fieldName} must be a valid UUID`,
            value,
          };
        }
        break;

      case 'date':
        if (!(value instanceof Date) && !validator.isISO8601(String(value))) {
          return {
            field: fieldName,
            message: `${fieldName} must be a valid date`,
            value,
          };
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          return {
            field: fieldName,
            message: `${fieldName} must be an array`,
            value,
          };
        }
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return {
            field: fieldName,
            message: `${fieldName} must be an object`,
            value,
          };
        }
        break;

      default:
        logger.warn(`Unknown validation type: ${type}`);
    }

    return null;
  }

  /**
   * Sanitize value
   */
  private sanitizeValue(value: any, rule: ValidationRule): any {
    if (typeof value === 'string') {
      // Trim whitespace
      value = value.trim();

      // Sanitize HTML if not allowed
      if (!rule.allowHtml) {
        value = DOMPurify.sanitize(value, { ALLOWED_TAGS: [] });
      } else {
        // Allow only safe HTML tags
        value = DOMPurify.sanitize(value, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
          ALLOWED_ATTR: ['href', 'target'],
        });
      }

      // Escape special characters for SQL injection prevention
      value = this.escapeSpecialChars(value);
    }

    return value;
  }

  /**
   * Escape special characters
   */
  private escapeSpecialChars(str: string): string {
    return str
      .replace(/'/g, "''")
      .replace(/"/g, '""')
      .replace(/\\/g, '\\\\')
      .replace(/\0/g, '\\0')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\x1a/g, '\\Z');
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  /**
   * Common validation rules
   */
  static commonRules = {
    email: {
      field: 'email',
      required: true,
      type: 'email' as const,
      maxLength: 255,
      sanitize: true,
    },

    password: {
      field: 'password',
      required: true,
      type: 'string' as const,
      minLength: 8,
      maxLength: 128,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    },

    username: {
      field: 'username',
      required: true,
      type: 'string' as const,
      minLength: 3,
      maxLength: 30,
      pattern: /^[a-zA-Z0-9_-]+$/,
      sanitize: true,
    },

    name: {
      field: 'name',
      type: 'string' as const,
      maxLength: 100,
      pattern: /^[a-zA-Z\s'-]+$/,
      sanitize: true,
    },

    uuid: {
      field: 'id',
      required: true,
      type: 'uuid' as const,
    },

    url: {
      field: 'url',
      type: 'url' as const,
      sanitize: true,
    },

    phoneNumber: {
      field: 'phoneNumber',
      type: 'string' as const,
      pattern: /^\+?[1-9]\d{1,14}$/,
      sanitize: true,
    },

    mfaCode: {
      field: 'mfaCode',
      type: 'string' as const,
      pattern: /^\d{6}$/,
    },

    backupCode: {
      field: 'backupCode',
      type: 'string' as const,
      pattern: /^[A-Z0-9]{4}-[A-Z0-9]{4}$/,
    },
  };

  /**
   * Validate login request
   */
  static validateLoginRequest(data: any): ValidationResult {
    const service = new ValidationService();
    return service.validate(data, [
      ValidationService.commonRules.email,
      ValidationService.commonRules.password,
      {
        field: 'deviceFingerprint',
        type: 'string',
        maxLength: 255,
        sanitize: true,
      },
      {
        field: 'rememberMe',
        type: 'boolean',
      },
      {
        field: 'mfaCode',
        type: 'string',
        pattern: /^\d{6}$/,
      },
    ]);
  }

  /**
   * Validate registration request
   */
  static validateRegistrationRequest(data: any): ValidationResult {
    const service = new ValidationService();
    return service.validate(data, [
      ValidationService.commonRules.email,
      ValidationService.commonRules.username,
      ValidationService.commonRules.password,
      {
        ...ValidationService.commonRules.name,
        field: 'firstName',
      },
      {
        ...ValidationService.commonRules.name,
        field: 'lastName',
      },
      {
        field: 'acceptTerms',
        required: true,
        type: 'boolean',
        custom: (value) => value === true || 'You must accept the terms and conditions',
      },
    ]);
  }

  /**
   * Validate password reset request
   */
  static validatePasswordResetRequest(data: any): ValidationResult {
    const service = new ValidationService();
    return service.validate(data, [
      ValidationService.commonRules.email,
    ]);
  }

  /**
   * Validate password change request
   */
  static validatePasswordChangeRequest(data: any): ValidationResult {
    const service = new ValidationService();
    return service.validate(data, [
      {
        field: 'currentPassword',
        required: true,
        type: 'string',
        maxLength: 128,
      },
      ValidationService.commonRules.password,
    ]);
  }

  /**
   * Validate workspace creation request
   */
  static validateWorkspaceRequest(data: any): ValidationResult {
    const service = new ValidationService();
    return service.validate(data, [
      {
        field: 'name',
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 100,
        sanitize: true,
      },
      {
        field: 'description',
        type: 'string',
        maxLength: 500,
        sanitize: true,
        allowHtml: false,
      },
      {
        field: 'isPublic',
        type: 'boolean',
      },
      {
        field: 'tags',
        type: 'array',
        maxLength: 10,
      },
    ]);
  }

  /**
   * Validate search query
   */
  static validateSearchQuery(data: any): ValidationResult {
    const service = new ValidationService();
    return service.validate(data, [
      {
        field: 'query',
        required: true,
        type: 'string',
        minLength: 1,
        maxLength: 1000,
        sanitize: true,
      },
      {
        field: 'limit',
        type: 'number',
        min: 1,
        max: 100,
      },
      {
        field: 'offset',
        type: 'number',
        min: 0,
      },
      {
        field: 'filters',
        type: 'object',
      },
    ]);
  }
}