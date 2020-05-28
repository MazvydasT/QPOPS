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

    this.transformService.transform(file).then((data: ArrayBuffer) => {
      const outputBlob = new Blob([data], { type: `txt/xml` });
      const outputBlobURL = URL.createObjectURL(outputBlob);

      const linkELement = document.createElement(`a`);
      linkELement.href = outputBlobURL;
      linkELement.download = `test-${new Date().toISOString()}.plmxml`;
      linkELement.click();

      linkELement.remove();
      URL.revokeObjectURL(outputBlobURL);
    });
  }
}
