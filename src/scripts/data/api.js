import { BASE_URL } from "../config";
import { getAccessToken } from "../utils/auth";

const ENDPOINTS = {
  REGISTER: `${BASE_URL}/register`,
  LOGIN: `${BASE_URL}/login`,
  MY_USER_INFO: `${BASE_URL}/users/me`,

  STORY_LIST: `${BASE_URL}/stories`,
  STORY_DETAIL: (id) => `${BASE_URL}/stories/${id}`,
  STORY_GUEST: `${BASE_URL}/stories/guest`,

  SUBSCRIBE: `${BASE_URL}/notifications/subscribe`,
  UNSUBSCRIBE: `${BASE_URL}/notifications/subscribe`,
};

export async function register({ name, email, password }) {
  const response = await fetch(ENDPOINTS.REGISTER, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function login({ email, password }) {
  const response = await fetch(ENDPOINTS.LOGIN, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function getAllStories({
  page = 1,
  size = 10,
  location = 0,
} = {}) {
  const token = getAccessToken();
  try {
    const response = await fetch(
      `${ENDPOINTS.STORY_LIST}?page=${page}&size=${size}&location=${location}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();

    if (!responseData.listStory) {
      throw new Error("Struktur data tidak valid: listStory tidak ditemukan");
    }

    return {
      ok: true,
      listStory: responseData.listStory.map((story) => ({
        id: story.id,
        name: story.name || "Anonim",
        description: story.description || "",
        photoUrl: story.photoUrl || "default-image.jpg",
        createdAt: story.createdAt,
        lat: story.lat,
        lon: story.lon,
      })),
    };
  } catch (error) {
    console.error("Error in getAllStories:", error);
    return {
      ok: false,
      error: error.message,
    };
  }
}

export async function getStoryById(id) {
  const token = getAccessToken();
  const response = await fetch(ENDPOINTS.STORY_DETAIL(id), {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function addNewStory({ description, photo, lat, lon }) {
  const token = getAccessToken();

  const formData = new FormData();
  formData.append("description", description);
  formData.append("photo", photo);
  formData.append("lat", lat.toString());
  formData.append("lon", lon.toString());

  try {
    const response = await fetch(`${ENDPOINTS.STORY_LIST}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
}

export async function addNewGuestStory({ description, photo, lat, lon }) {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("photo", photo);
  if (lat) formData.append("lat", lat);
  if (lon) formData.append("lon", lon);

  const response = await fetch(ENDPOINTS.STORY_GUEST, {
    method: "POST",
    body: formData,
  });
  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function subscribePushNotification({
  endpoint,
  keys: { p256dh, auth },
}) {
  const token = getAccessToken();
  const response = await fetch(ENDPOINTS.SUBSCRIBE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint, keys: { p256dh, auth } }),
  });
  const json = await response.json();
  return { ...json, ok: response.ok };
}

export async function unsubscribePushNotification({ endpoint }) {
  const token = getAccessToken();
  const response = await fetch(ENDPOINTS.UNSUBSCRIBE, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  });
  const json = await response.json();
  return { ...json, ok: response.ok };
}
