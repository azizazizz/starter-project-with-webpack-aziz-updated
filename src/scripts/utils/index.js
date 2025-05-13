export function sleep(time = 1000) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

export function showFormattedDate(date, locale = "en-US", options = {}) {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

export async function createCarousel(containerElement, options = {}) {
  const { tns } = await import("tiny-slider");

  return tns({
    container: containerElement,
    mouseDrag: true,
    swipeAngle: false,
    speed: 600,

    nav: true,
    navPosition: "bottom",

    autoplay: false,
    controls: false,

    ...options,
  });
}

export function convertBlobToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function convertBase64ToBlob(
  base64Data,
  defaultContentType = "application/octet-stream",
) {
  if (base64Data.startsWith("data:")) {
    const response = await fetch(base64Data);
    return await response.blob();
  }

  const dataUrl = `data:${defaultContentType};base64,${base64Data}`;
  const response = await fetch(dataUrl);
  return await response.blob();
}

export function convertBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function setupSkipToContent(element, mainContent) {
  if (!element || !mainContent) return;

  element.addEventListener("click", (e) => {
    e.preventDefault();

    if (!mainContent.hasAttribute("tabindex")) {
      mainContent.setAttribute("tabindex", "-1");
    }

    mainContent.focus();
  });
}

export function transitionHelper({ skipTransition = false, updateDOM }) {
  if (skipTransition || !document.startViewTransition) {
    const updateCallbackDone = Promise.resolve(updateDOM()).then(
      () => undefined,
    );

    return {
      ready: Promise.reject(Error("View transitions unsupported")),
      updateCallbackDone,
      finished: updateCallbackDone,
    };
  }

  return document.startViewTransition(updateDOM);
}
