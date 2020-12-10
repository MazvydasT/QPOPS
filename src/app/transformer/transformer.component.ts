import { Component } from '@angular/core';
import * as moment from 'moment';
import { duration } from 'moment';
import { cloneDeep, merge } from 'lodash-es';
import { animationFrameScheduler, combineLatest, Observable, of, scheduled } from 'rxjs';
import { catchError, distinctUntilChanged, map, repeat, share, take, takeLast, takeUntil, tap } from 'rxjs/operators';
import { StorageService } from '../storage.service';
import { ITransformation } from '../transformation';
import { ContentType, IContentTypeSelection, ITransformationConfiguration, OutputType } from '../transformation-configuration';
import { TransformerService } from '../transformer.service';

interface ITransformationItem {
  transformation: Observable<ITransformation>;

  name: string;

  outputType: OutputType;

  runDuration: Observable<string>;
}

@Component({
  templateUrl: './transformer.component.html',
  styleUrls: ['./transformer.component.scss']
})
export class TransformerComponent {
  transformationItems: ITransformationItem[] = [];

  acceptDrop: boolean = null;

  ouputTypes = OutputType;
  contentTypes = ContentType;

  configuration: ITransformationConfiguration = {
    includeBranchesWithoutCAD: false,
    outputType: OutputType.JT,
    sysRootPath: `\\\\gal71836\\hq\\Manufacturing\\AME\\VME\\sys_root`,
    ajt2jtConverterPath: `C:\\Program Files\\Siemens\\JtUtilities\\12_4\\bin64\\asciitojt.exe`,
    selectedContentTypes: Array.from(Object.values(ContentType))
      .filter(v => typeof v === `number`)
      .map((v): IContentTypeSelection => ({ contentType: (v as ContentType), selected: v === ContentType.Product }))
  };

  private animationFrame = scheduled(of(null), animationFrameScheduler).pipe(
    repeat(),
    map(() => moment()),
    distinctUntilChanged((prev, curr) =>
      prev.year() === curr.year() &&
      prev.dayOfYear() === curr.dayOfYear() &&
      prev.hour() === curr.hour() &&
      prev.minute() === curr.minute() &&
      prev.second() === curr.second()),
    share()
  );


  constructor(
    private transformService: TransformerService,
    private storageService: StorageService
  ) {
    merge(this.configuration, storageService.get<ITransformationConfiguration>(`configuration`) ?? {}, { outputType: OutputType.JT });
  }

  countNumberOfSelectedContentTypes() {
    return this.configuration.selectedContentTypes.filter(t => t.selected).length;
  }

  onConfigurationChange() {
    setTimeout(() => {
      const currentConfiguration = { ...this.configuration };

      if (currentConfiguration.sysRootPath.trim().length === 0) {
        currentConfiguration.sysRootPath = undefined;
      }

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

    if (!files.length) { return; }

    this.transform(files);
  }

  go(files: FileList) {
    if (!files || !files.length) { return; }

    this.transform(Array.from(files));
  }

  arrayBuffer2File(arrayBuffer: ArrayBuffer, name: string) {
    return arrayBuffer ? new File([arrayBuffer], name, { type: `txt/xml` }) : null;
  }

  private preventDefault(dragEvent: DragEvent) {
    dragEvent.preventDefault();
    dragEvent.stopPropagation();
  }

  private transform(files: File[]) {
    if (!files || !files.length) { return; }

    this.transformationItems = [
      ...files.map(file => {
        const name = file.name.split(`.`).slice(0, -1).join(`.`);

        const configuration = cloneDeep(this.configuration);

        const transformation = this.transformService.enqueueTransform(file, configuration).pipe(
          catchError((err: Error) => of({ completionValue: 1, progressValue: 1, errorMessage: err.message } as ITransformation)),
          tap(tranformation => {
            if (tranformation.arrayBuffer) {
              const outputType = configuration.outputType;

              const outputBlob = new Blob([tranformation.arrayBuffer], {
                type: outputType === OutputType.PLMXML ?
                  `txt/xml` : (outputType === OutputType.AJT ? `text/plain` : 'application/octet-stream')
              });
              const outputBlobURL = URL.createObjectURL(outputBlob);

              const linkELement = document.createElement(`a`);
              linkELement.href = outputBlobURL;
              linkELement.download = `${name}.${outputType === OutputType.PLMXML ?
                'plmxml' : (outputType === OutputType.AJT ? 'ajt' : 'jt')}`;
              linkELement.click();

              linkELement.remove();
              URL.revokeObjectURL(outputBlobURL);
            }
          }),
          share()
        );

        return {
          name,
          outputType: configuration.outputType,
          transformation,

          runDuration: combineLatest([
            transformation.pipe(
              take(1),
              map(() => moment())
            ),
            this.animationFrame
          ]).pipe(
            takeUntil(transformation.pipe(
              takeLast(1)
            )),
            map(([start, current]) => {
              if (current.isBefore(start)) {
                start = current;
              }

              const runDuration = duration(current.diff(start));

              const hours = Math.floor(runDuration.asHours()).toString().padStart(2, '0');
              const minutes = runDuration.minutes().toString().padStart(2, '0');
              const seconds = runDuration.seconds().toString().padStart(2, '0');

              return `${hours}:${minutes}:${seconds}`;
            })
          )
        };
      }),

      ...this.transformationItems
    ];
  }
}
