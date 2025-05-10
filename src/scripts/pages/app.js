import { 
  generateMainNavigationListTemplate,
  generateAuthenticatedNavigationListTemplate,
  generateUnauthenticatedNavigationListTemplate
} from '../templates/navigation-templates';
import { getActiveRoute } from '../routes/url-parser';
import { setupSkipToContent, transitionHelper } from '../utils';
import { getAccessToken, getLogout } from '../utils/auth';
import { showToast } from '../utils/toast';
import { routes } from '../routes/routes';

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;
  #skipLinkButton;
  #currentPage = null;

  constructor({ content, drawerNavigation, drawerButton, skipLinkButton }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#drawerNavigation = drawerNavigation;
    this.#skipLinkButton = skipLinkButton;

    this.#init();
  }

  #init() {
    setupSkipToContent(this.#skipLinkButton, this.#content);
    this.#setupNavigationList();
    this.#setupDrawer();
    this.#setupHashChangeListener();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#drawerNavigation.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      const isTargetInsideDrawer = this.#drawerNavigation.contains(event.target);
      const isTargetInsideButton = this.#drawerButton.contains(event.target);

      if (!(isTargetInsideDrawer || isTargetInsideButton)) {
        this.#drawerNavigation.classList.remove('open');
      }

      this.#drawerNavigation.querySelectorAll('a').forEach((link) => {
        if (link.contains(event.target)) {
          this.#drawerNavigation.classList.remove('open');
        }
      });
    });
  }

  #setupNavigationList() {
    try {
      const isLogin = !!getAccessToken();
      const navListMain = this.#drawerNavigation?.children?.namedItem('navlist-main');
      const navList = this.#drawerNavigation?.children?.namedItem('navlist');

      if (!navListMain || !navList) {
        throw new Error('Navigation elements not found');
      }

      if (!isLogin) {
        navListMain.innerHTML = generateUnauthenticatedNavigationListTemplate();
        navList.innerHTML = '';
        return;
      }

      navListMain.innerHTML = generateMainNavigationListTemplate();
      navList.innerHTML = generateAuthenticatedNavigationListTemplate();

      const logoutButton = document.getElementById('logout-button');
      logoutButton?.addEventListener('click', (event) => {
        event.preventDefault();
        if (confirm('Apakah Anda yakin ingin keluar?')) {
          getLogout();
          showToast('Berhasil Keluar', 'success'); // Menampilkan toast setelah logout
          location.hash = '/login'; // Arahkan ke halaman login
        }
      });
    } catch (error) {
      console.error('Navigation setup error:', error);
    }
  }

  #setupHashChangeListener() {
    window.addEventListener('hashchange', async () => {
      await this.#cleanupCurrentPage();
      await this.renderPage();
    });
  }

  async #cleanupCurrentPage() {
    if (this.#currentPage && typeof this.#currentPage.cleanup === 'function') {
      await this.#currentPage.cleanup();
    }
    this.#currentPage = null;
  }

  async renderPage() {
    const url = getActiveRoute();
    const route = routes[url];

    if (!route) {
      this.#content.innerHTML = '<h1>Halaman tidak ditemukan</h1>';
      return;
    }

    try {
      // Cleanup previous page
      if (this.#currentPage && typeof this.#currentPage.cleanup === 'function') {
        await this.#currentPage.cleanup();
      }

      // Get new page instance
      this.#currentPage = route();

      if (!document.startViewTransition) {
        this.#content.innerHTML = await this.#currentPage.render();
        await this.#currentPage.afterRender();
        this.#setupNavigationList(); // Memanggil ulang setupNavigationList setelah render
        return;
      }

      const transition = document.startViewTransition(async () => {
        this.#content.innerHTML = await this.#currentPage.render();
        await this.#currentPage.afterRender();
      });

      await transition.ready;
      scrollTo({ top: 0, behavior: 'smooth' });

      // Memanggil ulang setupNavigationList setelah transisi selesai
      this.#setupNavigationList();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error rendering page:', error);
        this.#content.innerHTML = '<p>Terjadi kesalahan saat memuat halaman</p>';
      }
    }
  }
}