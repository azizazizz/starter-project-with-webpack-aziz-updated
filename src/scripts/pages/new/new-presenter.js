import Swal from "sweetalert2";

export default class NewPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showNewFormMap() {
    this.#view.showMapLoading();
    try {
      await this.#view.initialMap();
    } catch (error) {
      console.error("showNewFormMap: error:", error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async postNewStory(data) {
    this.#view.showSubmitLoadingButton();

    try {
      await this.#model.addNewStory(data);
      await Swal.fire("Cerita Terkirim", "Cerita berhasil dikirim!", "success");
      location.hash = "/";
    } catch (error) {
      let message = error.message;

      if (error.message.includes("400")) {
        message =
          "Data tidak valid. Pastikan:\n- Deskripsi diisi (min 10 karakter)\n- Foto diupload (JPEG/PNG, max 1MB)";
      }

      Swal.fire("Gagal Mengirim Cerita", message, "error");
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }

  handleLocationError(error) {
    let message = "";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message =
          "Izin lokasi ditolak. Izinkan akses lokasi di browser settings.";
        break;
      case error.POSITION_UNAVAILABLE:
        message = "Informasi lokasi tidak tersedia.";
        break;
      case error.TIMEOUT:
        message = "Request lokasi timeout. Coba lagi.";
        break;
      default:
        message = "Error tidak diketahui: " + error.message;
    }

    Swal.fire("Kesalahan Lokasi", message, "warning");
  }
}
