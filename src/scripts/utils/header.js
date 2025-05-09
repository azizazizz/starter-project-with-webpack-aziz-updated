export const renderHeader = (isAuthenticated = false, userName = '') => {
    return `
      <header>
        <div class="container header-content">
          <a href="#/" class="brand">
            <span class="brand-name">DStory</span>
          </a>
          <nav class="navigation-drawer">
            <ul class="navigation-drawer__navlist-main">
              ${isAuthenticated ? `
                <li><span class="user-greeting">${userName}</span></li>
                <li><a href="#/add-story" class="nav-link">Tambah Cerita</a></li>
                <li><button id="logout-button" class="nav-link">Logout</button></li>
              ` : `
                <li><a href="#/login" class="nav-link">Login</a></li>
                <li><a href="#/register" class="nav-link">Register</a></li>
              `}
            </ul>
          </nav>
        </div>
      </header>
    `;
  };