import { IItem } from './item';
import { IInput } from './input';
import { getFullFilePath } from './utils';

(self as any).require = (sa: string[], fn: (p: any) => any) => fn((self as any).pako);

importScripts(
    './assets/JSJT/pako.js',
    './assets/JSJT/bridge.js',
    './assets/JSJT/bridge.meta.js',
    './assets/JSJT/JSJT.js'
);

const Convert: (items: IItem[]) => number[] = (self as any).JSJT.Items2JT.Convert;

export const items2JT = (items: Map<string, IItem>, data: IInput) => {
    const sysRootPath = data.configuration.sysRootPath;

    const values = Array.from(items.values()); /*.map(i => {
        if (i.filePath) {
            i.filePath = getFullFilePath(sysRootPath, i.filePath);

            if (!i.attributes) {
                i.attributes = new Map();
            }

            i.attributes.set(`filePath`, i.filePath);
        }

        return i;
    });*/
    debugger;
    return Convert(values);
};
