package com.localbridge.backend.repository

import com.localbridge.backend.entity.Equipment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.time.Instant

@Repository
interface EquipmentRepository : JpaRepository<Equipment, String> {
    fun findByAreaId(areaId: String): List<Equipment>
    fun findByUpdatedAtAfter(updatedAt: Instant): List<Equipment>
}
