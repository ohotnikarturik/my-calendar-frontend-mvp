import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'page-header',
  imports: [CommonModule],
  templateUrl: './page-header.html',
  styleUrl: './page-header.scss',
})
export class PageHeader {
  // Required title
  readonly title = input.required<string>();

  // Optional divider (default: true)
  readonly showDivider = input<boolean>(true);
}
