import { Injectable } from '@angular/core';
import { IInput } from './input';

@Injectable({
  providedIn: 'root'
})
export class TransformerService {
  constructor() { }

  transform(file: File) {
    return new Promise((resolve, reject) => {
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
    });
  }
}