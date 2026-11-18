const viewer = document.querySelector("#character-viewer");
const arButton = document.querySelector("#ar-button");

viewer.addEventListener("load", () => {
  console.log("3D character loaded");
});

viewer.addEventListener("ar-status", (event) => {
  console.log("AR status:", event.detail.status);
});