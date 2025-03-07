import { v4 as uuidv4 } from 'uuid'

export type TodoStatus = "pending" | "active" | "finished"

export interface ITodo {
  name: string
	description: string
	status: TodoStatus
	finishDate: Date
}

export class Todo implements ITodo {
	//To satisfy IProject
  name: string
	description: string
	status: TodoStatus
  finishDate: Date
  
  //Class internals
  projectId: string
  id: string

  constructor(data: ITodo, id = uuidv4()) {
    for (const key in data) {
      this[key] = data[key]
    }
    this.id = id
  }
}