import * as React from "react";
import * as Router from "react-router-dom";
import * as Firestore from "firebase/firestore";
import { IProject, Project, ProjectStatus, UserRole } from "../classes/Project";
import { ProjectCard } from "./ProjectCard";
import { SearchBox } from "./SearchBox";
import { ProjectsManager } from "../classes/ProjectsManager";
import { getCollection } from "../firebase";
import { ProjectForm } from "./ProjectForm";

interface Props {
  projectsManager: ProjectsManager
}

const projectsCollection = getCollection<IProject>("projects")

export function ProjectsPage(props: Props) {

  const [projects, setProjects] = React.useState<Project[]>(props.projectsManager.list)
  props.projectsManager.OnProjectCreated = () => {setProjects([...props.projectsManager.list])}
  const dialogRef = React.useRef<HTMLDialogElement>(null);

  const getFirestoreProjects = async () => {
    const firebaseProjects = await Firestore.getDocs(projectsCollection)
    for (const doc of firebaseProjects.docs) {
      const data = doc.data()
      const project: IProject = {
        ...data,
        finishDate: (data.finishDate as unknown as Firestore.Timestamp).toDate()
      }
      try {
        props.projectsManager.newProject(project, doc.id)
      } catch (error) {
        
      }
    }
  }

  React.useEffect(() => {
    getFirestoreProjects()
  }, [])

  const projectCards = projects.map((project) => {
    return (
      <Router.Link to={`/project/${project.id}`} key={project.id} >
        <ProjectCard project={project} />
      </Router.Link>
    )
  })

  React.useEffect(() => {
    console.log("Projects state updated", projects)
  }, [projects])

  const openModal = () => {
    setIsModalOpen(true);
  };
  const onExportProject = () => {
    props.projectsManager.exportToJSON()
  }

  const onImportProject = () => {
    props.projectsManager.importFromJSON()
  }

  const onProjectSearch = (value: string) => {
    setProjects(props.projectsManager.filterProjects(value))
  }

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div className="page" id="projects-page" style={{ display: "flex" }}>
      <header>
        <h2>Projects</h2>
        <SearchBox onChange={(value) => onProjectSearch(value)}/>
        <div style={{ display: "flex", alignItems: "center", columnGap: 15 }}>
          <span
            id="import-projects-btn"
            className="material-icons-round action-icon"
            onClick={onImportProject}
          >
            file_upload
          </span>
          <span
            id="export-projects-btn"
            className="material-icons-round action-icon"
            onClick={onExportProject}
          >
            file_download
          </span>
          <button onClick={openModal} id="new-project-btn">
            <span className="material-icons-round">add</span>New Project
          </button>
        </div>
      </header>
      {
        !isModalOpen && (
          projects.length > 0 ? <div id="projects-list">{ projectCards }</div> : <p>There is no projects to display!</p>
        )
      }
      <ProjectForm
        projectsManager={props.projectsManager}
        projectsCollection={projectsCollection}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    </div>
  )
}