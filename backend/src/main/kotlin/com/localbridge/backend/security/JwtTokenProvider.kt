package com.localbridge.backend.security

import com.auth0.jwt.JWT
import com.auth0.jwt.algorithms.Algorithm
import com.auth0.jwt.interfaces.DecodedJWT
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.Date

@Component
class JwtTokenProvider(
    @Value("\${jwt.secret:secretKey}") private val secretKey: String,
    @Value("\${jwt.expiration:2592000000}") private val validityInMilliseconds: Long // 30 days
) {
    private val algorithm = Algorithm.HMAC256(secretKey)

    fun createToken(username: String): String {
        val now = Date()
        val validity = Date(now.time + validityInMilliseconds)

        return JWT.create()
            .withSubject(username)
            .withIssuedAt(now)
            .withExpiresAt(validity)
            .sign(algorithm)
    }

    fun validateToken(token: String): Boolean {
        return try {
            val verifier = JWT.require(algorithm).build()
            verifier.verify(token)
            true
        } catch (e: Exception) {
            false
        }
    }

    fun getUsername(token: String): String {
        val verifier = JWT.require(algorithm).build()
        val decodedJWT: DecodedJWT = verifier.verify(token)
        return decodedJWT.subject
    }
}
