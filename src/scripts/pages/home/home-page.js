import HomePresenter from './home-presenter';
import * as StoryAPI from '../../data/api';
import 'leaflet/dist/leaflet.css';

export default class HomePage {
  #presenter;
  #stories = [];
  #map = null;
  #markers = [];
  #currentPage = 1; // Halaman saat ini
  #pageSize = 10; // Jumlah cerita per halaman

  async render() {
    return `
    <section class="content">
      <h1 class="explore__label">Cerita Terkini</h1>
      <div id="stories-list" class="stories-list"></div>

      <!-- Tombol Load More -->
      <button id="load-more" class="btn btn-load-more">Muat Lebih Banyak Cerita</button>

      <!-- Menambahkan container untuk peta -->
      <div id="stories-map" style="height: 400px;"></div>

      <div id="map-loading" class="map-loading" style="display: none;">
        <div class="loader"></div>
      </div>
    </section>
  `;
  }

  async afterRender() {
    this.#presenter = new HomePresenter({
      view: this,
      model: StoryAPI
    });

    try {
      await this.#presenter.showStories(this.#currentPage, this.#pageSize);
    } catch (error) {
      this.showError(error);
    }

    // Menambahkan event listener pada tombol load more
    const loadMoreButton = document.getElementById('load-more');
    if (loadMoreButton) {
      loadMoreButton.addEventListener('click', this.loadMore.bind(this));
    }
  }

  async loadMore() {
    this.#currentPage++; // Increment halaman saat ini
    try {
      await this.#presenter.showStories(this.#currentPage, this.#pageSize);
    } catch (error) {
      this.showError(error);
    }
  }

  showStories(stories) {
    try {
      if (!Array.isArray(stories)) {
        throw new Error('Data stories harus berupa array');
      }

      this.#stories = [...this.#stories, ...stories]; // Menambah cerita baru tanpa menghapus yang lama
      const storiesList = document.getElementById('stories-list');
      
      if (!storiesList) {
        throw new Error('Element stories-list tidak ditemukan');
      }

      storiesList.innerHTML = this.#stories.map(story => {
        if (!story.photoUrl || !story.description) {
          console.warn('Story data tidak valid:', story);
          return '';
        }

        let locationText = 'Lokasi tidak diketahui';
        if (story.lat && story.lon) {
          const lat = parseFloat(story.lat).toFixed(6);
          const lon = parseFloat(story.lon).toFixed(6);
          locationText = `Lokasi: ${lat}, ${lon}`;
        }

        return `
          <div class="story-card">
            <img src="${story.photoUrl}" alt="${story.description}" loading="lazy">
            <div class="story-content">
              <h3>${story.name || 'Anonim'}</h3>
              <p class="story-date">${story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Tanggal tidak tersedia'}</p>
              <p class="story-location">${locationText}</p>
              <p>${story.description.substring(0, 100)}${story.description.length > 100 ? '...' : ''}</p>
            </div>
          </div>
        `;
      }).join('');
      
      this.#initMap();
    } catch (error) {
      console.error('Error in showStories:', error);
      this.showError(error);
    }
  }

  async #initMap() {
    try {
    const loadingElement = document.getElementById('map-loading');
    if (loadingElement) loadingElement.style.display = 'block';

    await this.cleanup();

    const mapElement = document.getElementById('stories-map');
    if (!mapElement || mapElement.offsetWidth === 0 || mapElement.offsetHeight === 0) {
      console.warn('Map container belum siap atau memiliki ukuran 0.');
      return;
    }

    const L = await import('leaflet');

    const attribution =
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors ' +
      '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a>';

    const tileStreets = L.tileLayer(`https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=kE4NvcySWZU5cDQjqzgT`, {
      attribution,
      tileSize: 512,
      zoomOffset: -1,
    });

    const tileSatellite = L.tileLayer(`https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=OCxf3aKSk6gkj1aQKlOR`, {
      attribution,
      tileSize: 512,
      zoomOffset: -1,
    });

    this.#map = L.map('stories-map', {
      center: [-6.1754, 106.8272],
      zoom: 5,
      layers: [tileStreets],
      preferCanvas: true,
    });

    // Ensure map container is fully loaded before calling invalidateSize
    setTimeout(() => {
      if (this.#map) this.#map.invalidateSize();
    }, 300);

    const baseLayers = {
      'Streets': tileStreets,
      'Satellite': tileSatellite,
    };

    L.control.layers(baseLayers).addTo(this.#map);

    // Initialize markers
    this.#markers = this.#stories
      .filter(story => story.lat && story.lon)
      .map(story => {
        const marker = L.marker([story.lat, story.lon]).addTo(this.#map);
        marker.bindPopup(`
          <div class="popup-content">
            <img src="${story.photoUrl}" width="150" style="margin: 5px 0;">
            <h4>${story.name || 'Anonim'}</h4>
            <p>${story.description}</p>
            <small>${new Date(story.createdAt).toLocaleDateString()}</small>
          </div>
        `);
        return marker;
      });

    // Ensure map bounds are updated after markers are added
    if (this.#markers.length > 0) {
      const group = new L.featureGroup(this.#markers);
      this.#map.whenReady(() => {
        this.#map.on('zoomend', () => {
          setTimeout(() => {
            if (this.#map) {
              // Only call fitBounds if map is not currently animating
              if (!this.#map._animatingZoom) {
                this.#map.fitBounds(group.getBounds());
              }
            }
          }, 500); // Ensure markers are fully loaded
        });
      });
    }

    } catch (error) {
      console.error('Map initialization error:', error);
    } finally {
      const loadingElement = document.getElementById('map-loading');
      if (loadingElement) loadingElement.style.display = 'none';
    }
  }

  async cleanup() {
    this.#markers.forEach(marker => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    this.#markers = [];

    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }

    const mapContainer = document.getElementById('stories-map');
    if (mapContainer) {
      mapContainer.innerHTML = '';
    }
  }

  showError(error) {
    console.error('Failed to load stories:', error);
    const container = document.querySelector('.content');
    if (container) {
      container.innerHTML = `
        <div class="error-message">
          <p>Gagal memuat cerita. Silakan coba lagi nanti.</p>
          <p>${error.message}</p>
          <button onclick="window.location.reload()">Muat Ulang</button>
        </div>
      `;
    }
  }
}