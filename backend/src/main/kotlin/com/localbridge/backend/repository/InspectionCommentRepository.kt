package com.localbridge.backend.repository

import com.localbridge.backend.entity.InspectionComment
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface InspectionCommentRepository : JpaRepository<InspectionComment, String> {
    fun findByInspectionItemId(inspectionItemId: String): List<InspectionComment>
}
