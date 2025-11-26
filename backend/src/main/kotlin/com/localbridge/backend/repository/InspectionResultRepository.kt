package com.localbridge.backend.repository

import com.localbridge.backend.entity.InspectionResult
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface InspectionResultRepository : JpaRepository<InspectionResult, String> {
    fun findByInspectionItemId(inspectionItemId: String): List<InspectionResult>
}
