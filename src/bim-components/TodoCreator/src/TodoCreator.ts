import * as OBC from "@thatopen/components"
import * as OBCF from "@thatopen/components-front"
import * as BUI from "@thatopen/ui"
import * as THREE from "three"
import { TodoData, TodoInput } from "./base-types"
import { UUID } from "@thatopen/components"

export class TodoCreator extends OBC.Component implements OBC.Disposable{
    static uuid = "fe04ded6-f563-472b-8d4c-467c308320cd"
    enabled = true
    private _list: TodoData[] = []


    onTodoCreated = new OBC.Event<TodoData>()
    onDisposed: OBC.Event<any> = new OBC.Event()
    onTodoDeleted = new OBC.Event<string>();

    constructor(components: OBC.Components) {
        super(components)
        this.components.add(TodoCreator.uuid, this)
    }

    async dispose() {
        this.enabled=false
        this._list = []
        this.onDisposed.trigger()
    }

    setup() {
        const highlighter = this.components.get(OBCF.Highlighter)
        highlighter.add(`${TodoCreator.uuid}-priority-Baja`, new THREE.Color(0x59bc59))
        highlighter.add(`${TodoCreator.uuid}-priority-Media`, new THREE.Color(0x597cff))
        highlighter.add(`${TodoCreator.uuid}-priority-Alta`, new THREE.Color(0xff7676))
    }

    async addTodo(data: TodoInput) {
        if (!this.enabled) return

        const todoData: TodoData = {
            name: data.name,
            task: data.task,
            priority: data.priority,
            id: UUID.create(),
            projectId: data.projectId,
            date: new Date()
        }
        this._list.push(todoData)
        this.onTodoCreated.trigger(todoData)
        }
    
    deleteTodo(id: string) {
        if (!this.enabled) return
            
        const todoExists = this._list.some((t) => t.id === id);
        if (!todoExists) {
        console.warn(`No se ha encontrado el todo con el id proporcionado: ${id}`)
        return
        }
    
        this._list = this._list.filter((t) => t.id !== id);
        this.onTodoDeleted.trigger(id);
    }
    
}