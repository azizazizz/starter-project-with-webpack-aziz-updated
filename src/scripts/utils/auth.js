import { getActiveRoute } from "../routes/url-parser";
import { ACCESS_TOKEN_KEY } from "../config";

export const login = async ({ email, password }) => {
  const response = await fetch("https://story-api.dicoding.dev/v1/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const responseJson = await response.json();

  if (!response.ok) {
    throw new Error(responseJson.message || "Login gagal");
  }

  return {
    token: responseJson.loginResult.token,
    user: {
      id: responseJson.loginResult.userId,
      name: responseJson.loginResult.name,
    },
  };
};

export const register = async ({ name, email, password }) => {
  const response = await fetch("https://story-api.dicoding.dev/v1/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const responseJson = await response.json();

  if (!response.ok) {
    throw new Error(responseJson.message || "Registrasi gagal");
  }

  return responseJson;
};

export function getAccessToken() {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token === "null" || token === "undefined") return null;
    return token;
  } catch (error) {
    console.error("getAccessToken error:", error);
    return null;
  }
}

export function putAccessToken(token) {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error("putAccessToken error:", error);
    return false;
  }
}

export function removeAccessToken() {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    return true;
  } catch (error) {
    console.error("removeAccessToken error:", error);
    return false;
  }
}

const unauthenticatedRoutesOnly = ["/login", "/register"];

export function checkUnauthenticatedRouteOnly(page) {
  const url = getActiveRoute();
  const isLogin = !!getAccessToken();

  if (unauthenticatedRoutesOnly.includes(url) && isLogin) {
    location.hash = "/";
    return null;
  }

  return page;
}

export function checkAuthenticatedRoute(page) {
  const token = getAccessToken();
  if (!token) {
    location.hash = "/login";
    return null;
  }
  return page;
}

export function getLogout() {
  removeAccessToken();
}
