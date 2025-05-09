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
        <button type="submit" class="btn-submit">Register</button>
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
      model: { register, putAccessToken }, // Pastikan nama 'model' match dengan constructor presenter
    });
    this.#setupForm();
  }

  #setupForm() {
    document.getElementById('register-form').addEventListener('submit', async (event) => {
      event.preventDefault();

      const data = {
        name: document.getElementById('name-input').value,
        email: document.getElementById('email-input').value,
        password: document.getElementById('password-input').value,
      };
      await this.#presenter.getRegistered(data);
    });
  }

  registeredSuccessfully(message) {
    console.log(message);

    // Redirect
    location.hash = '/login';
  }

  registeredFailed(message) {
    alert(message);
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit" disabled>
        <i class="fas fa-spinner fa-spin"></i> Daftar Akun
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn" type="submit">Daftar akun</button>
    `;
  }
}