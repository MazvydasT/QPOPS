import { IItem } from './item';

(self as any).require = (sa: string[], fn: (p: any) => any) => fn((self as any).pako);

importScripts(
    './assets/JSJT/pako.js',
    './assets/JSJT/JSJT.js'
);

const convert: (items: IItem[]) => number[] = (self as any).JSJT.Items2JT.Convert;

export const items2JT = (items: Map<string, IItem>) => new Uint8Array(convert(Array.from(items.values()))).buffer;
