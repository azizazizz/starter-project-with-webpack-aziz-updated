import HomePresenter from './home-presenter';
import Map from '../../utils/map';
import * as StoryAPI from '../../data/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default class HomePage {
  #presenter;
  #stories = [];
  #map = null;

  async render() {
    return `
      <section class="content">
        <h1 class="explore__label">Cerita Terkini</h1>
        
        <div id="stories-list" class="stories-list"></div>
        
        <div class="map-container">
          <h2>Lokasi Cerita</h2>
          <div id="stories-map" class="stories-map"></div>
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
    if (!this.#stories || this.#stories.length === 0) return;
    
    try {
      this.#map = await Map.build('#stories-map', {
        zoom: 5,
        locate: true
      });
      
      // Add markers for each story with popup
      this.#stories.forEach(story => {
        if (story.lat && story.lon) {
          this.#map.addMarker([story.lat, story.lon], {}, {
            content: `
              <div class="popup-content">
                <h4>${story.name || 'Anonim'}</h4>
                <img src="${story.photoUrl}" width="150" style="margin: 5px 0;">
                <p>${story.description}</p>
                <small>${story.createdAt ? new Date(story.createdAt).toLocaleDateString() : ''}</small>
              </div>
            `
          });
        }
      });
      
      // Fit bounds to show all markers
      if (this.#stories.some(story => story.lat && story.lon)) {
        const bounds = this.#stories
          .filter(story => story.lat && story.lon)
          .reduce((acc, story) => {
            return acc.extend([story.lat, story.lon]);
          }, L.latLngBounds(
            [this.#stories[0].lat, this.#stories[0].lon], 
            [this.#stories[0].lat, this.#stories[0].lon]
          ));
        
        this.#map.fitBounds(bounds);
      }
    } catch (error) {
      console.error('Failed to initialize map:', error);
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
        </div>
      `;
    }
  }
}