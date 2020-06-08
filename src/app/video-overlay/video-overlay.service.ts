import { Injectable, Injector } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { VideoOverlayComponent } from './video-overlay.component';
import { take } from 'rxjs/operators';
import { VIDEO_OVERLAY_DATA } from './video-overlay.tokens';

@Injectable({
  providedIn: 'root'
})
export class VideoOverlayService {
  constructor(private overlay: Overlay, private injector: Injector) { }

  private createInjector(videoSource: string, overlayRef: OverlayRef) {
    const injectorTokens = new WeakMap();
    injectorTokens.set(OverlayRef, overlayRef);
    injectorTokens.set(VIDEO_OVERLAY_DATA, videoSource);
    return new PortalInjector(this.injector, injectorTokens);
  }

  open(videoSource: string) {
    const overlayRef = this.overlay.create({
      disposeOnNavigation: true,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      hasBackdrop: true,
      backdropClass: [`dark-backdrop`, `mat-app-background`]
    });

    const portal = new ComponentPortal(VideoOverlayComponent, null, this.createInjector(videoSource, overlayRef));

    overlayRef.attach(portal);

    overlayRef.backdropClick().pipe(take(1)).toPromise().then(_ => overlayRef.dispose());

    return overlayRef;
  }
}
