import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { VideoOverlayComponent } from './video-overlay.component';

describe('VideoOverlayComponent', () => {
  let component: VideoOverlayComponent;
  let fixture: ComponentFixture<VideoOverlayComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ VideoOverlayComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VideoOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
