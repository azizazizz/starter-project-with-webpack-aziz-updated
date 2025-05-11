import HomePresenter from "./home-presenter";
import * as StoryAPI from "../../data/api";
import "leaflet/dist/leaflet.css";
import Swal from "sweetalert2";

export default class HomePage {
  #presenter;
  #stories = [];
  #map = null;
  #markers = [];
  #currentPage = 1;
  #pageSize = 10;

  async render() {
    return `
    <section class="content">
      <h1 class="explore__label">Cerita Terkini</h1>
      <div id="stories-list" class="stories-list"></div>

      <button id="load-more" class="btn btn-load-more"><i class="fas fa-sync-alt" id="load-icon" style="margin-right: 0.5rem;"></i>
      Muat Lebih Banyak Cerita</button>

      <h2 class="explore__label">Lokasi Cerita</h2>
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
      model: StoryAPI,
    });

    try {
      await this.#presenter.showStories(this.#currentPage, this.#pageSize);
    } catch (error) {
      this.showError(error);
    }

    const loadMoreButton = document.getElementById("load-more");
    const loadIcon = document.getElementById("load-icon");

    if (loadMoreButton) {
      loadMoreButton.addEventListener("click", async () => {
        loadIcon.classList.add("fa-spin");
        loadMoreButton.disabled = true;
        loadMoreButton.textContent = "Memuat...";
        loadMoreButton.prepend(loadIcon);

        try {
          this.#currentPage++;
          await this.#presenter.showStories(this.#currentPage, this.#pageSize);
        } catch (error) {
          this.showError(error);
        } finally {
          loadIcon.classList.remove("fa-spin");
          loadMoreButton.disabled = false;
          loadMoreButton.innerHTML =
            '<i class="fas fa-sync-alt" id="load-icon" style="margin-right: 0.5rem;"></i> Muat Lebih Banyak Cerita';
        }
      });
    }
  }

  showStories(stories) {
    try {
      if (!Array.isArray(stories)) {
        throw new Error("Data stories harus berupa array");
      }

      this.#stories = [...this.#stories, ...stories];
      const storiesList = document.getElementById("stories-list");

      if (!storiesList) {
        throw new Error("Element stories-list tidak ditemukan");
      }

      storiesList.innerHTML = this.#stories
        .map((story) => {
          if (!story.photoUrl || !story.description) {
            console.warn("Story data tidak valid:", story);
            return "";
          }

          let locationText = "Lokasi tidak diketahui";
          if (story.lat && story.lon) {
            const lat = parseFloat(story.lat).toFixed(6);
            const lon = parseFloat(story.lon).toFixed(6);
            locationText = `Lokasi: ${lat}, ${lon}`;
          }

          return `
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
        })
        .join("");

      this.#initMap();
    } catch (error) {
      console.error("Error in showStories:", error);
      this.showError(error);
    }
  }

  async #initMap() {
    try {
      const loadingElement = document.getElementById("map-loading");
      if (loadingElement) loadingElement.style.display = "block";

      await this.cleanup();

      const mapElement = document.getElementById("stories-map");
      if (
        !mapElement ||
        mapElement.offsetWidth === 0 ||
        mapElement.offsetHeight === 0
      ) {
        console.warn("Map container belum siap atau memiliki ukuran 0.");
        return;
      }

      const L = await import("leaflet");

      const attribution =
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors ' +
        '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a>';

      const tileStreets = L.tileLayer(
        `https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=kE4NvcySWZU5cDQjqzgT`,
        {
          attribution,
          tileSize: 512,
          zoomOffset: -1,
        },
      );

      const tileSatellite = L.tileLayer(
        `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=OCxf3aKSk6gkj1aQKlOR`,
        {
          attribution,
          tileSize: 512,
          zoomOffset: -1,
        },
      );

      this.#map = L.map("stories-map", {
        center: [-6.1754, 106.8272],
        zoom: 5,
        layers: [tileStreets],
        preferCanvas: true,
      });

      setTimeout(() => {
        if (this.#map) this.#map.invalidateSize();
      }, 300);

      const baseLayers = {
        Streets: tileStreets,
        Satellite: tileSatellite,
      };

      L.control.layers(baseLayers).addTo(this.#map);

      this.#markers = this.#stories
        .filter((story) => story.lat && story.lon)
        .map((story) => {
          const marker = L.marker([story.lat, story.lon]).addTo(this.#map);
          marker.bindPopup(`
          <div class="popup-content">
            <img src="${story.photoUrl}" width="150" style="margin: 5px 0;">
            <h4>${story.name || "Anonim"}</h4>
            <p>${story.description}</p>
            <small>${new Date(story.createdAt).toLocaleDateString()}</small>
          </div>
        `);
          return marker;
        });

      if (this.#markers.length > 0) {
        const group = new L.featureGroup(this.#markers);
        setTimeout(() => {
          if (this.#map && group.getBounds().isValid()) {
            this.#map.fitBounds(group.getBounds(), {
              padding: [50, 50],
              animate: true,
              duration: 1,
            });
          }
        }, 300);
      }
    } catch (error) {
      console.error("Map initialization error:", error);
    } finally {
      const loadingElement = document.getElementById("map-loading");
      if (loadingElement) loadingElement.style.display = "none";
    }
  }

  async cleanup() {
    this.#markers.forEach((marker) => {
      if (marker && marker.remove) {
        marker.remove();
      }
    });
    this.#markers = [];

    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }

    const mapContainer = document.getElementById("stories-map");
    if (mapContainer) {
      mapContainer.innerHTML = "";
    }
  }

  showError(error) {
    console.error("Failed to load stories:", error);

    Swal.fire({
      icon: "error",
      title: "Gagal Memuat Cerita",
      text:
        error.message ||
        "Terjadi kesalahan saat memuat data. Silakan coba lagi nanti.",
      confirmButtonColor: "#d33",
    });
  }
}
