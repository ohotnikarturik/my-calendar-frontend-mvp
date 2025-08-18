import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'content-wrapper',
  standalone: true,
  template: `
    <div class="content-wrapper">
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './content-wrapper.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentWrapper {}
