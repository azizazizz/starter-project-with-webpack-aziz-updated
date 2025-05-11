export const generateMainNavigationListTemplate = () => `
  <li><a href="#/">Beranda</a></li>
  <li><a href="#/add-story">Tambah Cerita</a></li>
  <li><a href="#" id="logout-button">Keluar</a></li>
`;

export const generateAuthenticatedNavigationListTemplate = () => `
  <li><a href="#/">Beranda</a></li>
  <li><a href="#/add-story">Tambah Cerita</a></li>
  <li><a href="#" id="logout-button">Keluar</a></li>
`;

export const generateUnauthenticatedNavigationListTemplate = () => `
  <li><a href="#/login">Masuk</a></li>
  <li><a href="#/register">Daftar</a></li>
`;
