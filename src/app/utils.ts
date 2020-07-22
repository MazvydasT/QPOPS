const doubleBackSlashRegExp = /(?<!^)\\{2,}/g;
const doubleForwardSlashRegExp = /\//g;

export const getFullFilePath = (sysRootPath: string, filePath: string) => {
    let fullFilePath: string = null;
    
    if (filePath) {
        if (filePath.startsWith(`"`) && filePath.endsWith(`"`)) filePath = filePath.substring(1, filePath.length - 1);

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