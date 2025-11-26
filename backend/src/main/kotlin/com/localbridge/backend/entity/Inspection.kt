package com.localbridge.backend.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "inspections")
data class Inspection(
    @Id
    @Column(length = 36)
    val id: String,

    @Column(nullable = false, length = 255)
    val title: String,

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    val status: InspectionStatus,

    @Column(columnDefinition = "TEXT")
    val description: String? = null,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: Instant = Instant.now()
)

enum class InspectionStatus {
    TODO,
    IN_REVIEW,
    DONE,
    CORRECTION_NEEDED
}
