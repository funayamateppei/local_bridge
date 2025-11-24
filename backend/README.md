# Backend (Spring Boot)

## Development Scripts

### Format

Google Java Format を適用します。

```bash
./gradlew format
```

### Lint

フォーマット違反がないかチェックします。

```bash
./gradlew lint
```

### Test

ユニットテストを実行します。

```bash
./gradlew test
```

### Run

1. **Database**
   Docker で PostgreSQL を起動します。

   ```bash
   docker-compose up -d
   ```

2. **Application**
   Spring Boot アプリケーションを起動します。
   ```bash
   ./gradlew bootRun
   ```
