package com.localbridge.backend.repository

import com.localbridge.backend.entity.InspectionItem
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface InspectionItemRepository : JpaRepository<InspectionItem, String> {
    fun findByInspectionId(inspectionId: String): List<InspectionItem>
}
