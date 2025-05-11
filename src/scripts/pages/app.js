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
    this.#navigationDrawer = document.querySelector('.navigation-drawer');
    this.#setupDrawer();
    this.#setupNavigationList(); // <- tambahkan ini agar header terisi saat awal load
    this.#setupHashChangeListener();
  }


#setupDrawer() {
  // Pastikan elemen ada
  if (!this.#drawerButton || !this.#navigationDrawer) {
    console.error('Drawer elements not found');
    return;
  }

  // Handle klik tombol hamburger
  this.#drawerButton.addEventListener('click', (e) => {
    e.stopPropagation(); // Hindari event bubbling
    this.#navigationDrawer.querySelector('.navigation-drawer__navlist-main').classList.toggle('open');
  });

  // Handle klik di luar menu
  document.addEventListener('click', (event) => {
    const navList = this.#navigationDrawer.querySelector('.navigation-drawer__navlist-main');
    if (navList.classList.contains('open')) {
      const isClickInside = this.#navigationDrawer.contains(event.target);
      const isClickOnButton = this.#drawerButton.contains(event.target);
      
      if (!isClickInside && !isClickOnButton) {
        navList.classList.remove('open');
      }
    }
  });

  // Tutup menu saat link diklik
  this.#navigationDrawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      this.#navigationDrawer.querySelector('.navigation-drawer__navlist-main').classList.remove('open');
    });
  });
}

  #setupNavigationList() {
    try {
      const isLogin = !!getAccessToken();
      const navListMain = this.#drawerNavigation?.querySelector('#navlist-main');
      const navList = this.#drawerNavigation?.querySelector('#navlist');

      if (!navListMain || !navList) throw new Error('Navigation elements not found');

      // Menampilkan menu berdasarkan status login
      if (!isLogin) {
        navListMain.innerHTML = generateUnauthenticatedNavigationListTemplate();
        navList.innerHTML = ''; // Tidak perlu menambahkan apa pun di sini jika belum login
      } else {
        navListMain.innerHTML = generateMainNavigationListTemplate(); // Untuk pengguna yang login
        navList.innerHTML = ''; // Hapus template unauthenticated jika sudah login
      }

      // Menangani event logout
      const logoutButton = document.getElementById('logout-button');
      if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
          e.preventDefault();
          if (confirm('Apakah Anda yakin ingin keluar?')) {
            getLogout();
            showToast('Berhasil Keluar', 'success');
            location.hash = '/login';
          }
        });
      }
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