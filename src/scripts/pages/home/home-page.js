import HomePresenter from './home-presenter';
import * as StoryAPI from '../../data/api';
import 'leaflet/dist/leaflet.css';

export default class HomePage {
  #presenter;
  #stories = [];
  #map = null;
  #markers = [];

  async render() {
    return `
      <section class="content">
        <h1 class="explore__label">Cerita Terkini</h1>
        
        <div id="stories-list" class="stories-list"></div>
        
        <div class="map-container">
          <h2>Lokasi Cerita</h2>
          <div id="stories-map" class="stories-map"></div>
          <div id="map-loading" class="map-loading" style="display: none;">
            <div class="loader"></div>
          </div>
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
      await this.#presenter.showStories();
    } catch (error) {
      this.showError(error);
    }
  }

  showStories(stories) {
    try {
      if (!Array.isArray(stories)) {
        throw new Error('Data stories harus berupa array');
      }

      this.#stories = stories;
      const storiesList = document.getElementById('stories-list');
      
      if (!storiesList) {
        throw new Error('Element stories-list tidak ditemukan');
      }

      storiesList.innerHTML = this.#stories.map(story => {
        if (!story.photoUrl || !story.description) {
          console.warn('Story data tidak valid:', story);
          return '';
        }
        
        return `
          <div class="story-card">
            <img src="${story.photoUrl}" alt="${story.description}" loading="lazy">
            <div class="story-content">
              <h3>${story.name || 'Anonim'}</h3>
              <p class="story-date">${story.createdAt ? new Date(story.createdAt).toLocaleDateString() : 'Tanggal tidak tersedia'}</p>
              <p class="story-location">Lokasi: ${story.lat ? `${story.lat}, ${story.lon}` : 'Tidak diketahui'}</p>
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
      // Show loading indicator
      const loadingElement = document.getElementById('map-loading');
      if (loadingElement) loadingElement.style.display = 'block';

      // Cleanup previous map if exists
      await this.cleanup();

      // Dynamically import Leaflet
      const L = await import('leaflet');
      
      // Initialize map
      this.#map = L.map('stories-map', {
        preferCanvas: true,
      }).setView([-6.1754, 106.8272], 5);
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(this.#map);

      // Add markers for each story
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

      // Fit bounds to show all markers if available
      if (this.#markers.length > 0) {
        const group = new L.featureGroup(this.#markers);
        this.#map.fitBounds(group.getBounds());
      }

    } catch (error) {
      console.error('Map initialization error:', error);
    } finally {
      const loadingElement = document.getElementById('map-loading');
      if (loadingElement) loadingElement.style.display = 'none';
    }
  }

  async cleanup() {
    // Clear all markers
    this.#markers.forEach(marker => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    this.#markers = [];

    // Remove map if exists
    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }

    // Cleanup container
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