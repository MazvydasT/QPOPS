/* eslint-disable @typescript-eslint/naming-convention */
export enum OutputType {
    AJT,
    PLMXML,
    JT
}

export enum ContentType {
    Product,
    Resource
}

export interface IContentTypeSelection {
    contentType: ContentType;
    selected: boolean;
}

export interface ITransformationConfiguration {
    includeBranchesWithoutCAD?: boolean;
    resourceSysRootJTFilesAreAssemblies?: boolean;
    outputType: OutputType;
    sysRootPath: string;
    ajt2jtConverterPath?: string;
    selectedContentTypes: IContentTypeSelection[];
}
