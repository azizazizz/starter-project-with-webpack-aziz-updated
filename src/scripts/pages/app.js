import {
  generateMainNavigationListTemplate,
  generateAuthenticatedNavigationListTemplate,
  generateUnauthenticatedNavigationListTemplate,
} from "../templates/navigation-templates";
import { getActiveRoute } from "../routes/url-parser";
import { setupSkipToContent } from "../utils";
import { getAccessToken, getLogout } from "../utils/auth";
import { routes } from "../routes/routes";
import Swal from "sweetalert2";

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;
  #skipLinkButton;
  #navigationDrawer;
  #currentPage = null;
  #isTransitioning = false;
  #hashChangeTimeout = null;

  constructor({ content, drawerNavigation, drawerButton, skipLinkButton }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#drawerNavigation = drawerNavigation;
    this.#skipLinkButton = skipLinkButton;

    this.#init();
  }

  #init() {
    setupSkipToContent(this.#skipLinkButton, this.#content);
    this.#navigationDrawer = document.querySelector(".navigation-drawer");
    this.#setupDrawer();
    this.#setupNavigationList();
    this.#setupHashChangeListener();
  }

  #setupDrawer() {
    if (!this.#drawerButton || !this.#navigationDrawer) {
      console.error("Drawer elements not found");
      return;
    }

    this.#drawerButton.addEventListener("click", (e) => {
      e.stopPropagation();
      this.#navigationDrawer
        .querySelector(".navigation-drawer__navlist-main")
        .classList.toggle("open");
    });

    document.addEventListener("click", (event) => {
      const navList = this.#navigationDrawer.querySelector(
        ".navigation-drawer__navlist-main",
      );
      if (navList.classList.contains("open")) {
        const isClickInside = this.#navigationDrawer.contains(event.target);
        const isClickOnButton = this.#drawerButton.contains(event.target);

        if (!isClickInside && !isClickOnButton) {
          navList.classList.remove("open");
        }
      }
    });

    this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        this.#navigationDrawer
          .querySelector(".navigation-drawer__navlist-main")
          .classList.remove("open");
      });
    });
  }

  #setupNavigationList() {
    try {
      const isLogin = !!getAccessToken();
      const navListMain =
        this.#drawerNavigation?.querySelector("#navlist-main");
      const navList = this.#drawerNavigation?.querySelector("#navlist");

      if (!navListMain || !navList) {
        console.error("Navigation elements not found");
        return;
      }

      if (!isLogin) {
        navListMain.innerHTML = generateUnauthenticatedNavigationListTemplate();
        navList.innerHTML = "";
      } else {
        navListMain.innerHTML = generateMainNavigationListTemplate();
        navList.innerHTML = "";
      }

      const logoutButton = document.getElementById("logout-button");
      if (logoutButton) {
        logoutButton.addEventListener("click", (e) => {
          e.preventDefault();
          Swal.fire({
            title: "Apakah Anda yakin ingin keluar?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Ya, keluar",
            cancelButtonText: "Batal",
          }).then((result) => {
            if (result.isConfirmed) {
              getLogout();
              Swal.fire(
                "Berhasil Keluar",
                "Anda telah keluar dari akun.",
                "success",
              ).then(() => {
                location.hash = "/login";
              });
            }
          });
        });
      }
    } catch (error) {
      console.error("Navigation setup error:", error);
    }
  }

  #setupHashChangeListener() {
    window.addEventListener("hashchange", () => {
      clearTimeout(this.#hashChangeTimeout);
      this.#hashChangeTimeout = setTimeout(async () => {
        await this.#cleanupCurrentPage();
        await this.renderPage();
      }, 100);
    });
  }

  async #cleanupCurrentPage() {
    if (this.#currentPage && typeof this.#currentPage.cleanup === "function") {
      await this.#currentPage.cleanup();
    }
    this.#currentPage = null;
  }

  async renderPage() {
    if (this.#isTransitioning) return;
    this.#isTransitioning = true;

    const url = getActiveRoute();
    console.log("Mengakses route:", url);
    const route = routes[url];

    if (!route) {
      this.#content.innerHTML = "<h1>Halaman tidak ditemukan</h1>";
      this.#isTransitioning = false;
      return;
    }

    try {
      if (this.#currentPage?.cleanup instanceof Function) {
        await this.#currentPage.cleanup();
      }

      this.#currentPage = route();
      console.log("Rendering page:", this.#currentPage);

      const renderContent = async () => {
        if (this.#content && this.#currentPage) {
          this.#content.innerHTML = await this.#currentPage.render();
          await this.#currentPage.afterRender();
          this.#setupNavigationList();
        } else {
          console.error("Konten atau halaman tidak ditemukan.");
        }
      };

      if (!document.startViewTransition) {
        await renderContent();
        return;
      }

      try {
        const transition = document.startViewTransition(renderContent);
        await transition.ready;
        scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        if (error.name === "AbortError") {
          console.warn("Transisi dibatalkan, melanjutkan dengan render biasa");
        } else {
          console.error("Error during view transition:", error);
        }
        await renderContent();
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error rendering page:", error);
        this.#content.innerHTML =
          "<p>Terjadi kesalahan saat memuat halaman</p>";
      }
    } finally {
      this.#isTransitioning = false;
    }
  }
}
