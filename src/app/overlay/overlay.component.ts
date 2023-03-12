/* eslint-disable @typescript-eslint/naming-convention */

import { OverlayRef } from '@angular/cdk/overlay';
import { Component, HostListener, Inject } from '@angular/core';

import { SafeResourceUrl } from '@angular/platform-browser';
import { OVERLAY_DATA } from './overlay.tokens';

export enum OverlayContentType {
  Video,
  IFrameLink
}

export interface IOverlayContent {
  overlayContentType: OverlayContentType;
  link: string | SafeResourceUrl;
  mimeType: string;
}

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss']
})
export class OverlayComponent {
  readonly OverlayContentType = OverlayContentType;

  loading = true;

  constructor(
    public overlayRef: OverlayRef,
    @Inject(OVERLAY_DATA) public overlayContent: IOverlayContent
  ) { }

  @HostListener(`document:keydown`, [`$event`])
  private handleKeydown(event: KeyboardEvent) {
    if (event.code === `Escape`) { this.overlayRef.dispose(); }
  }
}
