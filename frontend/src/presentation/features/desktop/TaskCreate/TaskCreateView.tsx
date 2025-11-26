import { useState } from 'react'
import { Button, Input, Textarea, Select } from '@/presentation/components/ui'
import type { Area, Equipment } from '@/domain/types/inspection'

interface TaskCreateViewProps {
  areas: Area[]
  equipments: Equipment[]
  onSubmit: (data: {
    title: string
    description: string
    areaId: string
    equipmentId: string
  }) => void
  isLoading: boolean
}

export const TaskCreateView = ({ areas, equipments, onSubmit, isLoading }: TaskCreateViewProps) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [areaId, setAreaId] = useState('')
  const [equipmentId, setEquipmentId] = useState('')

  // 選択されたエリアに紐づくターゲットのみを表示
  const filteredEquipments = equipments.filter((e) => e.areaId === areaId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !areaId || !equipmentId) return
    onSubmit({ title, description, areaId, equipmentId })
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-surface/30 rounded-xl border border-surface backdrop-blur-sm">
      <h2 className="text-2xl font-bold mb-6">Create Inspection Task</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Daily Kitchen Inspection"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Area</label>
            <Select
              value={areaId}
              onChange={(e) => {
                setAreaId(e.target.value)
                setEquipmentId('') // エリア変更時にターゲットをリセット
              }}
              required
            >
              <option value="">Select Area</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Target Equipment</label>
            <Select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              disabled={!areaId}
              required
            >
              <option value="">Select Equipment</option>
              {filteredEquipments.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Description (Optional)</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Check for any leaks or strange noises..."
            rows={4}
          />
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Task'}
          </Button>
        </div>
      </form>
    </div>
  )
}
