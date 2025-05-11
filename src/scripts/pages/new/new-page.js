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
              Silahkan lengkapi isi deskripsi cerita anda.<br>
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
  }

  async cleanup() {
    if (this.#camera) {
      this.#camera.stop();
    }

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
    this.#presenter = new NewPresenter({
      view: this,
      model: StoryAPI,
    });
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
    if (!mapElement) {
      console.warn("Map container not found, skip initialization");
      return;
    }

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
        {
          draggable: true,
          autoPan: true,
          zoomOnClick: false,
        },
      );

      this.#marker.addEventListener("move", (event) => {
        const coordinate = event.target.getLatLng();
        this.#updateLatLngInput(coordinate.lat, coordinate.lng);
      });

      this.#map.addMapEventListener("click", (event) => {
        this.#marker.setLatLng(event.latlng);
        this.#updateLatLngInput(event.latlng.lat, event.latlng.lng);
      });
    } catch (error) {
      console.error("Map initialization error:", error);
    } finally {
      this.hideMapLoading();
    }
  }

  #updateLatLngInput(latitude, longitude) {
    const latInput = this.#form?.elements?.namedItem("latitude");
    const lngInput = this.#form?.elements?.namedItem("longitude");
    if (latInput && lngInput) {
      latInput.value = latitude;
      lngInput.value = longitude;
    }
  }

  async #setupForm() {
    this.#form = document.getElementById("new-form");

    this.#form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const data = {
        description: this.#form.elements.namedItem("description").value,
        photo: this.#takenDocumentations[0]?.blob,
        lat: parseFloat(this.#form.elements.namedItem("latitude").value),
        lon: parseFloat(this.#form.elements.namedItem("longitude").value),
      };

      if (!data.description) {
        Swal.fire({
          icon: "warning",
          title: "Perhatian",
          text: "Deskripsi wajib diisi!",
          confirmButtonText: "Oke",
        });
        return;
      }
      if (!data.photo) {
        Swal.fire({
          icon: "warning",
          title: "Perhatian",
          text: "Foto wajib diupload!",
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
            try {
              await this.#addTakenPicture(file);
            } catch (error) {
              console.error("Error processing file:", file.name, error);
            }
          }
        }

        await this.#populateTakenPictures();
        event.target.value = "";
      });
  }

  async #addTakenPicture(image) {
    try {
      let blob = image;

      if (!(image instanceof Blob)) {
        if (typeof image === "string") {
          blob = await convertBase64ToBlob(image, "image/png");
        } else {
          throw new Error("Invalid image type");
        }
      }

      if (!(blob instanceof Blob)) {
        throw new Error("Invalid blob created");
      }

      const newDocumentation = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        blob: blob,
      };

      this.#takenDocumentations = [
        ...this.#takenDocumentations,
        newDocumentation,
      ];
      return true;
    } catch (error) {
      console.error("Error adding taken picture:", error);
      return false;
    }
  }

  async #populateTakenPictures() {
    const html = await Promise.all(
      this.#takenDocumentations.map(async (picture, currentIndex) => {
        if (!(picture.blob instanceof Blob)) {
          console.error("Invalid blob:", picture.blob);
          return "";
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
          console.error("Error creating object URL:", error);
          return "";
        }
      }),
    );

    document.getElementById("documentations-taken-list").innerHTML =
      html.join("");

    document
      .querySelectorAll("button[data-deletepictureid]")
      .forEach((button) =>
        button.addEventListener("click", (event) => {
          const pictureId = event.currentTarget.dataset.deletepictureid;

          const deleted = this.#removePicture(pictureId);
          if (!deleted) {
            console.log(`Picture with id ${pictureId} was not found`);
          }

          this.#populateTakenPictures();
        }),
      );
  }

  #removePicture(id) {
    const selectedPicture = this.#takenDocumentations.find((picture) => {
      return picture.id == id;
    });

    if (!selectedPicture) {
      return null;
    }

    this.#takenDocumentations = this.#takenDocumentations.filter((picture) => {
      return picture.id != selectedPicture.id;
    });

    return selectedPicture;
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
