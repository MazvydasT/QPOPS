import { Component, Inject, HostListener } from '@angular/core';
import { OverlayRef } from '@angular/cdk/overlay';

import { VIDEO_OVERLAY_DATA } from './video-overlay.tokens';

@Component({
  selector: 'app-video-overlay',
  templateUrl: './video-overlay.component.html',
  styleUrls: ['./video-overlay.component.scss']
})
export class VideoOverlayComponent {
  loading = true;

  constructor(
    private overlayRef: OverlayRef,
    @Inject(VIDEO_OVERLAY_DATA) public videoSource: string
  ) { }

  @HostListener(`document:keydown`, [`$event`])
  private handleKeydown(event: KeyboardEvent) {
    if (event.code === `Escape`) { this.overlayRef.dispose(); }
  }
}
