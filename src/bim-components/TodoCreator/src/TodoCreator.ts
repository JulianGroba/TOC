import * as OBC from "@thatopen/components"
import * as OBCF from "@thatopen/components-front"
import * as BUI from "@thatopen/ui"
import * as THREE from "three"
import { TodoData, TodoInput } from "./base-types"
import { UUID } from "@thatopen/components"
import * as Firestore from "firebase/firestore";
import { getCollection } from "../../../firebase";

const todosCollection = getCollection<TodoData>("todos")

export class TodoCreator extends OBC.Component implements OBC.Disposable{
  static uuid = "fe04ded6-f563-472b-8d4c-467c308320cd"
  enabled = true
  _list: TodoData[] = []
  private _world!: OBC.World
  private _markers: {[id: string]: OBCF.Mark} = {}
  private _projectId: string = ''
  private _loaded = false

  onDisposed: OBC.Event<any> = new OBC.Event()

  onTodoCreated = new OBC.Event<TodoData>();
  async onTodoDeleted (id: string) {
    const docRef = Firestore.doc(todosCollection, id);
    await Firestore.deleteDoc(docRef);
    console.log(`TODO con ID ${id} eliminado de Firestore.`);
  }


  constructor(components: OBC.Components) {
    super(components)
    this.components.add(TodoCreator.uuid, this)
    //this.getFirestoreTodos(this._projectId)
  }

  async dispose() {
    this.enabled=false
    this._list = []
    this.onDisposed.trigger()
  }

  async setprojectId(projectId: string) {
    if (this._projectId == projectId && this._loaded) return
    console.log("Asignando projectId:", projectId);
    this._projectId = projectId;
    this._list = []
    this._loaded = true
    await this.getFirestoreTodos(projectId)
    
  }

  async getFirestoreTodos(projectId: string) {
    console.log("Cargando TODOs desde Firestore") 
    const firebaseTodos = await Firestore.getDocs(todosCollection)
    //console.log("firebaseTodos", firebaseTodos.docs)
    for (const doc of firebaseTodos.docs) {
      const data = doc.data();
      
      const docProjectId = (data.projectId || "").trim();
      const currentProjectId = (this._projectId || "").trim();
      
      if (docProjectId !== currentProjectId) continue;

      //console.log("Doc ID:", doc.id, "ProjectId en documento:", data.ProjectId, "ProjectId esperado:", this._projectId);
      
      const alreadyExists = this._list.some(todo => todo.id === doc.id);
        if (!alreadyExists) {
          const todoWithId = { ...data, id: doc.id };
          this._list.push(todoWithId)
          this.onTodoCreated.trigger(todoWithId); 
      }
      
      if (this._list.length === 0) {
        const ejemploTodo: TodoInput = {
          name: "Ejemplo de tarea",
          task: "Esta es una tarea de ejemplo",
          priority: "Alta", 
          projectId: this._projectId
        };
        await this.addTodo(ejemploTodo);
        }
    }
    console.log("Tareas cargadas desde Firestore:", this._list);
    return this._list
  }


  setup() {
    const highlighter = this.components.get(OBCF.Highlighter)
    highlighter.add(`${TodoCreator.uuid}-priority-Baja`, new THREE.Color(0x59bc59))
    highlighter.add(`${TodoCreator.uuid}-priority-Media`, new THREE.Color(0x597cff))
    highlighter.add(`${TodoCreator.uuid}-priority-Alta`, new THREE.Color(0xff7676))
  }

  set world(world: OBC.World) {
    this._world = world
  }

  set enablePriorityHighlight(value: boolean) {
    const highlighter = this.components.get(OBCF.Highlighter)
    if (value) {
      for (const todo of this._list) {
        const fragments = this.components.get(OBC.FragmentsManager)
        const fragmentIdMap = fragments.guidToFragmentIdMap(todo.ifcGuids)
        highlighter.highlightByID(`${TodoCreator.uuid}-priority-${todo.priority}`, fragmentIdMap, false, false)
      }  
    } else {
      highlighter.clear()
    }
  }

  async addTodo(data: TodoInput) {
    if (!this.enabled) return

    const fragments = this.components.get(OBC.FragmentsManager)
    const highlighter = this.components.get(OBCF.Highlighter)
    const guids = fragments.fragmentIdMapToGuids(highlighter.selection.selectEvent)
    const number = guids.length
    const camera = this._world.camera
    const projectId = this._projectId

    if (!(camera instanceof OBC.OrthoPerspectiveCamera)) {
      throw new Error("No camera found in the world")
    }

    if (!projectId) {
      throw new Error("El projectId es obligatorio para crear un TODO.");
    }
  
    const position = new THREE.Vector3()
    camera.controls.getPosition(position)
    const target = new THREE.Vector3()
    camera.controls.getTarget(target)
    const todoData: TodoData = {
      name: data.name,
      task: data.task,
      priority: data.priority,
      ifcGuids: JSON.stringify(guids),
      camera: JSON.stringify({ position, target }),
      projectId: projectId,
      date: new Date(),
      number: number
    }
    
    // Guardamos en Firestore y obtenemos el ID generado
    const docRef = await Firestore.addDoc(todosCollection, todoData);
    const todoWithId: TodoData = { ...todoData, id: docRef.id };

    this._list.push(todoWithId)
    this.onTodoCreated.trigger(todoWithId)
    console.log("TODO creado y guardado en Firestore:", todoWithId);
    }
  
  async highlightTodo(todo: TodoData) {
    if (!this.enabled) return
    const guids = JSON.parse(todo.ifcGuids);
    const todoCamera = JSON.parse(todo.camera);
    const fragments = this.components.get(OBC.FragmentsManager)
    const fragmentIdMap = fragments.guidToFragmentIdMap(guids)
    const highlighter = this.components.get(OBCF.Highlighter)
    highlighter.highlightByID("selectEvent", fragmentIdMap, true, false)

    if (!this._world) {
      throw new Error("No world found")
    }

    const camera = this._world.camera
    if (!(camera.hasCameraControls())) {
      throw new Error("The world camera doesn't have camera controls")
    }
    await camera.controls.setLookAt(
      todoCamera.position.x,
      todoCamera.position.y,
      todoCamera.position.z,
      todoCamera.target.x,
      todoCamera.target.y,
      todoCamera.target.z,
      true
    );
  }

  filterTodos(value: string) {
    const filteredTodos = this._list.filter((todo) => {
      return todo.name.includes(value)
    })
    return filteredTodos
  }

  deleteTodo(id: string) {
    if (!this.enabled) return
        
    const todoExists = this._list.some((t) => t.id === id);
    if (!todoExists) {
    console.warn(`No se ha encontrado el todo con el id proporcionado: ${id}`)
    return
    }

    this._list = this._list.filter((t) => t.id !== id);
    this.onTodoDeleted(id);
  }
  addTodoMaker(todoId: string, singleMarker: boolean = true) {
    if (!this.enabled) return

    const todo = this._list.find((t) => t.id === todoId)
    if (!todo) return

    if (todo.ifcGuids.length === 0) return

    if (singleMarker && this._markers[todoId]) {
      this._markers[todoId].dispose()
      delete this._markers[todoId]
      return
    } else if (this._markers[todoId]) {
      return
    }
    const guids = JSON.parse(todo.ifcGuids);
    const fragments = this.components.get(OBC.FragmentsManager)
    const fragmentIdMap = fragments.guidToFragmentIdMap(guids)
    const boundingBoxer = this.components.get(OBC.BoundingBoxer)
    boundingBoxer.addFragmentIdMap(fragmentIdMap)
    const { center } = boundingBoxer.getSphere()
    boundingBoxer.reset()

    const label = BUI.Component.create<BUI.Label>(() => {
      return BUI.html `
        <bim-label
          @mouseover=${() => {
            const highlighter = this.components.get(OBCF.Highlighter)
            highlighter.highlightByID("hoverEvent", fragmentIdMap, true, false) // Como en el IFCViewer
          }}
          style="background-color: var(--bim-ui_bg-contrast-100); cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 999px; pointer-events: auto;"
          icon="fa:map-marker"
        ></bim-label>
      `
  })
  const marker = new OBCF.Mark(this._world, label)
  marker.three.position.copy(center)
  this._markers[todo.id] = marker
    
  }  
  set enableMarkers(value: boolean) {
    if (!this.enabled) return
    
    if (value) {

      for (const todo of this._list) {
        this.addTodoMaker(todo.id, false)
      }
      
    } else {
      for (const [id, mark] of Object.entries(this._markers)) {
        mark.dispose()
        delete this._markers[id]
      }
    }
  }   
}