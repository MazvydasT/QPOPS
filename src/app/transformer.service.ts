import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { IInput } from './input';
import { ITransformationConfiguration, OutputType } from './transformation-configuration';
import { ITransformation } from './transformation';
import { JtServerService } from './jt-server.service';
import { tap, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TransformerService {
  constructor(/*private jtServerService: JtServerService*/) { }

  transform(file: File, name: string, options?: ITransformationConfiguration) {
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

          subscriber.next(/*options.outputType !== OutputType.JT ?*/ data /*:
            Object.assign({}, data, {
              completionValue: data.completionValue + 1,
              arrayBuffer: null
            } as ITransformation)*/);

          if (data.progressValue === data.completionValue) {
            terminateWorker();

            // if (options.outputType !== OutputType.JT) {
            subscriber.complete();
            /*}

            else {
              this.jtServerService.ajt2jt(data.arrayBuffer, name, options.ajt2jtConverterPath).pipe(take(1)).subscribe(
                jtArrayBuffer => {
                  subscriber.next(Object.assign({}, data, {
                    completionValue: data.completionValue + 1,
                    progressValue: data.progressValue + 1,
                    arrayBuffer: jtArrayBuffer
                  } as ITransformation));

                  subscriber.complete();
                },
                err => subscriber.error(err)
              );
          }*/
          }
        };

        worker.onerror = errorEvent => {
          subscriber.error(errorEvent);

          terminateWorker();
        };

        const input: IInput = {
          arrayBuffer,
          configuration: options
        };

        worker.postMessage(input, [arrayBuffer]);
      };

      file.arrayBuffer().then(processArrayBuffer);

      return () => terminateWorker();
    });
  }
}
