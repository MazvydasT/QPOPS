import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { IInput } from './input';
import { ITransformationConfiguration } from './transformation-configuration';
import { ITransformation } from './transformation';

@Injectable({
  providedIn: 'root'
})
export class TransformerService {

  private readonly maxConcurancy = (navigator?.hardwareConcurrency ?? 4) - 1;
  private jobsInProgress = 0;

  private readonly queue = new Array<() => void>();

  constructor() { }

  enqueueTransform(file: File, options?: ITransformationConfiguration) {
    return new Observable<ITransformation>(subscriber => {
      if (typeof Worker === 'undefined') {
        subscriber.error(new Error(`Web wrokers are not supported in this browser.`));
        return;
      }

      let worker: Worker = null;

      const terminateWorker = () => worker?.terminate();

      const processArrayBuffer = (arrayBuffer: ArrayBuffer) => {
        worker = new Worker('./transformer.worker', { type: 'module' });

        worker.onmessage = ({ data }: { data: ITransformation }) => {

          if (data.errorMessage) {
            subscriber.error(new Error(data.errorMessage));
            return;
          }

          subscriber.next(data);

          if (data.progressValue === data.completionValue) {
            terminateWorker();

            subscriber.complete();

            this.jobsInProgress--;
            this.processQueue();
          }
        };

        worker.onerror = errorEvent => {
          subscriber.error(errorEvent);

          terminateWorker();

          this.jobsInProgress--;
          this.processQueue();
        };

        const input: IInput = {
          arrayBuffer,
          configuration: options
        };

        worker.postMessage(input, [arrayBuffer]);
      };

      this.queue.push(() => file.arrayBuffer().then(processArrayBuffer));
      // file.arrayBuffer().then(processArrayBuffer);

      this.processQueue();

      return () => terminateWorker();
    });
  }

  private processQueue() {
    if (this.jobsInProgress < this.maxConcurancy && this.queue.length > 0) {
      this.jobsInProgress++;
      this.queue.shift()();
    }
  }
}
