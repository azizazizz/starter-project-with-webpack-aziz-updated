import Swal from "sweetalert2";

export default class LoginPresenter {
  #view;
  #authModel;

  constructor({ view, authModel }) {
    this.#view = view;
    this.#authModel = authModel;
  }

  async getLogin({ email, password }) {
    this.#view.showSubmitLoadingButton();
    try {
      const { token } = await this.#authModel.login({ email, password });
      this.#authModel.putAccessToken(token);

      await Swal.fire("Berhasil Masuk!", "", "success");
      location.hash = "/";
    } catch (error) {
      Swal.fire(
        "Gagal Masuk",
        error.message || "Email atau password salah",
        "error",
      );
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}
