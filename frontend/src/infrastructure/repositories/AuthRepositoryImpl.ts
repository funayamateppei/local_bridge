import { ApiClient } from '@/infrastructure/api/client'
import type {
  IAuthRepository,
  LoginCredentials,
  RegisterCredentials,
  AuthResponse,
} from '@/domain/repositories/AuthRepository'

export class AuthRepositoryImpl implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return ApiClient.post<AuthResponse>('/auth/login', credentials)
  }

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    return ApiClient.post<AuthResponse>('/auth/register', credentials)
  }
}

export const authRepository = new AuthRepositoryImpl()
