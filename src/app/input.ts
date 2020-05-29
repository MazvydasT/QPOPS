export interface IInputOptions {
    includeBranchesWithoutCAD: boolean
}

export interface IInput {
    arrayBuffer: ArrayBuffer,
    sysRootPath: string,
    options?: IInputOptions
}