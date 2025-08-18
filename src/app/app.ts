import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { ContentWrapper } from './components/content-wrapper';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, ContentWrapper],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
