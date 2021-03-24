import { Injectable, Injector } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { IOverlayContent, OverlayComponent } from './overlay.component';
import { take } from 'rxjs/operators';
import { OVERLAY_DATA as OVERLAY_DATA } from './overlay.tokens';

@Injectable({
  providedIn: 'root'
})
export class OverlayService {
  constructor(private overlay: Overlay, private injector: Injector) { }

  open(content: IOverlayContent) {
    const overlayRef = this.overlay.create({
      disposeOnNavigation: true,
      scrollStrategy: this.overlay.scrollStrategies.block(),
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically(),
      hasBackdrop: true,
      backdropClass: [`dark-backdrop`, `mat-app-background`]
    });

    const portal = new ComponentPortal(OverlayComponent, null, this.createInjector(content, overlayRef));

    overlayRef.attach(portal);

    overlayRef.backdropClick().pipe(take(1)).toPromise().then(_ => overlayRef.dispose());

    return overlayRef;
  }

  private createInjector(content: IOverlayContent, overlayRef: OverlayRef) {
    const injectorTokens = new WeakMap();
    injectorTokens.set(OverlayRef, overlayRef);
    injectorTokens.set(OVERLAY_DATA, content);

    return new PortalInjector(this.injector, injectorTokens);
  }
}
