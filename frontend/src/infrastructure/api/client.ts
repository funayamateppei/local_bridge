const BASE_URL = 'http://localhost:8080/api'

interface RequestOptions extends RequestInit {
  headers?: Record<string, string>
}

export class ApiClient {
  private static async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${BASE_URL}${endpoint}`

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // TODO: トークンがある場合はAuthorizationヘッダーを追加する処理をここに書く

    const config: RequestOptions = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        // エラーレスポンスのハンドリング
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `API Error: ${response.status}`)
      }

      // レスポンスボディがない場合（204 No Contentなど）を考慮
      const contentLength = response.headers.get('content-length')
      if (contentLength === '0') {
        return {} as T
      }

      return response.json()
    } catch (error) {
      console.error('API Request Failed:', error)
      throw error
    }
  }

  static get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  static post<T>(endpoint: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  static put<T>(endpoint: string, body: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  static delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}
