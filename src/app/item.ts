export interface IDataObject {
    '@_ExternalId': string,
  
    name?: string,
    number?: string,
    catalogNumber?: string,
  
    children?: { item?: string | string[] },
    inputFlows?: { item?: string | string[] },
    outputFlows?: { item?: string | string[] },
    parts?: { item?: string | string[] },
  
    prototype?: string,
    layout?: string,
    threeDRep?: string,
    file?: string,
    fileName?: string,
  
    NodeInfo?: {
      absoluteLocation?: {
        rx: string,
        ry: string,
        rz: string,
        x: string,
        y: string,
        z: string
      }
    }
  }

export interface IItem {
    title: string,
    children?: IItem[],
    transformationMatrix?: number[],
    filePath?: string,
  
    dataObject: IDataObject,
  
    parent?: IItem
  }