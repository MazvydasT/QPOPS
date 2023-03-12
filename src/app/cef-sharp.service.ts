import { Injectable } from '@angular/core';
import { IItem } from './item';

@Injectable({
  providedIn: 'root'
})
export class CefSharpService {
  private cefSharp = (window as any).CefSharp;
  private items2JT: {
    convert(items: IItem[]): Promise<any>;
  };

  constructor() {
    if(this.isInCefSharp()) {
      this.cefSharp.BindObjectAsync(`items2JT`).then(() => this.items2JT = (window as any).items2JT);
    }
  }

  isInCefSharp() {
    return !!this.cefSharp;
  }

  convert(items: IItem[]) {
    return this.items2JT.convert(items);
  }
}
