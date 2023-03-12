import { IJTNode } from './IJTNode';

export interface ITransformation {
  progressValue: number;
  completionValue: number;

  arrayBuffer?: ArrayBuffer;

  errorMessage?: string;

  jtNodes?: [number, IJTNode][];
}
