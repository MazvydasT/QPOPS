import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  version = {
    major: 1,
    minor: 1,
    patch: 0
  };

  constructor() {
    const preventDefault = (dragEvent: DragEvent) => {
      dragEvent.preventDefault();
      dragEvent.dataTransfer.dropEffect = `none`;
    };

    [`dragover`, `drop`].forEach(eventName => window.addEventListener(eventName, preventDefault, false));
  }
}
