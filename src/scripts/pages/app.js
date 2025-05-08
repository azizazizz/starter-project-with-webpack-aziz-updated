import { 
    generateMainNavigationListTemplate,
    generateAuthenticatedNavigationListTemplate,
    generateUnauthenticatedNavigationListTemplate
  } from '../templates/navigation-templates';
import { getActiveRoute } from '../routes/url-parser';
import { setupSkipToContent, transitionHelper } from '../utils';
import { getAccessToken, getLogout } from '../utils/auth';
import { routes } from '../routes/routes';

export default class App {
  #content;
  #drawerButton;
  #drawerNavigation;
  #skipLinkButton;

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
          location.hash = '/login';
        }
      });
    } catch (error) {
      console.error('Navigation setup error:', error);
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    const route = routes[url];

    // Get page instance
    const page = route();

    const transition = transitionHelper({
      updateDOM: async () => {
        this.#content.innerHTML = await page.render();
        page.afterRender();
      },
    });

    transition.ready.catch(console.error);
    transition.updateCallbackDone.then(() => {
      scrollTo({ top: 0, behavior: 'instant' });
      this.#setupNavigationList();
    });
  }
}