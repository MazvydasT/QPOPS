const doubleBackSlashRegExp = /(?<!^)\\{2,}/g;
const doubleForwardSlashRegExp = /\//g;

export const getFullFilePath = (sysRootPath: string, filePath: string) => {
    let fullFilePath: string = null;

    if (filePath) {
        if (filePath.startsWith(`"`) && filePath.endsWith(`"`)) { filePath = filePath.substring(1, filePath.length - 1); }

        fullFilePath = `${filePath.replace(`#`, sysRootPath).replace(doubleForwardSlashRegExp, `\\`).replace(doubleBackSlashRegExp, `\\`)}`;

        if (fullFilePath.endsWith(`.cojt`)) {
            const fullFilePathSegments = fullFilePath.split(`\\`);
            const fileName = fullFilePathSegments[fullFilePathSegments.length - 1];
            const fileNameSegments = fileName.split(`.`);
            const fileNameWithoutExtention = fileNameSegments.slice(0, fileNameSegments.length - 1).join(`.`);
            fullFilePath += `\\${fileNameWithoutExtention}.jt`;
        }
    }

    return fullFilePath;
};


const ampRegExp = /&/g;
const ltRegExp = /</g;
const gtRegExp = />/g;
const quotRegExp = /"/g;
const aposRegExp = /'/g;

export const encodeXML = (input: string) => !input ? input : input
    .replace(ampRegExp, '&amp;')
    .replace(ltRegExp, '&lt;')
    .replace(gtRegExp, '&gt;')
    .replace(quotRegExp, '&quot;')
    .replace(aposRegExp, '&apos;');

export const maxInt32 = ((2 ** 32) / 2) - 1;
export const minInt32 = ((2 ** 32) / 2) * -1;

export const int32ToUint8Array = (int32: number) => {
    if (!Number.isInteger(int32)) { throw new Error(`Not an int32`); }
    if (int32 < minInt32 || int32 > maxInt32) { throw new Error(`Not within int32 range`); }

    const arrayBuffer = new ArrayBuffer(4);

    new DataView(arrayBuffer).setInt32(0, int32, true);

    return new Uint8Array(arrayBuffer);
};

export const uint8ArrayToInt32 = (byteArray: Uint8Array) => {
    if (byteArray.length < 4 || byteArray.length > 4) { throw new Error(`Byte array has to be 4 bytes long`); }

    return new DataView(byteArray.buffer).getInt32(0, true);
};
