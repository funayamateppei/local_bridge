package com.localbridge.backend.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "evidences")
data class Evidence(
    @Id
    @Column(length = 36)
    val id: String,

    @Column(name = "result_id", nullable = false, length = 36)
    val resultId: String,

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    val type: EvidenceType,

    @Column(name = "file_path", nullable = false, length = 500)
    val filePath: String,

    @Column(name = "mime_type", nullable = false, length = 100)
    val mimeType: String,

    @Column(name = "file_size")
    val fileSize: Long? = null,

    @Column(name = "thumbnail_path", length = 500)
    val thumbnailPath: String? = null,

    @Column(name = "s3_key", length = 500)
    val s3Key: String? = null, // S3にアップロード後のキー

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)

enum class EvidenceType {
    IMAGE,
    VIDEO
}
