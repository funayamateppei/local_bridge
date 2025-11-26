package com.localbridge.backend.repository

import com.localbridge.backend.entity.Evidence
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EvidenceRepository : JpaRepository<Evidence, String> {
    fun findByResultId(resultId: String): List<Evidence>
}
