package com.localbridge.backend.controller

import com.localbridge.backend.entity.Area
import com.localbridge.backend.entity.Equipment
import com.localbridge.backend.repository.AreaRepository
import com.localbridge.backend.repository.EquipmentRepository
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/master")
@CrossOrigin(origins = ["*"]) // TODO: 本番環境では適切に設定
class MasterDataController(
    private val areaRepository: AreaRepository,
    private val equipmentRepository: EquipmentRepository
) {

    @GetMapping("/areas")
    fun getAreas(): ResponseEntity<List<Area>> {
        return ResponseEntity.ok(areaRepository.findAll())
    }

    @GetMapping("/equipments")
    fun getEquipmentsByArea(@RequestParam areaId: String): ResponseEntity<List<Equipment>> {
        return ResponseEntity.ok(equipmentRepository.findByAreaId(areaId))
    }

    @GetMapping("/equipments/all")
    fun getAllEquipments(): ResponseEntity<List<Equipment>> {
        return ResponseEntity.ok(equipmentRepository.findAll())
    }
}
