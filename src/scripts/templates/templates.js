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

export const createAuthTemplate = (isLogin = true) => `
  <section class="auth">
    <h1>${isLogin ? "Login" : "Register"}</h1>
    <form id="${isLogin ? "login" : "register"}-form">
      ${
        !isLogin
          ? `
      <div class="form-group">
        <label for="name">Name</label>
        <input type="text" id="name" name="name" placeholder="Name" required />
      </div>
      `
          : ""
      }
      <div class="form-group">
        <label for="email">Email</label>
        <input type="email" id="email" name="email" placeholder="Email" required />
      </div>
      <div class="form-group">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" placeholder="Password" required />
      </div>
      <button type="submit" class="btn-submit">${isLogin ? "Login" : "Register"}</button>
    </form>
    <div class="auth-links">
      ${
        isLogin
          ? 'Belum punya akun? <a href="#/register">Daftar disini</a>'
          : 'Sudah punya akun? <a href="#/login">Login disini</a>'
      }
    </div>
  </section>
`;

export const createAddStoryTemplate = () => `
  <section>
        <div class="new-story__header">
          <div class="container">
            <h1 class="new-story__header__title">Tambah Cerita</h1>
            <p class="new-story__header__description">
              Silahkan lengkapi isi cerita anda.<br>
            </p>
          </div>
        </div>
      </section>
  
      <section class="container">
        <div class="new-form__container">
          <form id="new-form" class="new-form">
          
            <div class="form-control">
              <label for="description-input" class="new-form__description__title">Deskripsikan Cerita Anda</label>
  
              <div class="new-form__description__container">
                <textarea
                  id="description-input"
                  name="description"
                  placeholder="Masukkan cerita anda. Anda dapat curhat apa saja, dimana, kapan, dll."
                ></textarea>
              </div>
            </div>

            <div class="form-control">
              <label for="documentations-input" class="new-form__documentations__title">Dokumentasi</label>
              <div id="documentations-more-info">Anda wajib menyertakan foto sebagai dokumentasi.</div>
  
              <div class="new-form__documentations__container">
                <div class="new-form__documentations__buttons">
                  <button id="documentations-input-button" class="btn btn-outline" type="button">
                    Unggah File
                  </button>
                  <input
                    id="documentations-input"
                    name="documentations"
                    type="file"
                    accept="image/*"
                    multiple
                    hidden="hidden"
                    aria-multiline="true"
                    aria-describedby="documentations-more-info"
                  >
                  <button id="open-documentations-camera-button" class="btn btn-outline" type="button">
                    Buka Kamera
                  </button>
                </div>
                <div id="camera-container" class="new-form__camera__container">
                  <select id="camera-select" class="camera-select"></select>
                  <video id="camera-video" class="new-form__camera__video">
                    Video stream not available.
                  </video>
                  <canvas id="camera-canvas" class="new-form__camera__canvas"></canvas>
                  <div class="new-form__camera__tools">
                    <button id="camera-take-button" class="btn" type="button">
                      Ambil Gambar
                    </button>
                    <div id="file-uploaded">Jika ingin menghapus file telampir, klik saja pada filenya.</div>
                  </div>
                </div>
                <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
              </div>
            </div>

            <div class="form-control">
              <label for="new-form__location__title">Silahkan Masukkan Lokasi.</label>
              <div id="location-more-info">Anda dapat menggeser marker untuk menentukan lokasi yang tepat.</div>
              
              <div class="new-form__location__container">
                <div class="new-form__location__map__container">
                  <div id="map" class="new-form__location__map"></div>
                  <div id="map-loading-container"></div>
                </div>
                <div class="new-form__location__lat-lng">
                  <input type="number" name="latitude" value="-6.175389" disabled>
                  <input type="number" name="longitude" value="106.827139" disabled>
                </div>
              </div>
            </div>
            <div class="form-buttons">
              <span id="submit-button-container">
                <button class="btn" type="submit">Bagikan Cerita Anda!</button>
              </span>
              <a class="btn btn-outline" href="#/">Batal</a>
            </div>
          </form>
        </div>
      </section>
    `;

export const createStoryCardTemplate = (story) => `
      <div class="story-card">
        <img src="${story.photoUrl}" alt="${story.description}" loading="lazy">
          <div class="story-content">
            <h3>${story.name || "Anonim"}</h3>
            <p class="story-date">${story.createdAt ? new Date(story.createdAt).toLocaleDateString() : "Tanggal tidak tersedia"}</p>
            <p class="story-location">${locationText}</p>
            <p>${story.description.substring(0, 100)}${story.description.length > 100 ? "..." : ""}</p>
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
