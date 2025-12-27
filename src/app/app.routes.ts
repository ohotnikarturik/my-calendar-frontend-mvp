import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Calendar } from './pages/calendar/calendar';
import { Upcoming } from './pages/upcoming/upcoming';
// import { Contacts } from './pages/contacts/contacts';
// import { Occasions } from './pages/occasions/occasions';
import { Settings } from './pages/settings/settings';
import { Login } from './pages/auth/login/login';
import { Signup } from './pages/auth/signup/signup';
import { AuthCallback } from './pages/auth/callback/callback';
import { authGuard, guestGuard } from './guards/auth.guard';

/**
 * Application Routes
 *
 * Learning note: Routes define the navigation structure of the app.
 *
 * Current configuration (Online-Mode Only):
 * - All main app routes are protected by authGuard
 *   (requires Supabase authentication)
 * - Auth routes (login/signup) are protected by guestGuard
 *   (redirects authenticated users away)
 * - App requires valid Supabase configuration and user login
 *   to access any features
 *
 * For offline-first behavior, remove authGuard from main routes
 * and change fallback redirect back to ''.
 */
export const routes: Routes = [
  // Main app routes (NOW protected by authGuard - requires login)
  { path: '', component: Calendar, canActivate: [authGuard] },
  { path: 'about', component: About, canActivate: [authGuard] },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'upcoming', component: Upcoming, canActivate: [authGuard] },
  // { path: 'contacts', component: Contacts, canActivate: [authGuard] },
  // { path: 'occasions', component: Occasions, canActivate: [authGuard] },
  { path: 'settings', component: Settings, canActivate: [authGuard] },

  // Auth routes (redirect to home if already logged in)
  { path: 'auth/login', component: Login, canActivate: [guestGuard] },
  { path: 'auth/signup', component: Signup, canActivate: [guestGuard] },
  { path: 'auth/callback', component: AuthCallback },

  // Fallback route (redirect to login instead of calendar)
  { path: '**', redirectTo: 'auth/login' },
];
