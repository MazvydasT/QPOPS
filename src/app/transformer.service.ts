import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { IInput } from './input';
import { ITransformation } from './transformation';

@Injectable({
  providedIn: 'root'
})
export class TransformerService {
  constructor() { }

  transform(file: File) {
    return new Observable<ITransformation>(subscriber => {
      if (typeof Worker === 'undefined') {
        subscriber.error(`Web wrokers are not supported in this browser.`);
        return;
      }

      let worker: Worker = null;

      const terminateWorker = () => {
        if (worker) worker.terminate();
      };

      file.arrayBuffer().then(arrayBuffer => {
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
          sysRootPath: `\\\\gal71836\\hq\\Manufacturing\\AME\\VME\\sys_root`
        }

        worker.postMessage(input, [arrayBuffer]);
      });

      return () => terminateWorker();
    });

    /*return new Promise((resolve, reject) => {
      if (typeof Worker === 'undefined') {
        reject(`Web wrokers are not supported in this browser.`);
        return;
      }

      file.arrayBuffer().then(arrayBuffer => {
        const worker = new Worker('./transformer.worker', { type: 'module' });

        worker.onmessage = ({ data }) => {
          resolve(data);
          worker.terminate();
        };

        const input: IInput = {
          arrayBuffer: arrayBuffer,
          sysRootPath: `\\\\gal71836\\hq\\Manufacturing\\AME\\VME\\sys_root`
        }

        worker.postMessage(input, [arrayBuffer]);
      });
    });*/
  }
}