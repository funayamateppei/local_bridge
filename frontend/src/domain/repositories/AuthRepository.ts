export interface AuthResponse {
  token: string
  refreshToken: string
}

export interface LoginCredentials {
  username: string
  password?: string
}

export interface RegisterCredentials {
  username: string
  password?: string
}

export interface IAuthRepository {
  login(credentials: LoginCredentials): Promise<AuthResponse>
  register(credentials: RegisterCredentials): Promise<AuthResponse>
}
