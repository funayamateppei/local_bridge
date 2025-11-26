export class Equipment {
  readonly id: string
  readonly name: string
  readonly areaId: string

  constructor(id: string, name: string, areaId: string) {
    this.id = id
    this.name = name
    this.areaId = areaId
  }
}
