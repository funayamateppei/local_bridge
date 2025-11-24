package com.localbridge.backend.controller

import com.localbridge.backend.security.JwtTokenProvider
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class LoginRequest(val username: String)
data class AuthResponse(val token: String)

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val jwtTokenProvider: JwtTokenProvider
) {

    @PostMapping("/login")
    fun login(@RequestBody request: LoginRequest): ResponseEntity<AuthResponse> {
        // In a real app, validate username/password here.
        // For demo, we accept any username and issue a token.
        val token = jwtTokenProvider.createToken(request.username)
        return ResponseEntity.ok(AuthResponse(token))
    }
}
