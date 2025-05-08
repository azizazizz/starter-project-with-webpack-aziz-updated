import NewPresenter from './new-presenter';
import * as StoryAPI from '../../data/api';
import { convertBase64ToBlob } from '../../utils';
import { generateLoaderAbsoluteTemplate } from '../../templates/templates';
import Camera from '../../utils/camera';
import Map from '../../utils/map';
import 'leaflet/dist/leaflet.css';

export default class NewPage {
  #presenter;
  #form;
  #camera;
  #takePictureHandler; // Declare the private field
  #takenDocumentations = [];
  #map = null;

  async render() {
    return `
      <section>
        <div class="new-story__header">
          <div class="container">
            <h1 class="new-story__header__title">Tambah Cerita</h1>
            <p class="new-story__header__description">
              Silakan lengkapi isi deskripsi cerita anda.<br>
            </p>
          </div>
        </div>
      </section>
  
      <section class="container">
        <div class="new-form__container">
          <form id="new-form" class="new-form">
            <div class="form-control">
              <label for="title-input" class="new-form__title__title">Judul Cerita</label>
  
              <div class="new-form__title__container">
                <input
                  id="title-input"
                  name="title"
                  placeholder="Masukkan Judul Cerita Anda"
                  aria-describedby="title-input-more-info"
                >
              </div>
              <div id="title-input-more-info">Pastikan judul cerita anda dibuat dengan jelas dan deskriptif dalam 1 kalimat.</div>
            </div>
  
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
              <div id="documentations-more-info">Anda dapat menyertakan foto sebagai dokumentasi.</div>
  
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
                  <video id="camera-video" class="new-form__camera__video">
                    Video stream not available.
                  </video>
                  <canvas id="camera-canvas" class="new-form__camera__canvas"></canvas>
  
                  <div class="new-form__camera__tools">
                    <div class="new-form__camera__tools_buttons">
                      <button id="camera-take-button" class="btn" type="button">
                        Ambil Gambar
                      </button>
                    </div>
                  </div>
                </div>
                <ul id="documentations-taken-list" class="new-form__documentations__outputs"></ul>
              </div>
            </div>
            <div class="form-control">
              <div class="new-form__location__title">Silahkan Masukkan Lokasi. Geser marker, atau klik lokasi saat ini.</div>
  
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
              <div class="new-form__location__tools">
              <button id="use-my-location" type="button" class="btn btn-outline">
                <i class="fas fa-location-arrow"></i> Gunakan Lokasi Saya
              </button>
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
  }

  async cleanup() {
    // Hentikan kamera
    if (this.#camera) {
      await this.#camera.stop();
      this.#camera = null;
    }
    
    // Bersihkan gambar
    this.#takenDocumentations.forEach(pic => {
      if (pic.url) URL.revokeObjectURL(pic.url);
    });
    this.#takenDocumentations = [];
    
    // Hapus event listeners
    window.removeEventListener('beforeunload', this.cleanup);
    window.removeEventListener('hashchange', this.cleanup);
  }

  async afterRender() {
    this.#presenter = new NewPresenter({
      view: this,
      model: StoryAPI,
    });
    this.#takenDocumentations = [];

    this.#presenter.showNewFormMap();
    this.#setupForm();
    this.#setupLocationButton(); 
  }

  #setupForm() {
    this.#form = document.getElementById('new-form');
    this.#form.addEventListener('submit', async (event) => {
      event.preventDefault();
      
      const data = {
        description: this.#form.elements.namedItem('description').value,
        photo: this.#takenDocumentations[0]?.blob, // Ambil gambar pertama saja
        lat: parseFloat(this.#form.elements.namedItem('latitude').value),
        lon: parseFloat(this.#form.elements.namedItem('longitude').value)
      };

      if (!data.description) {
        alert('Deskripsi wajib diisi!');
        return;
      }
      if (!data.photo) {
        alert('Foto wajib diupload!');
        return;
      }

      await this.#presenter.postNewStory(data);
    });

    document.getElementById('documentations-input').addEventListener('change', async (event) => {
      const insertingPicturesPromises = Object.values(event.target.files).map(async (file) => {
        return await this.#addTakenPicture(file);
      });
      await Promise.all(insertingPicturesPromises);

      await this.#populateTakenPictures();
    });

    document.getElementById('documentations-input-button').addEventListener('click', () => {
      this.#form.elements.namedItem('documentations-input').click();
    });

    const cameraContainer = document.getElementById('camera-container');
    const cameraButton = document.getElementById('open-documentations-camera-button');

    cameraButton.addEventListener('click', async (event) => {
      const isOpening = !cameraContainer.classList.contains('open');
      
      if (isOpening) {
        try {
          event.currentTarget.textContent = 'Tutup Kamera';
          cameraContainer.classList.add('open');
          this.#setupCamera();
          await this.#camera.launch();
        } catch (error) {
          console.error('Gagal membuka kamera:', error);
          cameraContainer.classList.remove('open');
          event.currentTarget.textContent = 'Buka Kamera';
        }
      } else {
        event.currentTarget.textContent = 'Buka Kamera';
        cameraContainer.classList.remove('open');
        this.#camera.stop();
      }
    });
  }

  #updateLatLngInput(latitude, longitude) {
    const latInput = this.#form.elements.namedItem('latitude');
    const lngInput = this.#form.elements.namedItem('longitude');
    latInput.value = latitude;
    lngInput.value = longitude;
  }

  async initialMap() {
    try {
      this.#map = await Map.build('#map', {
        zoom: 15,
        locate: true
      });
  
      const centerCoordinate = this.#map.getCenter();
      this.#updateLatLngInput(centerCoordinate.latitude, centerCoordinate.longitude);
  
      const draggableMarker = this.#map.addMarker(
        [centerCoordinate.latitude, centerCoordinate.longitude],
        { draggable: true }
      );
  
      draggableMarker.addEventListener('move', (event) => {
        const coordinate = event.target.getLatLng();
        this.#updateLatLngInput(coordinate.lat, coordinate.lng);
      });
  
      this.#map.addMapEventListener('click', (event) => {
        draggableMarker.setLatLng(event.latlng);
        this.#map.changeCamera(event.latlng);
      });
  
    } catch (error) {
      console.error('Gagal inisialisasi peta:', error);
    }
  }

  async #setupCamera() {
    if (!this.#camera) {
      this.#camera = new Camera({
        video: document.getElementById('camera-video'),
        canvas: document.getElementById('camera-canvas'),
        onError: (error) => {
          console.error('Camera Error:', error);
          alert('Error kamera: ' + error.message);
        }
      });
    }
  
    // Hapus event listener lama jika ada
    const takeButton = document.getElementById('camera-take-button');
    takeButton.removeEventListener('click', this.#takePictureHandler);
    
    // Buat handler baru
    this.#takePictureHandler = async () => {
      takeButton.disabled = true;
      
      try {
        // Tunggu sampai kamera benar-benar siap
        if (!this.#camera.isReady()) {
          throw new Error('Kamera belum siap. Tunggu beberapa saat.');
        }
  
        const image = await this.#camera.takePicture();
        if (!image) {
          throw new Error('Gagal mengambil gambar');
        }
        
        await this.#addTakenPicture(image);
        await this.#populateTakenPictures();
      } catch (error) {
        console.error('Error mengambil gambar:', error);
        alert('Error: ' + error.message);
      } finally {
        takeButton.disabled = false;
      }
    };
  
    // Pasang event listener baru
    takeButton.addEventListener('click', this.#takePictureHandler);
  }
  
  async cleanup() {
    // Hentikan kamera jika aktif
    if (this.#camera) {
      await this.#camera.stop();
      this.#camera = null;
    }
    
    // Bersihkan gambar
    this.#takenDocumentations.forEach(pic => {
      if (pic.url) URL.revokeObjectURL(pic.url);
    });
    this.#takenDocumentations = [];
    
    // Hapus event listeners
    const takeButton = document.getElementById('camera-take-button');
    if (takeButton) {
      takeButton.removeEventListener('click', this.#takePictureHandler);
    }
  }
  

  async #setupLocationButton() {
    const button = document.getElementById('use-my-location');
    const latInput = this.#form.elements.namedItem('latitude');
    const lngInput = this.#form.elements.namedItem('longitude');
  
    button.addEventListener('click', () => {
      this.#getUserLocation()
        .then(({ latitude, longitude }) => {
          // Update input form
          latInput.value = latitude;
          lngInput.value = longitude;
          
          // Update marker di peta (jika menggunakan Leaflet)
          if (this.#map) {
            this.#map.setView([latitude, longitude]);
            this.#map.removeAllMarkers();
            this.#map.addMarker([latitude, longitude], { draggable: true });
          }
          
          alert('Lokasi berhasil diperbarui!');
        })
        .catch(error => {
          console.error('Gagal mendapatkan lokasi:', error);
          alert('Tidak bisa mendapatkan lokasi. Pastikan GPS aktif!');
        });
    });
  }
  
  #getUserLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Browser tidak support geolocation'));
        return;
      }
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          reject(error);
        },
        { 
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  }

  async #addTakenPicture(image) {
    try {
      let blob = image;
  
      // Pastikan image adalah Blob atau File
      if (!(image instanceof Blob)) {
        if (typeof image === 'string') {
          blob = await convertBase64ToBlob(image, 'image/png');
        } else {
          throw new Error('Invalid image type');
        }
      }
  
      // Validasi blob
      if (!(blob instanceof Blob)) {
        throw new Error('Invalid blob created');
      }
  
      const newDocumentation = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        blob: blob,
      };
      
      this.#takenDocumentations = [...this.#takenDocumentations, newDocumentation];
      return true;
    } catch (error) {
      console.error('Error adding taken picture:', error);
      return false;
    }
  }

  async #populateTakenPictures() {
    const html = await Promise.all(this.#takenDocumentations.map(async (picture, currentIndex) => {
      // Pastikan blob valid sebelum membuat URL
      if (!(picture.blob instanceof Blob)) {
        console.error('Invalid blob:', picture.blob);
        return '';
      }
      
      try {
        const imageUrl = URL.createObjectURL(picture.blob);
        return `
          <li class="new-form__documentations__outputs-item">
            <button type="button" data-deletepictureid="${picture.id}" class="new-form__documentations__outputs-item__delete-btn">
              <img src="${imageUrl}" alt="Dokumentasi ke-${currentIndex + 1}">
            </button>
          </li>
        `;
      } catch (error) {
        console.error('Error creating object URL:', error);
        return '';
      }
    }));
  
    document.getElementById('documentations-taken-list').innerHTML = html.join('');

    document.querySelectorAll('button[data-deletepictureid]').forEach((button) =>
      button.addEventListener('click', (event) => {
        const pictureId = event.currentTarget.dataset.deletepictureid;

        const deleted = this.#removePicture(pictureId);
        if (!deleted) {
          console.log(`Picture with id ${pictureId} was not found`);
        }

        // Updating taken pictures
        this.#populateTakenPictures();
      }),
    );
  }

  #removePicture(id) {
    const selectedPicture = this.#takenDocumentations.find((picture) => {
      return picture.id == id;
    });

    // Check if founded selectedPicture is available
    if (!selectedPicture) {
      return null;
    }

    // Deleting selected selectedPicture from takenPictures
    this.#takenDocumentations = this.#takenDocumentations.filter((picture) => {
      return picture.id != selectedPicture.id;
    });

    return selectedPicture;
  }

  storeSuccessfully(message) {
    console.log(message);
    this.clearForm();

    // Redirect page
    location.hash = '/';
  }

  storeFailed(message) {
    alert(message);
  }

  clearForm() {
    this.#form.reset();
  }

  showMapLoading() {
    document.getElementById('map-loading-container').innerHTML = generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById('map-loading-container').innerHTML = '';
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner loader-button"></i> Bagikankan Cerita Anda!
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Bagikankan Cerita Anda!</button>
    `;
  }
}