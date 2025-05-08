export default class Camera {
  #currentStream = null;
  #streaming = false;
  #videoElement;
  #canvasElement;

  constructor({ video, canvas, onError }) {
    this.#videoElement = video;
    this.#canvasElement = canvas;
    this.onError = onError || console.error;
    
    // Set autoplay attributes
    this.#videoElement.setAttribute('autoplay', '');
    this.#videoElement.setAttribute('playsinline', '');
  }

  async launch() {
    try {
      await this.stop();
      
      this.#currentStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      this.#videoElement.srcObject = this.#currentStream;
      
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Camera timeout')), 5000);
        
        this.#videoElement.onloadedmetadata = () => {
          clearTimeout(timer);
          this.#streaming = true;
          resolve();
        };
        
        this.#videoElement.onerror = () => {
          clearTimeout(timer);
          reject(new Error('Video error'));
        };
      });
      
      return true;
    } catch (error) {
      this.onError(`Camera error: ${error.message}`);
      return false;
    }
  }

  async stop() {
    if (this.#currentStream) {
      this.#currentStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      this.#currentStream = null;
    }
    
    if (this.#videoElement) {
      this.#videoElement.srcObject = null;
    }
    
    this.#streaming = false;
    console.log('Camera successfully stopped');
  }

  isReady() {
    return this.#streaming && 
           this.#videoElement && 
           this.#videoElement.readyState >= 2 &&
           this.#videoElement.videoWidth > 0;
  }

  async takePicture() {
    if (!this.isReady()) {
      throw new Error('Camera not ready');
    }
    
    const canvas = this.#canvasElement;
    const video = this.#videoElement;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.9);
    });
  }
}