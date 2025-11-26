package com.localbridge.backend.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "inspection_results")
data class InspectionResult(
    @Id
    @Column(length = 36)
    val id: String,

    @Column(name = "inspection_item_id", nullable = false, length = 36)
    val inspectionItemId: String,

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    val verdict: InspectionVerdict,

    @Column(columnDefinition = "TEXT")
    val note: String? = null,

    @Column(name = "evidence_ids", columnDefinition = "TEXT")
    val evidenceIds: String, // JSON array stored as string

    @Column(name = "created_by", nullable = false, length = 255)
    val createdBy: String,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now()
)

enum class InspectionVerdict {
    OK,
    NG,
    N_A
}
