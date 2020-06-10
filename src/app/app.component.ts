import { Component } from '@angular/core';
import { VideoOverlayService } from './video-overlay/video-overlay.service';
import { BrowserFeatureDetectionService } from './browser-feature-detection.service';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  version = {
    major: 1,
    minor: 5,
    patch: 0
  };

  howToLinks = [
    { name: `Filtering`, link: `assets/videos/filtering.mp4` },
    { name: `Exporting`, link: `assets/videos/exporting.mp4` },
    { name: `Converting`, link: `assets/videos/converting.mp4` }
  ];

  supportsRequiredFeatures = this.browserFeatureDetectionService.supportsRequiredFeatures();

  constructor(
    public videoOverlayService: VideoOverlayService,
    private browserFeatureDetectionService: BrowserFeatureDetectionService
  ) {
    const preventDefault = (dragEvent: DragEvent) => {
      dragEvent.preventDefault();
      dragEvent.dataTransfer.dropEffect = `none`;
    };

    [`dragover`, `drop`].forEach(eventName => window.addEventListener(eventName, preventDefault, false));
  }
}
