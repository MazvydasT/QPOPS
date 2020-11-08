import { IItem } from './item';

(self as any).require = (sa: string[], fn: (p: any) => any) => fn((self as any).pako);

importScripts(
    './assets/JSJT/pako.js',
    './assets/JSJT/JSJT.min.js'
);

const Convert: (items: IItem[]) => number[] = (self as any).JSJT.Items2JT.Convert;

export const items2JT = (items: Map<string, IItem>) => new Uint8Array(Convert(Array.from(items.values()))).buffer;
