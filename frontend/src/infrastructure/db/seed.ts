import { db } from '@/infrastructure/db'
import { v4 as uuidv4 } from 'uuid'

export const seedDatabase = async () => {
  const areaCount = await db.areas.count()
  if (areaCount > 0) {
    console.log('Database already seeded.')
    return
  }

  console.log('Seeding database...')

  const now = Date.now()

  // Areas
  const kitchenId = uuidv4()
  const hallId = uuidv4()

  await db.areas.bulkAdd([
    { id: kitchenId, name: 'Kitchen' },
    { id: hallId, name: 'Hall' },
  ])

  // Equipments
  const dishwasherId = uuidv4()
  const ovenId = uuidv4()
  const fridgeId = uuidv4()
  const acId = uuidv4()
  const table1Id = uuidv4()

  await db.equipments.bulkAdd([
    { id: dishwasherId, name: 'Dishwasher', areaId: kitchenId },
    { id: ovenId, name: 'Oven', areaId: kitchenId },
    { id: fridgeId, name: 'Fridge', areaId: kitchenId },
    { id: acId, name: 'Air Conditioner', areaId: hallId },
    { id: table1Id, name: 'Table 1', areaId: hallId },
  ])

  // Inspections
  const monthlyInspectionId = uuidv4()
  const weeklyInspectionId = uuidv4()

  await db.inspections.bulkAdd([
    {
      id: monthlyInspectionId,
      title: 'Monthly Facility Check',
      status: 'todo',
      createdAt: now,
      updatedAt: now,
      description: 'Regular monthly inspection of all facilities',
    },
    {
      id: weeklyInspectionId,
      title: 'Weekly Safety Check',
      status: 'in_review',
      createdAt: now - 86400000, // 1日前
      updatedAt: now - 3600000, // 1時間前
      description: 'Weekly safety inspection',
    },
  ])

  // InspectionItems
  await db.inspectionItems.bulkAdd([
    // Monthly Inspection Items
    {
      id: uuidv4(),
      inspectionId: monthlyInspectionId,
      title: 'Check Dishwasher',
      description: 'Verify dishwasher is functioning properly',
      areaId: kitchenId,
      equipmentId: dishwasherId,
      status: 'todo',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      inspectionId: monthlyInspectionId,
      title: 'Check Oven Temperature',
      description: 'Ensure oven reaches correct temperature',
      areaId: kitchenId,
      equipmentId: ovenId,
      status: 'todo',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: uuidv4(),
      inspectionId: monthlyInspectionId,
      title: 'Check Fridge Temperature',
      description: 'Verify fridge maintains proper temperature',
      areaId: kitchenId,
      equipmentId: fridgeId,
      status: 'todo',
      createdAt: now,
      updatedAt: now,
    },
    // Weekly Inspection Items
    {
      id: uuidv4(),
      inspectionId: weeklyInspectionId,
      title: 'Check AC Filter',
      description: 'Inspect and clean AC filter if needed',
      areaId: hallId,
      equipmentId: acId,
      status: 'in_review',
      createdAt: now - 86400000,
      updatedAt: now - 3600000,
    },
    {
      id: uuidv4(),
      inspectionId: weeklyInspectionId,
      title: 'Check Table Stability',
      description: 'Ensure table is stable and safe',
      areaId: hallId,
      equipmentId: table1Id,
      status: 'done',
      createdAt: now - 86400000,
      updatedAt: now - 7200000, // 2時間前
    },
  ])

  console.log('Database seeded successfully.')
}
