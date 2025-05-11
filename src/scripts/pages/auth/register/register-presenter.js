import Swal from "sweetalert2";

export default class RegisterPresenter {
  #view;
  #authModel;

  constructor({ view, model }) {
    this.#view = view;
    this.#authModel = model;
  }

  async getRegistered({ name, email, password }) {
    this.#view.showSubmitLoadingButton();
    try {
      const response = await this.#authModel.register({
        name,
        email,
        password,
      });

      if (response.error) {
        throw new Error(response.message || "Pendaftaran gagal");
      }

      await Swal.fire(
        "Pendaftaran Berhasil",
        "Silakan masuk dengan akun Anda.",
        "success",
      );
      location.hash = "/login";
    } catch (error) {
      Swal.fire(
        "Gagal Daftar",
        error.message || "Terjadi kesalahan saat mendaftar",
        "error",
      );
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}
