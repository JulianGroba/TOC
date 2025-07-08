import * as React from "react";
import * as Firestore from "firebase/firestore";
import { getCollection } from "../firebase";
import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import { TodoCreator, todoTool, TodoPanel } from "../bim-components/TodoCreator";
import { SearchBox } from "./SearchBox";
import { TodoData } from "../bim-components/TodoCreator/src/base-types";

interface Props {
  projectId: string;
  components: OBC.Components;
}

export function TodoCard(props: Props) {
  const { projectId, components } = props;
  const dashboard = React.useRef<HTMLDivElement>(null);
  const todoContainer = React.useRef<HTMLDivElement>(null);
  const todoCreator = components.get(TodoCreator)
  
  const [todos, setTodos] = React.useState<any[]>([]);
  const todoTableRef = React.useRef<{ element: any; setData: (todos: TodoData[]) => void } | null>(null);


  React.useEffect(() => {

    let unsubscribe: (() => void) | undefined;  

    async function init() {

      await todoCreator.setprojectId(projectId);

      // Reference to the global "todos" collection filtered by projectId
      const todosRef = Firestore.query(
        getCollection<TodoData>("todos"),
        Firestore.where("projectId", "==", projectId)
      );
      
      // Listen in real time
      unsubscribe = Firestore.onSnapshot(todosRef, (snapshot) => {
        const updatedTodos = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as TodoData[];
        setTodos(updatedTodos);
      
        // Actualizar tabla si ya está creada
        todoTableRef.current?.setData(updatedTodos);

      });
      
      const todoTable = TodoPanel({ todoCreator });
      todoTableRef.current = todoTable;

      // Append buttons and table
      dashboard.current?.appendChild(todoTable.element);
      const [todoButton, todoPriorityButton, showMarkersButton] = todoTool({ components });

      todoContainer.current?.appendChild(todoButton);
      todoContainer.current?.appendChild(todoPriorityButton);
      todoContainer.current?.appendChild(showMarkersButton);

      // Cleanup on dispose
      todoCreator.onDisposed.add(() => {
        todoTable.data = [];
        todoTable.remove();
        todoButton.remove();
        todoPriorityButton.remove();
        showMarkersButton.remove();
      });
    }

  init()
  console.log("TodoCard iniciado con projectId:", projectId);
  return () => {
    if (unsubscribe) unsubscribe();
  };
  }, [projectId]);

  // 🔍 Función de búsqueda
  const handleSearch = (value: string) => {
    const filtered = todos.filter((todo) =>
      todo.name.toLowerCase().includes(value.toLowerCase())
    );

    todoTableRef.current?.setData(filtered);
  };

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
            <SearchBox onChange={handleSearch}/>
          </div>
        </div>
      </div>
    </div>
  );
}