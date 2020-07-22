export enum OutputType {
    AJT,
    PLMXML
}

export interface ITransformationConfiguration {
    includeBranchesWithoutCAD?: boolean;
    outputType: OutputType;
    sysRootPath: string;
}