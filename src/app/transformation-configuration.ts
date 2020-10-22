export enum OutputType {
    AJT,
    PLMXML,
    JT
}

export interface ITransformationConfiguration {
    includeBranchesWithoutCAD?: boolean;
    outputType: OutputType;
    sysRootPath: string;
    ajt2jtConverterPath?: string;
}
