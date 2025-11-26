package com.localbridge.backend.repository

import com.localbridge.backend.entity.Equipment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EquipmentRepository : JpaRepository<Equipment, String> {
    fun findByAreaId(areaId: String): List<Equipment>
}
