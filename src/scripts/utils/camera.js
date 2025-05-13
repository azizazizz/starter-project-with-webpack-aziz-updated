export default class Camera {
  #currentStream;
  #streaming = false;
  #width = 640;
  #height = 0;

  #videoElement;
  #selectCameraElement;
  #canvasElement;

  #takePictureButton;
  static addNewStream(stream) {
    if (!Array.isArray(window.currentStreams)) {
      window.currentStreams = [stream];
      return;
    }
    window.currentStreams = [...window.currentStreams, stream];
  }
  static stopAllStreams() {
    if (!Array.isArray(window.currentStreams)) {
      window.currentStreams = [];
      return;
    }
    window.currentStreams.forEach((stream) => {
      if (stream.active) {
        stream.getTracks().forEach((track) => track.stop());
      }
    });
  }

  constructor({ video, cameraSelect, canvas }) {
    this.#videoElement = video;
    this.#selectCameraElement = cameraSelect;
    this.#canvasElement = canvas;

    this.#initialListener();
  }

  #initialListener() {
    this.#videoElement.oncanplay = () => {
      if (this.#streaming) return;

      const originalWidth = this.#videoElement.videoWidth;
      const originalHeight = this.#videoElement.videoHeight;

      const maxWidth = 640;
      if (originalWidth > maxWidth) {
        this.#width = maxWidth;
        this.#height = (originalHeight / originalWidth) * maxWidth;
      } else {
        this.#width = originalWidth;
        this.#height = originalHeight;
      }

      this.#canvasElement.setAttribute("width", this.#width);
      this.#canvasElement.setAttribute("height", this.#height);

      this.#videoElement.setAttribute("width", this.#width);
      this.#videoElement.setAttribute("height", this.#height);

      console.log(" Camera ~ #width:", this.#width);
      console.log(" Camera ~ #height:", this.#height);

      this.#streaming = true;
    };

    this.#selectCameraElement.onchange = async () => {
      this.stop();
      await this.launch();
    };
  }

  async #populateDeviceList(stream) {
    try {
      if (!(stream instanceof MediaStream)) {
        return Promise.reject(Error("MediaStream not found!"));
      }
      const { deviceId } = stream.getVideoTracks()[0].getSettings();
      const enumeratedDevices = await navigator.mediaDevices.enumerateDevices();
      const list = enumeratedDevices.filter((device) => {
        return device.kind === "videoinput";
      });
      const html = list.reduce((accumulator, device, currentIndex) => {
        return accumulator.concat(`
              <option
                value="${device.deviceId}"
                ${deviceId === device.deviceId ? "selected" : ""}
              >
                ${device.label || `Camera ${currentIndex + 1}`}
              </option>
            `);
      }, "");
      this.#selectCameraElement.innerHTML = html;
    } catch (error) {
      console.error("#populateDeviceList: error:", error);
    }
  }

  async #getStream() {
    try {
      const deviceId =
        !this.#streaming && !this.#selectCameraElement.value
          ? undefined
          : { exact: this.#selectCameraElement.value };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          aspectRatio: 4 / 3,
          deviceId,
        },
      });

      await this.#populateDeviceList(stream);

      return stream;
    } catch (error) {
      console.error("#getStream: error:", error);
      return null;
    }
  }

  async launch() {
    this.#currentStream = await this.#getStream();

    Camera.addNewStream(this.#currentStream);

    this.#videoElement.srcObject = this.#currentStream;
    this.#videoElement.play();

    this.#clearCanvas();
  }

  stop() {
    if (this.#videoElement) {
      this.#videoElement.srcObject = null;
      this.#streaming = false;
    }

    if (this.#currentStream instanceof MediaStream) {
      this.#currentStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    this.#clearCanvas();
  }

  #clearCanvas() {
    const context = this.#canvasElement.getContext("2d");
    context.fillStyle = "#AAAAAA";
    context.fillRect(
      0,
      0,
      this.#canvasElement.width,
      this.#canvasElement.height,
    );
  }

  async takePicture() {
    if (!this.#streaming || !this.#videoElement) {
      throw new Error("Camera is not active");
    }

    const videoWidth = this.#videoElement.videoWidth;
    const videoHeight = this.#videoElement.videoHeight;

    const canvas = document.createElement("canvas");
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(this.#videoElement, 0, 0, canvas.width, canvas.height);

    const maxSize = 1024 * 1024;
    let quality = 0.9;

    const tryCompress = () => {
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Failed to capture image"));
            resolve(blob);
          },
          "image/jpeg",
          quality,
        );
      });
    };

    let blob = await tryCompress();

    while (blob.size > maxSize && quality > 0.3) {
      quality -= 0.05;
      blob = await tryCompress();
    }

    if (blob.size > maxSize) {
      throw new Error("Unable to compress image below 1MB");
    }

    return new File([blob], "photo.jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  }

  addCheeseButtonListener(selector, callback) {
    this.#takePictureButton = document.querySelector(selector);
    this.#takePictureButton.onclick = callback;
  }
}
