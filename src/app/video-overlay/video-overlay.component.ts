import { Component, Inject, HostListener } from '@angular/core';
import { OverlayRef } from '@angular/cdk/overlay';

import { VIDEO_OVERLAY_DATA } from './video-overlay.tokens';

@Component({
  selector: 'app-video-overlay',
  templateUrl: './video-overlay.component.html',
  styleUrls: ['./video-overlay.component.scss']
})
export class VideoOverlayComponent {
  @HostListener(`document:keydown`, [`$event`]) private handleKeydown(event: KeyboardEvent) {
    if (event.keyCode === 27/*ESCAPE*/)
      this.overlayRef.dispose();
  }

  loading = true;

  constructor(
    private overlayRef: OverlayRef,
    @Inject(VIDEO_OVERLAY_DATA) public videoSource: string
  ) { }
}
