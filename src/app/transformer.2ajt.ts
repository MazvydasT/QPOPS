import { IItem } from './item';
import { IInput } from './input';
import { getFullFilePath } from './utils';

export const items2AJT = (items: Map<string, IItem>, data: IInput) => {
    const rootItems = Array.from(items.values()).filter(item => !item.parent);

    const rootItem = rootItems.length === 1 ? rootItems[0] : { title: `Data`, children: rootItems } as IItem;

    return item2AJT(rootItem, data.configuration.sysRootPath, 0, []).join(`\n`);
};

const item2AJT = (item: IItem, sysRootPath: string, level: number, lines: string[]) => {
    lines.push(`${level} ${!item.filePath ? 'ASM' : 'SUB'} "${item.title}"`);

    if (level === 0) {
        lines.push(`ATTR_H Type="STRING" Key="JT_PROP_MEASUREMENT_UNITS" Value="Millimeters"`);
    }

    const filePath = item.filePath;
    if (filePath) {
        // lines.push(`File "${getFullFilePath(sysRootPath, filePath)}"`);
        lines.push(`File "${filePath}"`);
    }

    const transformationMatrix = item.transformationMatrix;
    if (item.transformationMatrix) {
        for (let i = 0; i < 16; i += 4) {
            lines.push(
                (i === 0 ? `Matrix ` : ``) +
                `[${transformationMatrix[i]} ${transformationMatrix[i + 1]} ${transformationMatrix[i + 2]} ${transformationMatrix[i + 3]}]`
            );
        }
    }

    const children = item.children;
    if (children) {
        for (const child of children) {
            item2AJT(child, sysRootPath, level + 1, lines);
        }
    }

    return lines;
};
