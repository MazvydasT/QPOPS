import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { BrowserFeatureDetectionService } from './browser-feature-detection.service';
import { ConnectionService } from './connection.service';
import { VersionService } from './version.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  version = this.versionService.getVersion();

  connectionStatus$ = this.connectionService.getConnectionStatus();

  supportsRequiredFeatures = this.browserFeatureDetectionService.supportsRequiredFeatures();

  constructor(
    private browserFeatureDetectionService: BrowserFeatureDetectionService,
    public connectionService: ConnectionService,
    public swUpdate: SwUpdate,
    public versionService: VersionService
  ) {

    //this.redirectService.redirectToLoginIfNeeded();

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
