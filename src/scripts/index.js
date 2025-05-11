import "../styles/styles.css";
import "../styles/responsives.css";
import "leaflet/dist/leaflet.css";
import App from "./pages/app";

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.getElementById("main-content"),
    drawerButton: document.getElementById("drawer-button"),
    drawerNavigation: document.getElementById("navigation-drawer"),
    skipLinkButton: document.querySelector(".skip-link"),
  });

  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    if (
      window.currentPage &&
      typeof window.currentPage.cleanup === "function"
    ) {
      await window.currentPage.cleanup();
    }

    await app.renderPage();
  });
});
