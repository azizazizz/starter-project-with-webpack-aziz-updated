const FormModel = {
  data: {
    photo: null,
    description: '',
    lat: null,
    lon: null,
  },

  setPhoto(file) {
    this.data.photo = file;
  },

  setDescription(text) {
    this.data.description = text;
  },

  setLocation({ lat, lon }) {
    this.data.lat = lat;
    this.data.lon = lon;
  },

  isValid() {
    return this.data.photo && this.data.description.trim() !== '';
  },

  reset() {
    this.data = {
      photo: null,
      description: '',
      lat: null,
      lon: null,
    };
  },

  getFormData() {
    const formData = new FormData();
    formData.append('photo', this.data.photo);
    formData.append('description', this.data.description);
    if (this.data.lat !== null && this.data.lon !== null) {
      formData.append('lat', this.data.lat);
      formData.append('lon', this.data.lon);
    }
    return formData;
  },
};

export default FormModel;