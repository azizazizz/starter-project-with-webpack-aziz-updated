import NewPresenter from "./new-presenter";
import * as StoryAPI from "../../data/api";
import { convertBase64ToBlob } from "../../utils";
import { generateLoaderAbsoluteTemplate } from "../../templates/templates";
import Camera from "../../utils/camera";
import Map from "../../utils/map";
import "leaflet/dist/leaflet.css";
import Swal from "sweetalert2";

export default class NewPage {
  #presenter;
  #form;
  #camera;
  #takenDocumentations = [];
  #map = null;
  #marker = null;

  async render() {
    return `
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
                  <button id="documentations-input-button" class="btn btn-outline" type="button">Unggah File</button>
                  <input
                    id="documentations-input"
                    name="documentations"
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                  >
                  <button id="open-documentations-camera-button" class="btn btn-outline" type="button">Buka Kamera</button>
                </div>
                <div id="camera-container" class="new-form__camera__container">
                  <select id="camera-select" class="camera-select"></select>
                  <video id="camera-video" class="new-form__camera__video">Video stream not available.</video>
                  <canvas id="camera-canvas" class="new-form__camera__canvas"></canvas>
                  <div class="new-form__camera__tools">
                    <button id="camera-take-button" class="btn" type="button">Ambil Gambar</button>
                    <div id="file-uploaded">Jika ingin menghapus file terlampir, klik saja pada filenya.</div>
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
  }

  async cleanup() {
    if (this.#camera) this.#camera.stop();
    this.#takenDocumentations.forEach((pic) => {
      if (pic.url) URL.revokeObjectURL(pic.url);
    });
    this.#takenDocumentations = [];
    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }
    this.#marker = null;
  }

  async afterRender() {
    this.#presenter = new NewPresenter({ view: this, model: StoryAPI });
    this.#takenDocumentations = [];
    this.#setupCamera();
    this.#setupForm();
    await this.#initMap();
  }

  async #setupCamera() {
    const cameraContainer = document.getElementById("camera-container");
    const cameraButton = document.getElementById(
      "open-documentations-camera-button",
    );

    this.#camera = new Camera({
      video: document.getElementById("camera-video"),
      cameraSelect: document.getElementById("camera-select"),
      canvas: document.getElementById("camera-canvas"),
    });

    cameraButton.addEventListener("click", async () => {
      const isOpening = !cameraContainer.classList.contains("open");

      if (isOpening) {
        try {
          cameraButton.textContent = "Tutup Kamera";
          cameraContainer.classList.add("open");

          await this.#camera.launch();
          document.getElementById("camera-canvas").style.display = "none";
          document.getElementById("camera-take-button").onclick = async () => {
            const image = await this.#camera.takePicture();
            if (image) {
              await this.#addTakenPicture(image);
              await this.#populateTakenPictures();
            }
          };
        } catch (error) {
          console.error("Failed to open camera:", error);
          cameraContainer.classList.remove("open");
          cameraButton.textContent = "Buka Kamera";
        }
      } else {
        cameraButton.textContent = "Buka Kamera";
        cameraContainer.classList.remove("open");
        this.#camera.stop();
      }
    });
  }

  async #initMap() {
    const mapElement = document.getElementById("map");
    if (!mapElement) return;

    try {
      this.showMapLoading();

      this.#map = await Map.build("#map", {
        zoom: 15,
        scrollWheelZoom: true,
        zoomOnClick: false,
      });

      const centerCoordinate = this.#map.getCenter();
      this.#updateLatLngInput(
        centerCoordinate.latitude,
        centerCoordinate.longitude,
      );

      this.#marker = this.#map.addMarker(
        [centerCoordinate.latitude, centerCoordinate.longitude],
        { draggable: true, autoPan: true, zoomOnClick: false },
      );

      this.#marker.addEventListener("move", (e) => {
        const { lat, lng } = e.target.getLatLng();
        this.#updateLatLngInput(lat, lng);
      });

      this.#map.addMapEventListener("click", (e) => {
        this.#marker.setLatLng(e.latlng);
        this.#updateLatLngInput(e.latlng.lat, e.latlng.lng);
      });
    } catch (error) {
      console.error("Map initialization error:", error);
    } finally {
      this.hideMapLoading();
    }
  }

  #updateLatLngInput(lat, lng) {
    const latInput = this.#form?.elements?.namedItem("latitude");
    const lngInput = this.#form?.elements?.namedItem("longitude");
    if (latInput && lngInput) {
      latInput.value = lat;
      lngInput.value = lng;
    }
  }

  async #setupForm() {
    this.#form = document.getElementById("new-form");

    this.#form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {
        description: this.#form.elements.namedItem("description").value,
        photo: this.#takenDocumentations[0]?.blob,
        lat: parseFloat(this.#form.elements.namedItem("latitude").value),
        lon: parseFloat(this.#form.elements.namedItem("longitude").value),
      };

      if (!data.description || !data.photo) {
        Swal.fire({
          icon: "warning",
          title: "Perhatian",
          text: !data.description
            ? "Deskripsi wajib diisi!"
            : "Foto wajib diupload!",
          confirmButtonText: "Oke",
        });
        return;
      }

      await this.#presenter.postNewStory(data);
    });

    document
      .getElementById("documentations-input-button")
      .addEventListener("click", () => {
        document.getElementById("documentations-input").click();
      });

    document
      .getElementById("documentations-input")
      .addEventListener("change", async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        this.#takenDocumentations = [];

        for (const file of files) {
          if (file.type.startsWith("image/")) {
            await this.#addTakenPicture(file);
          }
        }

        await this.#populateTakenPictures();
        event.target.value = "";
      });
  }

  async #addTakenPicture(image) {
    try {
      let blob = image;

      if (image.size > 1 * 1024 * 1024) {
        blob = await this.compressImage(image);
      } else {
        if (!(image instanceof Blob)) {
          if (typeof image === "string") {
            blob = await convertBase64ToBlob(image, "image/png");
          } else {
            throw new Error("Invalid image type");
          }
        }
      }

      if (!(blob instanceof Blob)) {
        throw new Error("Invalid blob created");
      }

      const documentation = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        blob,
      };

      this.#takenDocumentations = [documentation];
      return true;
    } catch (err) {
      console.error("Error adding taken picture:", err);
      return false;
    }
  }

  async compressImage(file, quality = 0.7) {
    return new Promise((resolve) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
      };

      reader.readAsDataURL(file);
    });
  }

  async #populateTakenPictures() {
    const html = await Promise.all(
      this.#takenDocumentations.map(async (pic, index) => {
        const url = URL.createObjectURL(pic.blob);
        pic.url = url;
        return `
          <li class="new-form__documentations__outputs-item">
            <button type="button" data-deletepictureid="${pic.id}" class="new-form__documentations__outputs-item__delete-btn">
              <img src="${url}" alt="Dokumentasi ke-${index + 1}">
            </button>
          </li>
        `;
      }),
    );

    document.getElementById("documentations-taken-list").innerHTML =
      html.join("");

    document.querySelectorAll("button[data-deletepictureid]").forEach((btn) =>
      btn.addEventListener("click", (e) => {
        const picId = e.currentTarget.dataset.deletepictureid;
        this.#removePicture(picId);
        this.#populateTakenPictures();
      }),
    );
  }

  #removePicture(id) {
    const index = this.#takenDocumentations.findIndex((p) => p.id === id);
    if (index !== -1) {
      const [removed] = this.#takenDocumentations.splice(index, 1);
      if (removed.url) URL.revokeObjectURL(removed.url);
      return true;
    }
    return false;
  }

  storeSuccessfully(message) {
    Swal.fire({
      icon: "success",
      title: "Berhasil!",
      text: message,
      confirmButtonText: "Oke",
    }).then(() => {
      this.clearForm();
      location.hash = "/";
    });
  }

  storeFailed(message) {
    Swal.fire({
      icon: "error",
      title: "Gagal!",
      text: message,
      confirmButtonText: "Coba Lagi",
    });
  }

  clearForm() {
    this.#form.reset();
    this.#takenDocumentations = [];
    document.getElementById("documentations-taken-list").innerHTML = "";
  }

  showMapLoading() {
    document.getElementById("map-loading-container").innerHTML =
      generateLoaderAbsoluteTemplate();
  }

  hideMapLoading() {
    document.getElementById("map-loading-container").innerHTML = "";
  }

  showSubmitLoadingButton() {
    document.getElementById("submit-button-container").innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner fa-spin"></i> Bagikan Cerita Anda!
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById("submit-button-container").innerHTML = `
      <button class="btn" type="submit">Bagikan Cerita Anda!</button>
    `;
  }
}
