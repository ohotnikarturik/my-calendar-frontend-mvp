import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { About } from './pages/about/about';
import { Calendar } from './pages/calendar/calendar';

export const routes: Routes = [
  { path: '', component: Calendar },
  { path: 'about', component: About },
  { path: 'home', component: Home },
];
