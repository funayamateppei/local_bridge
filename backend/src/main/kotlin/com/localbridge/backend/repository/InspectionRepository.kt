package com.localbridge.backend.repository

import com.localbridge.backend.entity.Inspection
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface InspectionRepository : JpaRepository<Inspection, String>
