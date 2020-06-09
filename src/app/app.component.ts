import { Component } from '@angular/core';
import { VideoOverlayService } from './video-overlay/video-overlay.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  version = {
    major: 1,
    minor: 3,
    patch: 1
  };

  howToLinks = [
    { name: `Filtering`, link: `assets/videos/filtering.mp4` },
    { name: `Exporting`, link: `assets/videos/exporting.mp4` },
    { name: `Converting`, link: `assets/videos/converting.mp4` }
  ];

  constructor(public videoOverlayService: VideoOverlayService) {
    const preventDefault = (dragEvent: DragEvent) => {
      dragEvent.preventDefault();
      dragEvent.dataTransfer.dropEffect = `none`;
    };

    [`dragover`, `drop`].forEach(eventName => window.addEventListener(eventName, preventDefault, false));
  }
}
