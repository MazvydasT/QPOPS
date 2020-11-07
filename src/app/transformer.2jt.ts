import { IItem } from './item';

// import { Convert } from './jsjt/JSJT';

// import * as Items2JT from './jsjt/JSJT';

(self as any).require = (sa: string[], fn: (p: any) => any) => fn((self as any).pako);

importScripts(
    './assets/JSJT/pako.js',
    // './assets/JSJT/bridge.js',
    // './assets/JSJT/bridge.meta.js',
    './assets/JSJT/JSJT.min.js'
);

const Convert: (items: IItem[]) => number[] = (self as any).JSJT.Items2JT.Convert;
// const Test: () => number[] = (self as any).JSJT.Items2JT.Test;

export const items2JT = (items: Map<string, IItem>) => /*Test();*/  Convert(Array.from(items.values()));

// export const asd = () => Items2JT.Test();
