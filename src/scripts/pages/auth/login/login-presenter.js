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
      this.#authModel.putAccessToken(token); // Simpan token
      this.#view.loginSuccessfully("Berhasil Masuk!");
    } catch (error) {
      this.#view.loginFailed(error.message || "Email atau password salah");
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}