import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { CefSharpService } from './cef-sharp.service';

import { IInput } from './input';
import { ITransformation } from './transformation';
import { ITransformationConfiguration } from './transformation-configuration';
import { VersionService } from './version.service';

@Injectable({
  providedIn: 'root'
})
export class TransformerService {

  private readonly maxConcurancy = this.cefSharpService.isInCefSharp() ? 1 : (navigator?.hardwareConcurrency ?? 4) - 1;
  private jobsInProgress = 0;

  private readonly queue = new Array<() => void>();

  constructor(private versionService: VersionService, private cefSharpService: CefSharpService) { }

  enqueueTransform(file: File, inputFileName: string, options?: ITransformationConfiguration) {
    return new Observable<ITransformation>(subscriber => {
      if (typeof Worker === 'undefined') {
        subscriber.error(new Error(`Web wrokers are not supported in this browser.`));
        return;
      }

      let worker: Worker = null;

      const terminateWorker = () => worker?.terminate();

      const processArrayBuffer = (arrayBuffer: ArrayBuffer) => {
        worker = new Worker(new URL('./transformer.worker', import.meta.url), { type: 'module' });

        worker.onmessage = async ({ data }: { data: ITransformation }) => {

          if (data.errorMessage) {
            subscriber.error(new Error(data.errorMessage));
            return;
          }

          if(!!data.jtNodes) {
            const jtFileBytesPromise = this.cefSharpService.convert(data.jtNodes);
            data.jtNodes = undefined;
            const jtFileBytes = await jtFileBytesPromise;

            data.arrayBuffer = new Uint8Array(jtFileBytes).buffer;
            data.progressValue = data.completionValue;
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

        const version = this.versionService.getVersion();

        const input: IInput = {
          arrayBuffer,
          configuration: options,
          additionalAttributes: new Map([
            [`QPOPS`, `v${version.major}.${version.minor}.${version.patch}`]
          ]),
          inputFileName,
          isInCefSharp: this.cefSharpService.isInCefSharp()
        };

        worker.postMessage(input, [arrayBuffer]);
      };

      this.queue.push(() => file.arrayBuffer().then(processArrayBuffer));

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
