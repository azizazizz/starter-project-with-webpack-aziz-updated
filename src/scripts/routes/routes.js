import LoginPage from "../pages/auth/login/login-page";
import RegisterPage from "../pages/auth/register/register-page";
import HomePage from "../pages/home/home-page";
import NewPage from "../pages/new/new-page";
import {
  checkAuthenticatedRoute,
  checkUnauthenticatedRouteOnly,
} from "../utils/auth";

export const routes = {
  "/": () => checkAuthenticatedRoute(new HomePage()),
  "/login": () => checkUnauthenticatedRouteOnly(new LoginPage()),
  "/register": () => checkUnauthenticatedRouteOnly(new RegisterPage()),
  "/add-story": () => checkAuthenticatedRoute(new NewPage()),
};
