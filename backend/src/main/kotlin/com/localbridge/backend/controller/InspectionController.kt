package com.localbridge.backend.controller

import com.localbridge.backend.entity.*
import com.localbridge.backend.repository.*
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.time.Instant

@RestController
@RequestMapping("/api/inspections")
@CrossOrigin(origins = ["*"]) // TODO: 本番環境では適切に設定
class InspectionController(
    private val inspectionRepository: InspectionRepository,
    private val inspectionItemRepository: InspectionItemRepository,
    private val inspectionResultRepository: InspectionResultRepository,
    private val inspectionCommentRepository: InspectionCommentRepository,
    private val evidenceRepository: EvidenceRepository
) {

    // Inspection CRUD
    @GetMapping
    fun getAllInspections(): ResponseEntity<List<Inspection>> {
        return ResponseEntity.ok(inspectionRepository.findAll())
    }

    @GetMapping("/{id}")
    fun getInspectionById(@PathVariable id: String): ResponseEntity<Inspection> {
        return inspectionRepository.findById(id)
            .map { ResponseEntity.ok(it) }
            .orElse(ResponseEntity.notFound().build())
    }

    @PostMapping
    fun createInspection(@RequestBody request: CreateInspectionRequest): ResponseEntity<Inspection> {
        val inspection = Inspection(
            id = request.id,
            title = request.title,
            status = request.status,
            description = request.description,
            createdAt = Instant.ofEpochMilli(request.createdAt),
            updatedAt = Instant.ofEpochMilli(request.updatedAt)
        )
        val saved = inspectionRepository.save(inspection)
        return ResponseEntity.status(HttpStatus.CREATED).body(saved)
    }

    @PutMapping("/{id}")
    fun updateInspection(
        @PathVariable id: String,
        @RequestBody request: UpdateInspectionRequest
    ): ResponseEntity<Inspection> {
        return inspectionRepository.findById(id)
            .map { existing ->
                val updated = existing.copy(
                    status = request.status ?: existing.status,
                    updatedAt = Instant.now()
                )
                ResponseEntity.ok(inspectionRepository.save(updated))
            }
            .orElse(ResponseEntity.notFound().build())
    }

    // InspectionItem CRUD
    @GetMapping("/{inspectionId}/items")
    fun getInspectionItems(@PathVariable inspectionId: String): ResponseEntity<List<InspectionItem>> {
        return ResponseEntity.ok(inspectionItemRepository.findByInspectionId(inspectionId))
    }

    @GetMapping("/items/{id}")
    fun getInspectionItemById(@PathVariable id: String): ResponseEntity<InspectionItem> {
        return inspectionItemRepository.findById(id)
            .map { ResponseEntity.ok(it) }
            .orElse(ResponseEntity.notFound().build())
    }

    @PostMapping("/items")
    fun createInspectionItem(@RequestBody request: CreateInspectionItemRequest): ResponseEntity<InspectionItem> {
        val item = InspectionItem(
            id = request.id,
            inspectionId = request.inspectionId,
            title = request.title,
            description = request.description,
            areaId = request.areaId,
            equipmentId = request.equipmentId,
            status = request.status,
            createdAt = Instant.ofEpochMilli(request.createdAt),
            updatedAt = Instant.ofEpochMilli(request.updatedAt)
        )
        val saved = inspectionItemRepository.save(item)
        return ResponseEntity.status(HttpStatus.CREATED).body(saved)
    }

    @PutMapping("/items/{id}")
    fun updateInspectionItem(
        @PathVariable id: String,
        @RequestBody request: UpdateInspectionItemRequest
    ): ResponseEntity<InspectionItem> {
        return inspectionItemRepository.findById(id)
            .map { existing ->
                val updated = existing.copy(
                    status = request.status ?: existing.status,
                    updatedAt = Instant.now()
                )
                ResponseEntity.ok(inspectionItemRepository.save(updated))
            }
            .orElse(ResponseEntity.notFound().build())
    }

    // Results
    @GetMapping("/items/{itemId}/results")
    fun getResults(@PathVariable itemId: String): ResponseEntity<List<InspectionResult>> {
        return ResponseEntity.ok(inspectionResultRepository.findByInspectionItemId(itemId))
    }

    @PostMapping("/results")
    fun createResult(@RequestBody request: CreateResultRequest): ResponseEntity<InspectionResult> {
        val result = InspectionResult(
            id = request.id,
            inspectionItemId = request.inspectionItemId,
            verdict = request.verdict,
            note = request.note,
            evidenceIds = request.evidenceIds.joinToString(","),
            createdBy = request.createdBy,
            createdAt = Instant.ofEpochMilli(request.createdAt)
        )
        val saved = inspectionResultRepository.save(result)
        return ResponseEntity.status(HttpStatus.CREATED).body(saved)
    }

    // Comments
    @GetMapping("/items/{itemId}/comments")
    fun getComments(@PathVariable itemId: String): ResponseEntity<List<InspectionComment>> {
        return ResponseEntity.ok(inspectionCommentRepository.findByInspectionItemId(itemId))
    }

    @PostMapping("/comments")
    fun createComment(@RequestBody request: CreateCommentRequest): ResponseEntity<InspectionComment> {
        val comment = InspectionComment(
            id = request.id,
            inspectionItemId = request.inspectionItemId,
            content = request.content,
            createdBy = request.createdBy,
            isSystemComment = request.isSystemComment ?: false,
            createdAt = Instant.ofEpochMilli(request.createdAt)
        )
        val saved = inspectionCommentRepository.save(comment)
        return ResponseEntity.status(HttpStatus.CREATED).body(saved)
    }

    // Evidence
    @GetMapping("/results/{resultId}/evidences")
    fun getEvidences(@PathVariable resultId: String): ResponseEntity<List<Evidence>> {
        return ResponseEntity.ok(evidenceRepository.findByResultId(resultId))
    }

    @PostMapping("/evidences")
    fun createEvidence(@RequestBody request: CreateEvidenceRequest): ResponseEntity<Evidence> {
        val evidence = Evidence(
            id = request.id,
            resultId = request.resultId,
            type = request.type,
            filePath = request.filePath,
            mimeType = request.mimeType,
            fileSize = request.fileSize,
            thumbnailPath = request.thumbnailPath,
            s3Key = request.s3Key,
            createdAt = Instant.ofEpochMilli(request.createdAt)
        )
        val saved = evidenceRepository.save(evidence)
        return ResponseEntity.status(HttpStatus.CREATED).body(saved)
    }
}

// Request DTOs
data class CreateInspectionRequest(
    val id: String,
    val title: String,
    val status: InspectionStatus,
    val description: String?,
    val createdAt: Long,
    val updatedAt: Long
)

data class UpdateInspectionRequest(
    val status: InspectionStatus?
)

data class CreateInspectionItemRequest(
    val id: String,
    val inspectionId: String,
    val title: String,
    val description: String?,
    val areaId: String,
    val equipmentId: String,
    val status: InspectionStatus,
    val createdAt: Long,
    val updatedAt: Long
)

data class UpdateInspectionItemRequest(
    val status: InspectionStatus?
)

data class CreateResultRequest(
    val id: String,
    val inspectionItemId: String,
    val verdict: InspectionVerdict,
    val note: String?,
    val evidenceIds: List<String>,
    val createdBy: String,
    val createdAt: Long
)

data class CreateCommentRequest(
    val id: String,
    val inspectionItemId: String,
    val content: String,
    val createdBy: String,
    val isSystemComment: Boolean?,
    val createdAt: Long
)

data class CreateEvidenceRequest(
    val id: String,
    val resultId: String,
    val type: EvidenceType,
    val filePath: String,
    val mimeType: String,
    val fileSize: Long?,
    val thumbnailPath: String?,
    val s3Key: String?,
    val createdAt: Long
)
