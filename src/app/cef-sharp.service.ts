import { Injectable } from '@angular/core';
import { IJTNode } from './IJTNode';

@Injectable({
  providedIn: 'root',
})
export class CefSharpService {
  private cefSharp = (window as any).CefSharp;
  private items2JT: {
    convert(jtNodes: [number, IJTNode][]): Promise<any>;
  };

  constructor() {
    if (this.isInCefSharp()) {
      this.cefSharp
        .BindObjectAsync(`items2JT`)
        .then(() => (this.items2JT = (window as any).items2JT));
    }
  }

  isInCefSharp() {
    return !!this.cefSharp;
  }

  convert(jtNodes: [number, IJTNode][]) {
    return this.items2JT.convert(jtNodes);
  }
}
