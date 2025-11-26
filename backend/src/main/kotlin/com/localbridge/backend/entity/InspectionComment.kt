package com.localbridge.backend.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "inspection_comments")
data class InspectionComment(
    @Id
    @Column(length = 36)
    val id: String,

    @Column(name = "inspection_item_id", nullable = false, length = 36)
    val inspectionItemId: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    val content: String,

    @Column(name = "created_by", nullable = false, length = 255)
    val createdBy: String,

    @Column(name = "is_system_comment", nullable = false)
    val isSystemComment: Boolean = false,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)
