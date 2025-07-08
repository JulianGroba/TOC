import * as React from "react";
import * as Router from "react-router-dom";
import * as Firestore from "firebase/firestore";
import { IProject, Project } from "../classes/Project";
import { ProjectCard } from "./ProjectCard";
import { SearchBox } from "./SearchBox";
import { ProjectsManager } from "../classes/ProjectsManager";
import { getCollection } from "../firebase";
import { ProjectForm } from "./ProjectForm";

interface Props {
  projectsManager: ProjectsManager;
}

const projectsCollection = getCollection<IProject>("projects");

export function ProjectsPage({ projectsManager }: Props) {
  const [projects, setProjects] = React.useState<Project[]>(projectsManager.list);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Asignar callbacks solo una vez
  React.useEffect(() => {
    const onCreated = () => setProjects([...projectsManager.list]);
    const onDeleted = () => setProjects([...projectsManager.list]);

    projectsManager.OnProjectCreated = onCreated;
    projectsManager.OnProjectDeleted = onDeleted;

    return () => {
      // limpiar para evitar fugas
      projectsManager.OnProjectCreated = undefined!;
      projectsManager.OnProjectDeleted = undefined!;
    };
  }, [projectsManager]);

  // Cargar datos de Firestore solo una vez
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      const firebaseProjects = await Firestore.getDocs(projectsCollection);
      if (!mounted) return;
      firebaseProjects.docs.forEach((doc) => {
        const data = doc.data();
        const project = {
          ...data,
          finishDate: (data.finishDate as any as Firestore.Timestamp).toDate(),
        } as IProject;
        try {
          projectsManager.newProject(project, doc.id);
        } catch {}
      });
    };
    load();
    return () => { mounted = false; };  
  }, [projectsManager]);

  const navigate = Router.useNavigate();

  const handleDelete = async (id: string) => {
    await projectsManager.deleteProject(id);
    navigate("/");
  };

  const onExportProject = () => {
    projectsManager.exportToJSON();
  };

  const onImportProject = () => {
    projectsManager.importFromJSON();
  };

  const onProjectSearch = (value: string) => {
    setProjects(projectsManager.filterProjects(value));
  };

  const projectCards = projects.map((project) => (
    <Router.Link to={`/project/${project.id}`} key={project.id}>
      <ProjectCard project={project} />
    </Router.Link>
  ));

  return (
    <div className="page" id="projects-page" style={{ display: "flex" }}>
      <header>
        <h2>Projects</h2>
        <SearchBox onChange={onProjectSearch} />
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
          <button onClick={() => setIsModalOpen(true)} id="new-project-btn">
            <span className="material-icons-round">add</span>New Project
          </button>
        </div>
      </header>

      {!isModalOpen && (
        projects.length > 0 ? (
          <div id="projects-list">{projectCards}</div>
        ) : (
          <p>There is no projects to display!</p>
        )
      )}

      <ProjectForm
        projectsManager={projectsManager}
        projectsCollection={projectsCollection}
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
      />
    </div>
  );
}
