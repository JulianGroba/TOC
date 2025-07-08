export type Priority = 'Baja' | 'Media' | 'Alta'

export interface TodoInput {
    name: string
    task: string
    priority: Priority
    projectId?: string
    date?: Date
}

export interface TodoData {
    name: string
    task: string
    priority: Priority
    id: string
    projectId?: string
    date?: Date
    ifcGuids: string
    camera: string
    number?: number
}