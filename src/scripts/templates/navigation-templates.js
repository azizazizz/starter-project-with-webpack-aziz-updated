export const generateMainNavigationListTemplate = () => `
  <ul>
    <li><a href="#/">Beranda</a></li>
    <li><a href="#/add-story">Tambah Cerita</a></li>
  </ul>
`;

export const generateAuthenticatedNavigationListTemplate = () => `
  <ul>
    <li><a href="#" id="logout-button">Keluar</a></li>
  </ul>
`;

export const generateUnauthenticatedNavigationListTemplate = () => `
  <ul>
    <li><a href="#/login">Masuk</a></li>
    <li><a href="#/register">Daftar</a></li>
  </ul>
`;