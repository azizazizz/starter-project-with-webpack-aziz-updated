export const createStoryItemTemplate = (story) => `
  <div class="story-item">
    <div class="story-photo">
      <img src="${story.photoUrl}" alt="${story.description}" loading="lazy">
    </div>
    <div class="story-content">
      <p class="story-description">${story.description}</p>
      <p class="story-user">Oleh: ${story.name}</p>
      <p class="story-date">${new Date(story.createdAt).toLocaleString()}</p>
      <button class="btn-detail" data-id="${story.id}">Lihat Detail</button>
    </div>
  </div>
`;

export const createStoryDetailTemplate = (story) => `
  <section class="story-detail">
    <h2>Detail Story</h2>
    <div class="story-detail-content">
      <div class="story-photo">
        <img src="${story.photoUrl}" alt="${story.description}">
      </div>
      <div class="story-info">
        <p class="story-description">${story.description}</p>
        <p class="story-user">Oleh: ${story.name}</p>
        <p class="story-date">${new Date(story.createdAt).toLocaleString()}</p>
        ${story.lat && story.lon ? `
        <div class="story-location">
          <h3>Lokasi</h3>
          <div id="detail-map" style="height: 300px; width: 100%;"></div>
        </div>
        ` : ''}
        <button class="btn-back">Kembali</button>
      </div>
    </div>
  </section>
`;

export const createShowStoryDetailTemplate = () => `
        <section class="story-detail">
          <h2>Detail Story</h2>
          <div class="story-detail-content">
            <div class="story-photo">
              <img src="${data.story.photoUrl}" alt="${data.story.description}">
            </div>
            <div class="story-info">
              <p class="story-description">${data.story.description}</p>
              <p class="story-user">Oleh: ${data.story.name}</p>
              <p class="story-date">${new Date(data.story.createdAt).toLocaleString()}</p>
              ${data.story.lat && data.story.lon ? `
              <div class="story-location">
                <h3>Lokasi</h3>
              <div id="detail-map" style="height: 300px; width: 100%;"></div>
            </div>
          ` : ''}
        <button class="btn-back" onclick="location.hash='#'">Kembali</button>
      </div>
    </div>
  </section>
`;

export const createAuthTemplate = (isLogin = true) => `
  <section class="auth">
    <h2>${isLogin ? 'Login' : 'Register'}</h2>
    <form id="${isLogin ? 'login' : 'register'}-form">
      ${!isLogin ? `
      <div class="form-group">
        <label for="name">Nama</label>
        <input type="text" id="name" name="name" placeholder="Nama" required />
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
        <div class="camera-options">
          <button type="button" id="open-camera-btn" class="btn">Buka Kamera</button>
          <span>atau</span>
          <input type="file" id="photo-input" name="photo" accept="image/*" capture="environment" />
        </div>
        <video id="camera-view" autoplay playsinline style="display:none;"></video>
        <canvas id="camera-canvas" style="display:none;"></canvas>
        <button type="button" id="capture-btn" class="btn" style="display:none;">Ambil Foto</button>
        <div id="photo-preview"></div>
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

export const createErrorTemplate = (message) => `
  <div class="error">
    <p>${message}</p>
    <button onclick="location.reload()">Coba Lagi</button>
  </div>
`;