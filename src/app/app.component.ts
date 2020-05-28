import { Component, ChangeDetectionStrategy } from '@angular/core';
import { TransformerService } from './transformer.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {

  constructor(private transformService: TransformerService) { }

  go(input: HTMLInputElement) {
    const file = input.files[0];

    if (file === undefined) return;

    this.transformService.transform(file).then(data => {
      debugger;
    });
  }
}
