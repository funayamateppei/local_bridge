# 本番運用準備ガイド

## 現状評価

### Local-First アーキテクチャ成熟度: 90/100

| カテゴリ               | スコア | 状態      | 備考                           |
| ---------------------- | ------ | --------- | ------------------------------ |
| **コア機能**           |        |           |                                |
| オフライン動作         | 10/10  | ✅ 完成   | IndexedDB + OPFS で完全対応    |
| クライアントサイド ID  | 10/10  | ✅ 完成   | UUID v4 による衝突回避         |
| ローカル DB 設計       | 10/10  | ✅ 完成   | Dexie.js + OPFS の適切な分離   |
| ファイル管理           | 10/10  | ✅ 完成   | OPFS で 50MB 制限を回避        |
| **同期機能**           |        |           |                                |
| 同期キュー             | 10/10  | ✅ 完成   | 永続化、リトライ対応           |
| 楽観的更新             | 10/10  | ✅ 完成   | UI 即時反映 (\u003c10ms)       |
| 増分取得（マスター）   | 10/10  | ✅ 完成   | タイムスタンプベース           |
| 進捗可視化             | 10/10  | ✅ 完成   | プログレスバー、パーセンテージ |
| 競合解決               | 9/10   | ✅ 完成   | Append-Only + LWW              |
| **認証・セキュリティ** |        |           |                                |
| JWT 認証               | 10/10  | ✅ 完成   | Access + Refresh Token         |
| トークン検証           | 10/10  | ✅ 完成   | 有効期限チェック、自動更新     |
| オフライン認証         | 10/10  | ✅ 完成   | ログアウト回避ロジック         |
| **アーキテクチャ**     |        |           |                                |
| 層分離                 | 10/10  | ✅ 完成   | Clean Architecture + DDD       |
| 依存性の方向           | 10/10  | ✅ 完成   | Domain 中心の設計              |
| テスタビリティ         | 8/10   | ⚠️ 改善可 | Repository 抽象化済み          |
| **本番運用**           |        |           |                                |
| エラーハンドリング     | 7/10   | ⚠️ 改善可 | 基本的なリトライあり           |
| ファイルストレージ     | 5/10   | 🔧 要対応 | S3 連携未実装                  |
| 環境設定               | 5/10   | 🔧 要対応 | CORS、環境変数                 |
| モニタリング           | 3/10   | 🔧 要対応 | ログ、メトリクス未実装         |

---

## 本番運用に向けた必須対応項目

### 🔴 Critical（本番リリース前に必須）

#### 1. CORS 設定の厳格化

**現状:**

```kotlin
@CrossOrigin(origins = ["*"])
```

**対応:**

```kotlin
@CrossOrigin(
    origins = [
        "https://yourdomain.com",
        "https://app.yourdomain.com"
    ],
    allowedHeaders = ["*"],
    methods = [RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE]
)
```

**実装場所:**

- `backend/src/main/kotlin/com/localbridge/backend/controller/*.kt`

---

#### 2. 環境変数の整理

**フロントエンド:**

`.env.production` を作成:

```bash
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_APP_NAME=Local Bridge
VITE_APP_VERSION=1.0.0
```

**バックエンド:**

`application-prod.yml` を作成:

```yaml
spring:
  datasource:
    url: ${DATABASE_URL}
    username: ${DATABASE_USERNAME}
    password: ${DATABASE_PASSWORD}
  jpa:
    hibernate:
      ddl-auto: validate # 本番では絶対にupdateにしない
    show-sql: false

jwt:
  secret: ${JWT_SECRET} # 環境変数から取得
  expiration: 3600000 # 1時間
  refresh-expiration: 2592000000 # 30日

logging:
  level:
    root: INFO
    com.localbridge: INFO
```

---

#### 3. データベース設定

**マイグレーション管理:**

Flyway または Liquibase の導入を推奨:

```kotlin
// build.gradle.kts
dependencies {
    implementation("org.flywaydb:flyway-core")
}
```

`src/main/resources/db/migration/V1__initial_schema.sql`:

```sql
CREATE TABLE areas (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- インデックス作成
CREATE INDEX idx_areas_updated_at ON areas(updated_at);
CREATE INDEX idx_equipments_updated_at ON equipments(updated_at);
```

---

### 🟡 High（早期対応推奨）

#### 4. S3 連携の実装

**バックエンド: Presigned URL 生成**

```kotlin
@Service
class S3Service(
    @Value("\${aws.s3.bucket}") private val bucketName: String,
    private val s3Client: S3Client
) {
    fun generatePresignedUrl(key: String, expirationMinutes: Long = 15): String {
        val putObjectRequest = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build()

        val presignRequest = PutObjectPresignRequest.builder()
            .signatureDuration(Duration.ofMinutes(expirationMinutes))
            .putObjectRequest(putObjectRequest)
            .build()

        return s3Presigner.presignPutObject(presignRequest).url().toString()
    }
}
```

**フロントエンド: アップロード処理**

```typescript
async uploadToS3(evidenceId: string, file: Blob): Promise<void> {
  // 1. Presigned URL取得
  const response = await this.fetchWithAuth(
    `${API_BASE_URL}/evidences/${evidenceId}/upload-url`
  )
  const { uploadUrl } = await response.json()

  // 2. S3へ直接アップロード
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })

  // 3. アップロード完了を通知
  await this.fetchWithAuth(
    `${API_BASE_URL}/evidences/${evidenceId}/upload-complete`,
    { method: 'POST' }
  )
}
```

---

#### 5. エラーハンドリングの強化

**エクスポネンシャルバックオフの実装:**

```typescript
class RetryStrategy {
  async executeWithRetry<T>(fn: () => Promise<T>, maxRetries: number = 5): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          await new Promise((resolve) => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError!
  }
}
```

---

#### 6. ロギング・モニタリング

**フロントエンド: エラートラッキング**

Sentry の導入:

```typescript
import * as Sentry from "@sentry/react"

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
})
```

**バックエンド: 構造化ログ**

```kotlin
@Slf4j
@Service
class SyncService {
    fun syncData() {
        log.info("Sync started", mapOf(
            "userId" to userId,
            "timestamp" to Instant.now()
        ))

        try {
            // 処理
        } catch (e: Exception) {
            log.error("Sync failed", mapOf(
                "userId" to userId,
                "error" to e.message
            ), e)
        }
    }
}
```

---

### 🟢 Medium（運用改善）

#### 7. パフォーマンス最適化

**IndexedDB インデックスの追加:**

```typescript
this.version(6).stores({
  inspectionItems: "id, inspectionId, areaId, equipmentId, status, updatedAt",
  inspectionResults: "id, inspectionItemId, createdAt", // createdAtを追加
  evidences: "id, resultId, createdAt", // createdAtを追加
})
```

**バックエンド: クエリ最適化**

```kotlin
@Query("""
    SELECT i FROM Inspection i
    LEFT JOIN FETCH i.items
    WHERE i.status = :status
    ORDER BY i.updatedAt DESC
""")
fun findByStatusWithItems(status: InspectionStatus): List<Inspection>
```

---

#### 8. セキュリティ強化

**HTTPS の強制:**

```kotlin
@Configuration
class SecurityConfig : WebSecurityConfigurerAdapter() {
    override fun configure(http: HttpSecurity) {
        http
            .requiresChannel()
            .anyRequest()
            .requiresSecure()
    }
}
```

**レート制限:**

```kotlin
@Component
class RateLimitFilter : OncePerRequestFilter() {
    private val limiter = RateLimiter.create(100.0) // 100 req/sec

    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        if (!limiter.tryAcquire()) {
            response.sendError(429, "Too Many Requests")
            return
        }
        filterChain.doFilter(request, response)
    }
}
```

---

## デプロイチェックリスト

### フロントエンド

- [ ] 環境変数の設定 (`.env.production`)
- [ ] ビルド最適化 (`vite build`)
- [ ] Service Worker の登録確認
- [ ] PWA manifest の設定
- [ ] HTTPS での配信
- [ ] CDN の設定（静的アセット）
- [ ] Sentry の設定

### バックエンド

- [ ] 環境変数の設定
- [ ] データベースマイグレーション
- [ ] CORS 設定の確認
- [ ] JWT 秘密鍵の生成・設定
- [ ] S3 バケットの作成・権限設定
- [ ] ヘルスチェックエンドポイント (`/actuator/health`)
- [ ] ログ収集の設定
- [ ] メトリクス監視の設定

### インフラ

- [ ] データベースのバックアップ設定
- [ ] SSL 証明書の設定
- [ ] ロードバランサーの設定
- [ ] Auto Scaling の設定
- [ ] 監視アラートの設定
- [ ] 災害復旧計画の策定

---

## 推奨デプロイ構成

### 開発環境

- **フロントエンド**: Vercel / Netlify
- **バックエンド**: Heroku / Railway
- **DB**: PostgreSQL (Heroku Postgres)
- **ストレージ**: AWS S3 / Cloudflare R2

### 本番環境

- **フロントエンド**: Cloudflare Pages / Vercel
- **バックエンド**: AWS ECS / Google Cloud Run
- **DB**: AWS RDS / Google Cloud SQL
- **ストレージ**: AWS S3
- **CDN**: CloudFront / Cloudflare
- **監視**: Datadog / New Relic

---

## まとめ

現在のアプリケーションは **デモ・PoC としては完成度が高い** 状態です。

**強み:**

- Local-First アーキテクチャの本質的な実装
- オフライン動作の完全対応
- 適切な設計パターンの適用

**本番運用に向けて:**

- Critical 項目（CORS、環境変数、DB 設定）は必須
- High 項目（S3 連携、エラーハンドリング）は早期対応推奨
- Medium 項目は運用しながら改善

**推奨アプローチ:**

1. まずはステージング環境で Critical 項目を対応
2. 小規模ユーザーで β テスト
3. フィードバックを元に High/Medium 項目を優先順位付け
4. 段階的に本番展開
