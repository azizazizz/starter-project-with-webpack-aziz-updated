import Swal from "sweetalert2";

export default class HomePresenter {
  constructor({ view, model }) {
    this._view = view;
    this._model = model;
  }

  async showStories(page, size) {
    try {
      const response = await this._model.getAllStories({ page, size });

      if (!response || !response.ok || !response.listStory) {
        throw new Error("Data stories tidak valid dari API");
      }

      const stories = Array.isArray(response.listStory)
        ? response.listStory.map((story) => ({
            id: story.id,
            name: story.name,
            description: story.description,
            photoUrl: story.photoUrl,
            createdAt: story.createdAt,
            lat: story.lat,
            lon: story.lon,
          }))
        : [];

      this._view.showStories(stories);
    } catch (error) {
      console.error("Error in showStories:", error);
      Swal.fire(
        "Gagal Memuat Cerita",
        error.message || "Terjadi kesalahan saat mengambil data",
        "error",
      );
    }
  }
}
