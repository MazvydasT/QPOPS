import { IItem } from './item';

export interface ITransformation {
    progressValue: number;
    completionValue: number;

    arrayBuffer?: ArrayBuffer;

    errorMessage?: string;

    items?: IItem[];
}
