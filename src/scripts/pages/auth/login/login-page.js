import LoginPresenter from './login-presenter';
import { login, putAccessToken } from '../../../utils/auth';

export default class LoginPage {
  #presenter = null;

  async render() {
    return `
        <section class="auth">
        <h2>Selamat Datang Kembali Di DStory, Silahkan Login.</h2>
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" placeholder="Email" required />
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Password" required />
          </div>
          <div id="submit-button-container">
            <button type="submit" class="btn-submit">Login</button>
          </div>
        </form>
        <div class="auth-links">
          Belum punya akun? <a href="#/register">Daftar disini</a>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new LoginPresenter({
      view: this,
      authModel: { login, putAccessToken },
    });

    this.#setupForm();
  }

  #setupForm() {
    document.getElementById('login-form').addEventListener('submit', async (event) => {
      event.preventDefault();

      const data = {
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
      };
      await this.#presenter.getLogin(data);
    });
  }

  loginSuccessfully(message) {
    console.log(message);
    // Redirect
    location.hash = '/';
  }

  loginFailed(message) {
    alert(message);
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn-submit" type="submit" disabled>
        <i class="fas fa-spinner fa-spin"></i> Login
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn-submit" type="submit">Login</button>
    `;
  }
}