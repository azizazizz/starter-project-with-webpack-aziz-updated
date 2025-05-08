export const generateMainNavigationListTemplate = () => `
  <ul>
    <li><a href="#/">Beranda</a></li>
    <li><a href="#/add-story">Tambah Story</a></li>
  </ul>
`;

export const generateAuthenticatedNavigationListTemplate = () => `
  <ul>
    <li><a href="#" id="logout-button">Logout</a></li>
  </ul>
`;

export const generateUnauthenticatedNavigationListTemplate = () => `
  <ul>
    <li><a href="#/login">Login</a></li>
    <li><a href="#/register">Register</a></li>
  </ul>
`;