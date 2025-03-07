import React, { useState } from 'react';
import * as Firestore from "firebase/firestore";
import { ProjectsManager } from "../classes/ProjectsManager";
import { IProject, ProjectStatus, UserRole } from "../classes/Project";

interface Props {
  projectsManager: ProjectsManager;
  projectsCollection: Firestore.CollectionReference;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
}

export function ProjectForm(props: Props) {

  const handleCancel = () => {
    props.setIsModalOpen(false);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const projectData: IProject = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as ProjectStatus,
      userRole: formData.get("userRole") as UserRole,
      finishDate: new Date(formData.get("finishDate") as string),
    };

    try {
      Firestore.addDoc(props.projectsCollection, projectData);
      props.projectsManager.newProject(projectData);
      closeModal();
    } catch (err) {
      alert(err);
    }
    props.setIsModalOpen(false)
  };

  const closeModal = () => {
    const modal = document.getElementById("new-project-modal") as HTMLDialogElement;
    if (modal) modal.close();
  };
  return (
    <dialog id="new-project-modal" open={props.isModalOpen}>
      <form onSubmit={onFormSubmit} id="new-project-form">
        <h2>New Project</h2>
        <div className="input-list">
          <div className="form-field-container">
            <label>
              <span className="material-icons-round">apartment</span>Name
            </label>
            <input
              name="name"
              type="text"
              placeholder="What's the name of your project?"
            />
            <p style={{ color: "gray", fontSize: "var(--font-sm)", marginTop: 5, fontStyle: "italic" }}>
              TIP: Give it a short name
            </p>
          </div>
          <div className="form-field-container">
            <label>
              <span className="material-icons-round">subject</span>Description
            </label>
            <textarea
              name="description"
              cols={30}
              rows={5}
              placeholder="Give your project a nice description! So people are jealous about it."
            />
          </div>
          <div className="form-field-container">
            <label>
              <span className="material-icons-round">person</span>Role
            </label>
            <select name="userRole">
              <option>Architect</option>
              <option>Engineer</option>
              <option>Developer</option>
            </select>
          </div>
          <div className="form-field-container">
            <label>
              <span className="material-icons-round">not_listed_location</span>Status
            </label>
            <select name="status">
              <option>Pending</option>
              <option>Active</option>
              <option>Finished</option>
            </select>
          </div>
          <div className="form-field-container">
            <label htmlFor="finishDate">
              <span className="material-icons-round">calendar_month</span>Finish Date
            </label>
            <input name="finishDate" type="date" />
          </div>
          <div style={{ display: "flex", margin: "10px 0px 10px auto", columnGap: 10 }}>
            <button type="button" style={{ backgroundColor: "transparent" }} onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" style={{ backgroundColor: "rgb(18, 145, 18)" }}>
              Accept
            </button>
          </div>
        </div>
      </form>
    </dialog>
  );
}
