package com.localbridge.backend.repository

import com.localbridge.backend.entity.Area
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AreaRepository : JpaRepository<Area, String>
