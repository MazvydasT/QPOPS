import { TestBed } from '@angular/core/testing';

import { VideoOverlayService } from './video-overlay.service';

describe('VideoOverlayService', () => {
  let service: VideoOverlayService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoOverlayService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
