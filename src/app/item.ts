import { ContentType } from './transformation-configuration';

export interface IDataObject {
  '@_ExternalId': string;

  name?: string;
  number?: string;
  catalogNumber?: string;

  children?: { item?: string | string[] };
  inputFlows?: { item?: string | string[] };
  outputFlows?: { item?: string | string[] };
  parts?: { item?: string | string[] };

  prototype?: string;
  layout?: string;
  threeDRep?: string;
  file?: string;
  fileName?: string;

  NodeInfo?: {
    absoluteLocation?: {
      rx: string,
      ry: string,
      rz: string,
      x: string,
      y: string,
      z: string
    },

    status?: {
      createdBy: string,
      lastModifiedBy: string,
      modificationDate: string
    }
  };

  TCe_Revision?: string;

  Comment2?: string;
}

export interface IItem {
  type: ContentType;

  title: string;

  children: IItem[];

  attributes: Map<string, any>;

  transformationMatrix: number[];

  filePath: string;

  dataObject: IDataObject;

  parent: IItem;
}
