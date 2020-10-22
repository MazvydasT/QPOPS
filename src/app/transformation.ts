export interface ITransformation {
    progressValue: number;
    completionValue: number;

    arrayBuffer?: ArrayBuffer;

    errorMessage?: string;
}
