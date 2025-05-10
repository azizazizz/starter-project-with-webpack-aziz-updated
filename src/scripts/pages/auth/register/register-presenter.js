export default class RegisterPresenter {
  #view;
  #authModel; // Ubah dari #model ke #authModel untuk konsistensi

  constructor({ view, model }) {
    this.#view = view;
    this.#authModel = model; // Simpan sebagai authModel
  }

  async getRegistered({ name, email, password }) {
    this.#view.showSubmitLoadingButton();
    try {
      const response = await this.#authModel.register({ name, email, password }); // Ganti getRegistered → register

      if (response.error) {
        throw new Error(response.message || 'Pendaftaran gagal');
      }

      this.#view.registeredSuccessfully('Pendaftaran berhasil! Silakan Masuk.');
    } catch (error) {
      this.#view.registeredFailed(error.message || 'Terjadi kesalahan saat pendaftaran akun');
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}