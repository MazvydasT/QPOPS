import { Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { BrowserFeatureDetectionService } from './browser-feature-detection.service';
import { RedirectService } from './redirect.service';
import { VideoOverlayService } from './video-overlay/video-overlay.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  version = {
    major: 1,
    minor: 12,
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
    private browserFeatureDetectionService: BrowserFeatureDetectionService,
    private redirectService: RedirectService,
    public swUpdate: SwUpdate
  ) {

    this.redirectService.redirectToLoginIfNeeded();

    const preventDefault = (dragEvent: DragEvent) => {
      dragEvent.preventDefault();
      dragEvent.dataTransfer.dropEffect = `none`;
    };

    [`dragover`, `drop`].forEach(eventName => window.addEventListener(eventName, preventDefault, false));
  }

  activateUpdate() {
    this.swUpdate.activateUpdate().then(() => document.location.reload());
  }
}
