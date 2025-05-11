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
      console.log("Token dari login API:", token);
      this.#authModel.putAccessToken(token);

      await Swal.fire("Berhasil Masuk!", "", "success");

      // Redirect dan refresh agar `getAccessToken()` terbaca saat render HomePage
      location.hash = "/";
      window.location.reload(); // <-- tambahkan ini
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
