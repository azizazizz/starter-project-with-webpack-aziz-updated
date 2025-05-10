
export const generateMainNavigationListTemplate = () => `
  <ul>
    <li><a href="#/">Home</a></li>
    <li><a href="#/add-story">Tambah Story</a></li>
    <li><a href="#/about">Tentang Kami</a></li>
  </ul>
`;

export const generateUnauthenticatedNavigationListTemplate = () => `
  <ul>
    <li><a href="#/login">Login</a></li>
    <li><a href="#/register">Register</a></li>
  </ul>
`;

export const createStoryItemTemplate = (story) => `
  <div class="story-item">
    <div class="story-photo">
      <img src="${story.photoUrl}" alt="${story.description}" loading="lazy">
    </div>
    <div class="story-content">
      <p class="story-description">${story.description}</p>
      <p class="story-user">Oleh: ${story.name}</p>
      <p class="story-date">${new Date(story.createdAt).toLocaleString()}</p>
    </div>
  </div>
`;

export const createAuthTemplate = (isLogin = true) => `
  <section class="auth">
    <h1>${isLogin ? 'Login' : 'Register'}</h1>
    <form id="${isLogin ? 'login' : 'register'}-form">
      ${!isLogin ? `
      <div class="form-group">
        <label for="name">Name</label>
        <input type="text" id="name" name="name" placeholder="Name" required />
      </div>
      ` : ''}
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="Email" required />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Password" required />
      </div>
      <button type="submit" class="btn-submit">${isLogin ? 'Login' : 'Register'}</button>
    </form>
    <div class="auth-links">
      ${isLogin ? 
        'Belum punya akun? <a href="#/register">Daftar disini</a>' : 
        'Sudah punya akun? <a href="#/login">Login disini</a>'}
    </div>
  </section>
`;

export const createAddStoryTemplate = () => `
  <section class="add-story">
    <h2>Tambah Cerita</h2>
    <form id="story-form">
      <div class="form-group">
        <label for="description">Deskripsi Cerita</label>
        <textarea id="description" name="description" placeholder="Deskripsi cerita..." required></textarea>
      </div>
      
      <div class="form-group">
        <label>Foto</label>
        <div id="camera-container" class="new-form__camera__container">
        <select id="camera-select" class="camera-select"></select>
        <video id="camera-video" class="new-form__camera__video"></video>
        <canvas id="camera-canvas" class="new-form__camera__canvas"></canvas>
        <div class="new-form__camera__tools">
          <button id="camera-take-button" class="btn" type="button">Ambil Gambar</button>
        </div>
      </div>
      </div>
      
      <div class="form-group">
        <label>Lokasi</label>
        <div id="map" style="height: 300px; width: 100%;"></div>
        <div class="location-coords">
          <div>
            <label>Latitude:</label>
            <input type="text" id="lat" name="lat" readonly />
          </div>
          <div>
            <label>Longitude:</label>
            <input type="text" id="lon" name="lon" readonly />
          </div>
        </div>
        <button type="button" id="get-location-btn" class="btn">Dapatkan Lokasi Saat Ini</button>
      </div>
      
      <button type="submit" class="btn-submit">Kirim Cerita</button>
    </form>
  </section>
`;

export const generateStoryCardTemplate = (story) => `
  <div class="story-card">
    <img src="${story.photoUrl}" alt="${story.description}" loading="lazy">
    <div class="story-content">
      <h3>${story.name}</h3>
      <p>${story.description.substring(0, 100)}...</p>
      <small>${new Date(story.createdAt).toLocaleDateString()}</small>
    </div>
  </div>
`;

export function generateLoaderTemplate() {
  return `
    <div class="loader"></div>
  `;
}

export function generateLoaderAbsoluteTemplate() {
  return `
    <div class="loader loader-absolute"></div>
  `;
}

export const createErrorTemplate = (message) => `
  <div class="error">
    <p>${message}</p>
    <button onclick="location.reload()">Coba Lagi</button>
  </div>
`;