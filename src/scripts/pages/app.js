import {
  generateMainNavigationListTemplate,
  generateAuthenticatedNavigationListTemplate,
  generateUnauthenticatedNavigationListTemplate,
} from '../templates/navigation-templates';
import { getActiveRoute } from '../routes/url-parser';
import { setupSkipToContent } from '../utils';
import { getAccessToken, getLogout } from '../utils/auth';
import { showToast } from '../utils/toast';
import { routes } from '../routes/routes';

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;
  #skipLinkButton;
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
    this.#setupNavigationList();
    this.#setupDrawer();
    this.#setupHashChangeListener();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener('click', () => {
      this.#drawerNavigation.classList.toggle('open');
    });

    document.body.addEventListener('click', (event) => {
      const isInsideDrawer = this.#drawerNavigation.contains(event.target);
      const isInsideButton = this.#drawerButton.contains(event.target);

      if (!isInsideDrawer && !isInsideButton) {
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

      if (!navListMain || !navList) throw new Error('Navigation elements not found');

      if (!isLogin) {
        navListMain.innerHTML = generateUnauthenticatedNavigationListTemplate();
        navList.innerHTML = '';
        return;
      }

      navListMain.innerHTML = generateMainNavigationListTemplate();
      navList.innerHTML = generateAuthenticatedNavigationListTemplate();

      const logoutButton = document.getElementById('logout-button');
      logoutButton?.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Apakah Anda yakin ingin keluar?')) {
          getLogout();
          showToast('Berhasil Keluar', 'success');
          location.hash = '/login';
        }
      });
    } catch (error) {
      console.error('Navigation setup error:', error);
    }
  }

  #setupHashChangeListener() {
    window.addEventListener('hashchange', () => {
      clearTimeout(this.#hashChangeTimeout);
      this.#hashChangeTimeout = setTimeout(async () => {
        await this.#cleanupCurrentPage();
        await this.renderPage();
      }, 100); // debounce 100ms
    });
  }

  async #cleanupCurrentPage() {
    if (this.#currentPage?.cleanup instanceof Function) {
      await this.#currentPage.cleanup();
    }
    this.#currentPage = null;
  }

  async renderPage() {
    if (this.#isTransitioning) return;
    this.#isTransitioning = true;

    const url = getActiveRoute();
    const route = routes[url];

    if (!route) {
      this.#content.innerHTML = '<h1>Halaman tidak ditemukan</h1>';
      this.#isTransitioning = false;
      return;
    }

    try {
      if (this.#currentPage?.cleanup instanceof Function) {
        await this.#currentPage.cleanup();
      }

      this.#currentPage = route();

      const renderContent = async () => {
        this.#content.innerHTML = await this.#currentPage.render();
        await this.#currentPage.afterRender();
        this.#setupNavigationList();
      };

      if (!document.startViewTransition) {
        await renderContent();
        return;
      }

      try {
        const transition = document.startViewTransition(renderContent);
        await transition.ready;
        scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        if (error.name === 'AbortError') {
          console.warn('Transisi dibatalkan, melanjutkan dengan render biasa');
        } else {
          console.error('Error during view transition:', error);
        }
        await renderContent();
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error rendering page:', error);
        this.#content.innerHTML = '<p>Terjadi kesalahan saat memuat halaman</p>';
      }
    } finally {
      this.#isTransitioning = false;
    }
  }
}