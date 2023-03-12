import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OverlayContentType } from '../overlay/overlay.component';
import { OverlayService } from '../overlay/overlay.service';

@Component({
  selector: 'app-how-to',
  templateUrl: './how-to.component.html',
  styleUrls: ['./how-to.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowToComponent {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  readonly OverlayContentType = OverlayContentType;

  howToLinks = [
    {
      name: `Filtering`,
      //link: `assets/videos/filtering.mp4`,
      link: `assets/videos/filtering.webm`,
      //mimeType: `video/mp4`,
      mimeType: `video/webm`,
    },
    {
      name: `Exporting`,
      //link: `assets/videos/exporting.mp4`,
      link: `assets/videos/exporting.webm`,
      //mimeType: `video/mp4`,
      mimeType: `video/webm`,
    },
    {
      name: `Converting`,
      //link: `assets/videos/converting.mp4`,
      link: `assets/videos/converting.webm`,
      //mimeType: `video/mp4`,
      mimeType: `video/webm`,
    },
  ];

  constructor(public overlayService: OverlayService) {}
}
