-- Create areas table
CREATE TABLE areas (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create equipments table
CREATE TABLE equipments (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    area_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE CASCADE
);

-- Create inspections table
CREATE TABLE inspections (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create inspection_items table
CREATE TABLE inspection_items (
    id VARCHAR(36) PRIMARY KEY,
    inspection_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    area_id VARCHAR(36) NOT NULL,
    equipment_id VARCHAR(36) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    FOREIGN KEY (area_id) REFERENCES areas(id),
    FOREIGN KEY (equipment_id) REFERENCES equipments(id)
);

-- Create inspection_results table
CREATE TABLE inspection_results (
    id VARCHAR(36) PRIMARY KEY,
    inspection_item_id VARCHAR(36) NOT NULL,
    verdict VARCHAR(50) NOT NULL,
    note TEXT,
    evidence_ids TEXT,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_item_id) REFERENCES inspection_items(id) ON DELETE CASCADE
);

-- Create inspection_comments table
CREATE TABLE inspection_comments (
    id VARCHAR(36) PRIMARY KEY,
    inspection_item_id VARCHAR(36) NOT NULL,
    content TEXT NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    is_system_comment BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inspection_item_id) REFERENCES inspection_items(id) ON DELETE CASCADE
);

-- Create evidences table
CREATE TABLE evidences (
    id VARCHAR(36) PRIMARY KEY,
    result_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT,
    thumbnail_path VARCHAR(500),
    s3_key VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (result_id) REFERENCES inspection_results(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_equipments_area_id ON equipments(area_id);
CREATE INDEX idx_inspection_items_inspection_id ON inspection_items(inspection_id);
CREATE INDEX idx_inspection_items_area_id ON inspection_items(area_id);
CREATE INDEX idx_inspection_items_equipment_id ON inspection_items(equipment_id);
CREATE INDEX idx_inspection_results_item_id ON inspection_results(inspection_item_id);
CREATE INDEX idx_inspection_comments_item_id ON inspection_comments(inspection_item_id);
CREATE INDEX idx_evidences_result_id ON evidences(result_id);
