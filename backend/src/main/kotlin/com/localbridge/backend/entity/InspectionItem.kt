package com.localbridge.backend.entity

import jakarta.persistence.*
import java.time.Instant

@Entity
@Table(name = "inspection_items")
data class InspectionItem(
    @Id
    @Column(length = 36)
    val id: String,

    @Column(name = "inspection_id", nullable = false, length = 36)
    val inspectionId: String,

    @Column(nullable = false, length = 255)
    val title: String,

    @Column(columnDefinition = "TEXT")
    val description: String? = null,

    @Column(name = "area_id", nullable = false, length = 36)
    val areaId: String,

    @Column(name = "equipment_id", nullable = false, length = 36)
    val equipmentId: String,

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    val status: InspectionStatus,

    @Column(name = "created_at", nullable = false)
    val createdAt: Instant = Instant.now(),

    @Column(name = "updated_at", nullable = false)
    val updatedAt: Instant = Instant.now()
)
