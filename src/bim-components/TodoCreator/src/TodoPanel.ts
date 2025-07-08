import * as React from "react";
import * as OBC from "@thatopen/components";
import * as OBCF from "@thatopen/components-front";
import * as BUI from "@thatopen/ui";
import { TodoCreator } from "./TodoCreator";
import { TodoData } from "./base-types";

interface Props {
  todoCreator: TodoCreator;
}

export function TodoPanel ({ todoCreator }: Props){

  const todoTable = BUI.Component.create<BUI.Table>(() => {
    return BUI.html`<bim-table></bim-table>`;
  });
  
  //#region TodoTable

  const addTodo = (data: TodoData) => {
    let fecha = "Fecha no válida";
    try {
      const rawDate = data.date?.seconds ? new Date(data.date.seconds * 1000) : new Date(data.date);
      if (!isNaN(rawDate.getTime())) {
        fecha = rawDate.toDateString();
      }
    } catch (e) {
      console.warn("Fecha inválida en todo:", data);
    }
    console.log('Agregando elemento:', data);
    const newData = {
      data: {
        Nombre: data.name,
        Tarea: data.task,
        Prioridad: data.priority,
        Fecha: fecha,
        Guids: JSON.stringify(data.ifcGuids),
        Camera: data.camera ? JSON.stringify(data.camera) : "",
        Id: data.id,
        Número: data.number,
        Acciones: "",
      },
    };
    //#region Acciones
    todoTable.data = [...todoTable.data, newData];
    todoTable.dataTransform = {
      Acciones: (_, rowData) => {
        return BUI.html`
          <div style="display: flex; gap: 8px;">
            <bim-button 
              @click=${() => {
                const id = rowData.Id as string;
                console.log("Eliminando TODO con ID:", id);
                if (id) todoCreator.deleteTodo(id);
              }}
              icon="material-symbols:delete" style="background-color: red"
            ></bim-button>
            <bim-button
              @click=${() => {
                const id = rowData.Id;
                todoCreator.addTodoMaker(id as string, true);
              }}
              icon="ion:navigate"
            ></bim-button>
            <bim-button
              @click=${() => {}}
              icon="pajamas:abuse"
            ></bim-button>
          </div>`;
      },
    };
    todoTable.hiddenColumns = ["Guids", "Camera", "Número"];
  };
  //#endregion
  //#region Eventos
  const onRowCreated = (event) => {
    event.stopImmediatePropagation();
    const { row } = event.detail;
    const originalColor = row.style.backgroundColor;
    row.addEventListener("click", async () => {
      todoCreator.highlightTodo({
        name: row.data.Nombre,
        task: row.data.Tarea,
        priority: row.data.Prioridad,
        ifcGuids: JSON.parse(row.data.Guids),
        camera: JSON.parse(row.data.Camera),
        id: row.data.Id,
        date: new Date(row.data.Fecha),
      });
    });
    row.addEventListener("mouseover", () => {
      row.style.backgroundColor = "gray";
    });
    row.addEventListener("mouseout", () => {
      row.style.backgroundColor = originalColor;
    });
  };

  
  todoTable.addEventListener?.("rowcreated", onRowCreated);
  const setData = (todos: TodoData[]) => {
    todoTable.data = [];
    for (const todo of todos) {
      addTodo(todo);
    }
  };
    
  // Inicializar con los todos actuales
  setData(todoCreator._list);
    
  return { element: todoTable, setData };
}
