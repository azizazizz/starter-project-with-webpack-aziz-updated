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
      console.error('showNewFormMap: error:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async postNewStory(data) {
    this.#view.showSubmitLoadingButton();
    
    try {
      await this.#model.addNewStory(data);
      this.#view.storeSuccessfully('Cerita berhasil dikirim!');
    } catch (error) {
      let message = error.message;
      
      if (error.message.includes('400')) {
        message = 'Data tidak valid. Pastikan:';
        message += '\n- Deskripsi diisi (min 10 karakter)';
        message += '\n- Foto diupload (format JPEG/PNG, max 1MB)';
      }
      
      this.#view.storeFailed(message);
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
  handleLocationError(error) {
    let message = '';
    switch(error.code) {
      case error.PERMISSION_DENIED:
        message = 'Izin lokasi ditolak. Izinkan akses lokasi di browser settings.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Informasi lokasi tidak tersedia.';
        break;
      case error.TIMEOUT:
        message = 'Request lokasi timeout. Coba lagi.';
        break;
      default:
        message = 'Error tidak diketahui: ' + error.message;
    }
    this.#view.showLocationError(message);
  }
}

/* export default class NewPresenter {
  #view;
  #model;

  constructor({ view, model }) {
    this.#view = view;
    this.#model = model;
  }

  async showNewFormMap() {
    try {
      this.#view.showMapLoading();
      await this.#view.initialMap();
    } catch (error) {
      console.error('Error initializing map:', error);
    } finally {
      this.#view.hideMapLoading();
    }
  }

  async postNewStories(data) {
    this.#view.showSubmitLoadingButton();
    try {
      const response = await this.#model.storeNewStory(data);
      
      if (response.error) {
        throw new Error(response.message);
      }
      
      this.#view.storeSuccessfully('Cerita berhasil ditambahkan!');
    } catch (error) {
      this.#view.storeFailed(error.message || 'Gagal menambahkan cerita');
    } finally {
      this.#view.hideSubmitLoadingButton();
    }
  }
}*/