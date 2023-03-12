/* eslint-disable @typescript-eslint/naming-convention */
export interface IJTNode {
  name: string;
  transformationMatrix?: number[];
  childrenIDs?: number[];
  referencedFile?: string;
  referencedFileIsPart: boolean;
  attributes: [string, unknown][];
  isRoot: boolean;
}
