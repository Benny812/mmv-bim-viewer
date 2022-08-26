import { projects } from "./projects.js";

const projectsContainer = document.getElementById("projects-container");
const projectCards = Array.from(projectsContainer.children);

const firstProject = projects[0];
const templateProjectCard = projectCards[0];

const baseURL = "./index.html";

for (let project of projects) {
  const newCard = templateProjectCard.cloneNode(true);
  const cardTitle = newCard.querySelector("h3");

  cardTitle.textContent = project.name;
  const button = newCard.querySelector("a");

  button.href = baseURL + `?id=${project.id}`;
  projectsContainer.appendChild(newCard);
}

templateProjectCard.remove();
