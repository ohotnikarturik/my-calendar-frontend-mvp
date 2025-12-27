import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'empty-state',
  imports: [MatIconModule],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  // Icon name from Material Icons
  readonly icon = input.required<string>();

  // Main title
  readonly title = input.required<string>();

  // Description text
  readonly description = input.required<string>();
}
