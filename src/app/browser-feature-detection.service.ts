import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BrowserFeatureDetectionService {

  constructor() { }

  supportsRequiredFeatures() {
    return Blob.prototype.arrayBuffer && Object.entries && Worker;
  }
}
