import { Redis } from 'ioredis';
import { AuthService } from '../../../src/services/auth/auth-service';
import { defaultSecurityConfig } from '../../../src/services/auth';
import {
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest,
} from '../../../src/services/auth/types';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as 