import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { IInput, IInputOptions } from './input';
import { ITransformation } from './transformation';

@Injectable({
  providedIn: 'root'
})
export class TransformerService {
  constructor() { }

  transform(file: File, options?: IInputOptions) {
    return new Observable<ITransformation>(subscriber => {
      if (typeof Worker === 'undefined') {
        subscriber.error(`Web wrokers are not supported in this browser.`);
        return;
      }

      let worker: Worker = null;

      const terminateWorker = () => {
        if (worker) worker.terminate();
      };

      const processArrayBuffer = (arrayBuffer: ArrayBuffer) => {
        worker = new Worker('./transformer.worker', { type: 'module' });

        worker.onmessage = ({ data }: { data: ITransformation }) => {
          subscriber.next(data);

          if (data.progressValue === data.completionValue) {
            terminateWorker();
            subscriber.complete();
          }
        };

        worker.onerror = errorEvent => {
          subscriber.error(errorEvent.message);

          terminateWorker();
        }

        const input: IInput = {
          arrayBuffer: arrayBuffer,
          sysRootPath: `\\\\gal71836\\hq\\Manufacturing\\AME\\VME\\sys_root`,
          options: options
        }

        worker.postMessage(input, [arrayBuffer]);
      };

      const fileReader = new FileReader();

      fileReader.onload = () => {
        processArrayBuffer(fileReader.result as ArrayBuffer)
      };

      fileReader.readAsArrayBuffer(file);

      //file.arrayBuffer().then(processArrayBuffer);

      return () => terminateWorker();
    });
  }
}