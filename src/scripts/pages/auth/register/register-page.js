import RegisterPresenter from './register-presenter';
import { register, putAccessToken } from '../../../utils/auth';

export default class RegisterPage {
  #presenter = null;

  async render() {
    return `
      <section class="auth">
        <h2>Register</h2>
        <form id="register-form">
          <div class="form-group">
            <label for="name">Nama</label>
            <input type="text" id="name" name="name" placeholder="Nama" required />
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" placeholder="Email" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Password" required />
          </div>
          <div id="submit-button-container">
            <button type="submit" class="btn-submit">Register</button>
          </div>
        </form>
        <div class="auth-links">
          Sudah punya akun? <a href="#/login">Login disini</a>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new RegisterPresenter({
      view: this,
      model: { register, putAccessToken },
    });
    this.#setupForm();
  }

  #setupForm() {
    document.getElementById('register-form').addEventListener('submit', async (event) => {
      event.preventDefault();

      const data = {
        name: document.getElementById('name').value, // Diubah dari 'name-input' ke 'name'
        email: document.getElementById('email').value, // Diubah dari 'email-input' ke 'email'
        password: document.getElementById('password').value // Diubah dari 'password-input' ke 'password'
      };
      await this.#presenter.getRegistered(data);
    });
  }

  registeredSuccessfully(message) {
    console.log(message);
    location.hash = '/login';
  }

  registeredFailed(message) {
    alert(message);
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn-submit" type="submit" disabled>
        <i class="fas fa-spinner fa-spin"></i> Daftar Akun
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn-submit" type="submit">Daftar Akun</button>
    `;
  }
}