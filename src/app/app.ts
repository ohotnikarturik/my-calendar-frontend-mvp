import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ContentWrapper } from './components/content-wrapper';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ContentWrapper],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
