package com.localbridge.backend.controller

import com.localbridge.backend.security.JwtTokenProvider
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class LoginRequest(val username: String, val password: String? = null)
data class AuthResponse(val token: String, val refreshToken: String)
data class RefreshTokenRequest(val refreshToken: String)

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val jwtTokenProvider: JwtTokenProvider,
    private val userRepository: com.localbridge.backend.repository.UserRepository,
    private val passwordEncoder: org.springframework.security.crypto.password.PasswordEncoder
) {

    @PostMapping("/login")
    fun login(@RequestBody request: LoginRequest): ResponseEntity<AuthResponse> {
        // DB からユーザーを検索
        val user = userRepository.findByUsername(request.username)
            ?: return ResponseEntity.status(401).build()
        
        // パスワード検証
        if (!passwordEncoder.matches(request.password ?: "", user.passwordHash)) {
            return ResponseEntity.status(401).build()
        }
        
        val token = jwtTokenProvider.createToken(user.username)
        val refreshToken = jwtTokenProvider.createRefreshToken(user.username)
        return ResponseEntity.ok(AuthResponse(token, refreshToken))
    }

    @PostMapping("/register")
    fun register(@RequestBody request: LoginRequest): ResponseEntity<AuthResponse> {
        // ユーザー名の重複チェック
        if (userRepository.findByUsername(request.username) != null) {
            return ResponseEntity.status(409).build() // 409 Conflict
        }
        
        // パスワードのハッシュ化
        val passwordHash = passwordEncoder.encode(request.password ?: "")
        
        // ユーザーを DB に保存
        val newUser = com.localbridge.backend.entity.User(
            username = request.username,
            passwordHash = passwordHash
        )
        userRepository.save(newUser)
        
        // JWT トークンを発行
        val token = jwtTokenProvider.createToken(newUser.username)
        val refreshToken = jwtTokenProvider.createRefreshToken(newUser.username)
        return ResponseEntity.ok(AuthResponse(token, refreshToken))
    }

    @PostMapping("/refresh")
    fun refresh(@RequestBody request: RefreshTokenRequest): ResponseEntity<AuthResponse> {
        if (!jwtTokenProvider.validateToken(request.refreshToken)) {
            return ResponseEntity.status(401).build()
        }
        val username = jwtTokenProvider.getUsername(request.refreshToken)
        
        // ユーザーが存在するか確認
        if (userRepository.findByUsername(username) == null) {
             return ResponseEntity.status(401).build()
        }

        val newToken = jwtTokenProvider.createToken(username)
        val newRefreshToken = jwtTokenProvider.createRefreshToken(username)
        
        return ResponseEntity.ok(AuthResponse(newToken, newRefreshToken))
    }
}
