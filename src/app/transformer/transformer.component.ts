import { Component } from '@angular/core';

import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { TransformerService } from '../transformer.service';
import { ITransformation } from '../transformation';
import { ITransformationConfiguration, OutputType } from "../transformation-configuration";
import { StorageService } from '../storage.service';

interface ITransformationItem {
  transformation: Observable<ITransformation>,
  name: string
}

@Component({
  templateUrl: './transformer.component.html',
  styleUrls: ['./transformer.component.scss']
})
export class TransformerComponent {

  transformationItems: ITransformationItem[] = [];

  acceptDrop: boolean = null;

  ouputTypes = OutputType;

  configuration: ITransformationConfiguration = {
    includeBranchesWithoutCAD: false,
    outputType: OutputType.PLMXML,
    sysRootPath: `\\\\gal71836\\hq\\Manufacturing\\AME\\VME\\sys_root`
  };

  constructor(
    private transformService: TransformerService,
    private storageService: StorageService
  ) {
    Object.assign(this.configuration, storageService.get<ITransformationConfiguration>(`configuration`) ?? {});
  }

  onConfigurationChnage() {
    setTimeout(() => {
      const currentConfiguration = Object.assign({}, this.configuration);

      if (currentConfiguration.sysRootPath.trim().length === 0)
        currentConfiguration.sysRootPath = undefined;

      this.storageService.set(`configuration`, currentConfiguration);
    });
  }

  dragEnterOver(dragEvent: DragEvent, preventDrop = false) {
    this.preventDefault(dragEvent);

    const dataTransfer = dragEvent.dataTransfer;

    if (preventDrop) {
      this.acceptDrop = false;
      dataTransfer.dropEffect = `none`;
      return;
    }

    const items = dataTransfer.items;
    let containsXMLFiles = false;

    for (let i = 0, c = items.length; i < c; ++i) {
      const item = items[i];

      if (item.kind === `file` && item.type === `text/xml`) {
        containsXMLFiles = true;
        break;
      }
    }

    if (containsXMLFiles) {
      this.acceptDrop = true;
      dataTransfer.dropEffect = `copy`;
    }

    else {
      this.acceptDrop = false;
      dataTransfer.dropEffect = `none`;
    }
  }

  dragLeave(dragEvent: DragEvent) {
    this.preventDefault(dragEvent);
    this.acceptDrop = null;
  }

  drop(dragEvent: DragEvent) {
    this.preventDefault(dragEvent);

    this.acceptDrop = null;

    const dataTransfer = dragEvent.dataTransfer;
    const files = Array.from(dataTransfer.files).filter(file => file.type === `text/xml`);

    if (!files.length) return;

    this.transform(files);
  }

  private preventDefault(dragEvent: DragEvent) {
    dragEvent.preventDefault();
    dragEvent.stopPropagation();
  }

  go(files: FileList) {
    if (!files || !files.length) return;

    this.transform(Array.from(files));
  }

  arrayBuffer2File(arrayBuffer: ArrayBuffer, name: string) {
    return arrayBuffer ? new File([arrayBuffer], name, { type: `txt/xml` }) : null;
  }

  private transform(files: File[]) {
    if (!files || !files.length) return;

    this.transformationItems = [
      ...files.map(file => {
        const name = file.name.split(`.`).slice(0, -1).join(`.`);

        return {
          name: name,
          transformation: this.transformService.transform(file, this.configuration).pipe(
            tap(tranformation => {
              if (tranformation.arrayBuffer) {
                const outputBlob = new Blob([tranformation.arrayBuffer], { type: this.configuration.outputType === OutputType.PLMXML ? `txt/xml` : `text/plain` });
                const outputBlobURL = URL.createObjectURL(outputBlob);

                const linkELement = document.createElement(`a`);
                linkELement.href = outputBlobURL;
                linkELement.download = `${name}.${this.configuration.outputType === OutputType.PLMXML ? 'plmxml' : 'ajt'}`;
                linkELement.click();

                linkELement.remove();
                URL.revokeObjectURL(outputBlobURL);
              }
            })
          )
        } as ITransformationItem
      }),

      ...this.transformationItems
    ];
  }
}
