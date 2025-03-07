import * as React from "react";
import * as Firestore from "firebase/firestore";
import { getCollection } from "../firebase";
import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import { TodoManager } from "../classes/TodoManager";
import { Todo, ITodo } from "../classes/Todo";
import { TodoCreator, todoTool } from "../bim-components/TodoCreator";
import { SearchBox } from "./SearchBox";

interface Props {
  projectId: string;
  components: OBC.Components;
}

const todosCollection = getCollection<ITodo>("todos");

export function TodoCard(props: Props) {
  const { projectId, components } = props;
  const todoManager = React.useRef(new TodoManager()).current; 
  const [todos, setTodos] = React.useState<Todo[]>(todoManager.list);
  const tableRef = React.useRef(null);

  const getFirestoreTodos = async () => {
    const firebaseTodos = await Firestore.getDocs(todosCollection);
    
    for (const doc of firebaseTodos.docs) {
      const data = doc.data();

      if (projectId !== data.projectId) continue;

      const todo: Todo = { ...data, id: doc.id };

      try {
        todoManager.newTodo(todo, todo.id);
      } catch (error) {
        console.error("Error agregando todo:", error);
      }
    }
    setTodos([...todoManager.list]);
  };

  const dashboard = React.useRef<HTMLDivElement>(null);
  const todoContainer = React.useRef<HTMLDivElement>(null);

  const onRowCreated = (event: CustomEvent) => {
    event.stopPropagation();
    const { row } = event.detail;
    const originalColor = row.style.backgroundColor;
    row.addEventListener("mouseover", () => (row.style.backgroundColor = "gray"));
    row.addEventListener("mouseout", () => (row.style.backgroundColor = originalColor));
  };

  const todoTable = BUI.Component.create<BUI.Table>(() => {
    return BUI.html`<bim-table @rowcreated=${onRowCreated}></bim-table>`;
  });

  const addTodo = async (data: { name: string; task: string; priority: string; id: string }) => {
    const todoRef = Firestore.doc(todosCollection, data.id);
    const newData = {
      Nombre: data.name,
      Tarea: data.task,
      Prioridad: data.priority,
      Fecha: new Date().toDateString(),
      id: data.id,
      projectId: projectId,
      Acciones: "",
    };

    try {
      const docSnap = await Firestore.getDoc(todoRef);
      if (docSnap.exists()) {
        console.warn("Tarea ya existe en Firestore, no se duplicará:", data);
        return;
      }
      await Firestore.setDoc(todoRef, newData);
      todoManager.newTodo(newData, data.id);
      setTodos([...todoManager.list]);
    } catch (error) {
      console.error("Error subiendo todo a Firestore:", error);
    }
    todoTable.data = [...(todoTable.data ?? []), { data: newData }];
  };

  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (loading) {
      (async () => {
        await getFirestoreTodos();
        setLoading(false);
        todoTable.data = todos.map((todo) => ({ data: { ...todo } }));
        console.log("todoTable.data", todoTable.data);
      })();
    }
  }, [todos, loading]);

  todoTable.dataTransform = {
    Acciones: (_, rowData) => {
      return BUI.html`
        <div style="display: flex; gap: 8px;">
          <bim-button 
            @click=${() => {
              const id = rowData.data.id;
              if (todoCreator?.deleteTodo) {
                todoCreator.deleteTodo(id as string);
                todoManager.deleteTodo(id as string);
                setTodos(todos.filter(todo => todo.id !== id));
              }
            }}
            icon="material-symbols:delete" style="background-color: red"
          ></bim-button>
        </div>
      `;
    },
  };

  todoTable.hiddenColumns = ["projectId", "id"];
  
  const todoCreator = components.get(TodoCreator);
  React.useEffect(() => {
    if (todoCreator) {
      const handler = (data) => addTodo(data);
      todoCreator.onTodoCreated.add(handler);

      return () => {
        todoCreator.onTodoCreated.remove(handler);
      };
    }
  }, [todoCreator]);
    

  React.useEffect(() => {
    if (dashboard.current) {
      dashboard.current.appendChild(todoTable);
    }
    if (todoContainer.current) {
      const [todoButton, todoPriorityButton, showMarkersButton] = todoTool({ components });
      todoContainer.current.appendChild(todoButton);
      todoContainer.current.appendChild(todoPriorityButton);
      todoContainer.current.appendChild(showMarkersButton);
    }

    return () => {
      todoTable.data = [];
      todoTable.remove();
      todoContainer.current?.childNodes.forEach((node) => node.remove());
    };
  }, []);

  const filtrarTabla = (valor: string) => {
    const filteredData = todos.filter((todo) => {
      const taskName = todo.Nombre || '';
      return taskName.toLowerCase().includes(valor.toLowerCase());
    });
    console.log(filteredData);
    setTodos(filteredData);
  }
  React.useEffect(() => {
    if (todos.length !== todoTable.data.length) {
      todoTable.data = todos.map((todo) => ({ data: { ...todo } }));
    }
    console.log("todoTable.data", todoTable.data);
    todoTable.requestUpdate();
  }, [todos]);


  return (
    <div className="dashboard-card" style={{ flexGrow: 1, padding: "5px" }} ref={dashboard}>
      <div
        style={{
          padding: "20px 30px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <bim-label style={{ fontSize: "var(--font-lg)", color: "#fff", paddingRight: "15px" }}>
          Tarea
        </bim-label>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "end", columnGap: 20 }} ref={todoContainer}>
          <div style={{ display: "flex", alignItems: "center", columnGap: 10 }}>
            <bim-label icon="material-symbols:search" style={{ color: "#fff" }}></bim-label>
            <SearchBox onChange={
              (value) => {filtrarTabla(value)
              }
            }/>
          </div>
        </div>
      </div>
    </div>
  );
}