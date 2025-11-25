import { db } from '@/infrastructure/db'
import { v4 as uuidv4 } from 'uuid'

export const seedDatabase = async () => {
  const areaCount = await db.areas.count()
  if (areaCount > 0) {
    console.log('Database already seeded.')
    return
  }

  console.log('Seeding database...')

  // Areas
  const kitchenId = uuidv4()
  const hallId = uuidv4()

  await db.areas.bulkAdd([
    { id: kitchenId, name: 'Kitchen' },
    { id: hallId, name: 'Hall' },
  ])

  // Equipments
  await db.equipments.bulkAdd([
    { id: uuidv4(), name: 'Dishwasher', areaId: kitchenId },
    { id: uuidv4(), name: 'Oven', areaId: kitchenId },
    { id: uuidv4(), name: 'Fridge', areaId: kitchenId },
    { id: uuidv4(), name: 'Air Conditioner', areaId: hallId },
    { id: uuidv4(), name: 'Table 1', areaId: hallId },
  ])

  console.log('Database seeded successfully.')
}
