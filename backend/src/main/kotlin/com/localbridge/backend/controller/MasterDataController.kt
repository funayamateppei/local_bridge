package com.localbridge.backend.controller

import com.localbridge.backend.entity.Area
import com.localbridge.backend.entity.Equipment
import com.localbridge.backend.repository.AreaRepository
import com.localbridge.backend.repository.EquipmentRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.Instant

@RestController
@RequestMapping("/api/master")
@CrossOrigin(origins = ["*"]) // TODO: 本番環境では適切に設定
class MasterDataController(
    private val areaRepository: AreaRepository,
    private val equipmentRepository: EquipmentRepository
) {

    @GetMapping("/areas")
    fun getAreas(@RequestParam(required = false) since: Long?): ResponseEntity<List<Area>> {
        val areas = if (since != null) {
            // 差分取得: since以降に更新されたデータのみ
            val sinceInstant = Instant.ofEpochMilli(since)
            areaRepository.findByUpdatedAtAfter(sinceInstant)
        } else {
            // 全件取得
            areaRepository.findAll()
        }
        return ResponseEntity.ok(areas)
    }

    @GetMapping("/equipments")
    fun getEquipmentsByArea(@RequestParam areaId: String): ResponseEntity<List<Equipment>> {
        return ResponseEntity.ok(equipmentRepository.findByAreaId(areaId))
    }

    @GetMapping("/equipments/all")
    fun getAllEquipments(@RequestParam(required = false) since: Long?): ResponseEntity<List<Equipment>> {
        val equipments = if (since != null) {
            // 差分取得: since以降に更新されたデータのみ
            val sinceInstant = Instant.ofEpochMilli(since)
            equipmentRepository.findByUpdatedAtAfter(sinceInstant)
        } else {
            // 全件取得
            equipmentRepository.findAll()
        }
        return ResponseEntity.ok(equipments)
    }
}
