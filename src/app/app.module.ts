import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TransformerComponent } from './transformer/transformer.component';

import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { OverlayModule } from '@angular/cdk/overlay';

import { VideoOverlayComponent } from './video-overlay/video-overlay.component';

@NgModule({
  declarations: [
    AppComponent,
    TransformerComponent,
    VideoOverlayComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    BrowserAnimationsModule,

    MatCardModule,
    MatProgressBarModule,
    MatButtonModule,
    MatProgressSpinnerModule,

    OverlayModule
  ],
  providers: [],
  bootstrap: [AppComponent],
  entryComponents: [VideoOverlayComponent]
})
export class AppModule { }
