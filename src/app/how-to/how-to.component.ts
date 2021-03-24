import { Component, ChangeDetectionStrategy } from '@angular/core';
import { OverlayContentType } from '../overlay/overlay.component';
import { OverlayService } from '../overlay/overlay.service';

@Component({
  selector: 'app-how-to',
  templateUrl: './how-to.component.html',
  styleUrls: ['./how-to.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HowToComponent {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly OverlayContentType = OverlayContentType;

  howToLinks = [
    { name: `Filtering`, link: `assets/videos/filtering.mp4` },
    { name: `Exporting`, link: `assets/videos/exporting.mp4` },
    { name: `Converting`, link: `assets/videos/converting.mp4` }
  ];

  constructor(public overlayService: OverlayService) { }
}
