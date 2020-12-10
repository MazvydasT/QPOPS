import { IItem } from './item';

const LF_CHAR_CODE = `\n`.charCodeAt(0);
const SPACE_CHAR_CODE = ` `.charCodeAt(0);

export const items2AJT = (items: Map<string, IItem>) => {
    const rootItems = Array.from(items.values()).filter(item => !item.parent);

    const rootItem = rootItems.length === 1 ? rootItems[0] : { title: `Data`, children: rootItems } as IItem;

    const rows = item2AJT(rootItem, 0, []);

    let charCount = 0;

    for (const row of rows) {
        charCount += row.length;
    }

    const byteArray = new Uint8Array(charCount + rows.length);

    charCount = 0;

    for (const row of rows) {
        for (let i = 0, c = row.length; i < c; ++i) {
            let charCode = row.charCodeAt(i);

            if (charCode < 32 || charCode > 126) {
                charCode = SPACE_CHAR_CODE;
            }

            byteArray[charCount++] = charCode;
        }

        byteArray[charCount++] = LF_CHAR_CODE;
    }

    return byteArray.buffer;
};

const item2AJT = (item: IItem, level: number, lines: string[]) => {
    lines.push(`${level} ${!item.filePath ? 'ASM' : 'SUB'} "${item.title}"`);

    if (level === 0) {
        lines.push(`ATTR_H Type="STRING" Key="JT_PROP_MEASUREMENT_UNITS" Value="Millimeters"`);
    }

    const filePath = item.filePath;
    if (filePath) {
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
            item2AJT(child, level + 1, lines);
        }
    }

    return lines;
};
