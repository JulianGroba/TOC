import { Todo, ITodo } from "./Todo"

export class TodoManager {
  list: Todo[] = []
  OnTodoCreated = (todo: Todo) => {}
  OnTodoDeleted = (id: string) => {}

  filterTodos(value: string) {
    const filteredTodos = this.list.filter((todo) => {
      return todo.name && todo.name.includes(value)
    })
    
    return filteredTodos
  }

  newTodo(data: ITodo, id?: string) {
    
    const todo = new Todo(data, id)
    this.list.push(todo)
    this.OnTodoCreated(todo)
    return todo
  }

  getTodo(id: string) {
    const todo = this.list.find((todo) => {
      return todo.id === id
    })
    return todo
  }
  
  deleteTodo(id: string) {
    const todo = this.getTodo(id)
    if (!todo) { return }
    const remaining = this.list.filter((todo) => {
      return todo.id !== id
    })
    this.list = remaining
    this.OnTodoDeleted(id)
  }

}
