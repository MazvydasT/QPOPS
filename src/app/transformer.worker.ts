/// <reference lib="webworker" />

import { Euler, Matrix4 } from 'three/build/three.module.js';

import { parse, X2jOptions } from 'fast-xml-parser';

import { IInput } from './input';
import { ITransformation } from './transformation';
import { IDataObject, IItem } from './item';
import { items2XML } from './transformer.2xml';
import { items2AJT } from './transformer.2ajt';
import { OutputType } from './transformation-configuration';

addEventListener(`message`, ({ data }: { data: IInput }) => {
  const COMPLETION_VALUE = 6;

  postMessage({ completionValue: COMPLETION_VALUE, progressValue: 0 } as ITransformation);

  const exludedNodes = [
    `Human`,
    `PmAttachment`,
    `PmCompoundResource`,
    `PmImage`,
    `PmPartPrototypeUsage`,
    `PmResourcePlaceholder`,
    `PmToolInstance`,
    `PmToolPrototype`,
    `PmVariantSet`,
    `PrLine`,
    `PrPlant`,
    `PrStation`,
    `PrZone`,
    `ScoreableOperation`,
    `Station_Geometry`
  ];

  const text = new TextDecoder().decode(data.arrayBuffer);

  const parseOptions: Partial<X2jOptions> = {
    ignoreAttributes: false,
    stopNodes: exludedNodes,
    parseNodeValue: false,
    attrValueProcessor: (attrValue: any, attrName: string) => attrName === `ExternalId` ? attrValue : null
  };
  const objects = parse(text, parseOptions)?.Data?.Objects as { [key: string]: IDataObject[] };

  postMessage({ completionValue: COMPLETION_VALUE, progressValue: 1 } as ITransformation);

  const items = new Map<string, IItem>();
  const supportingDataObjects = new Map<string, IDataObject>();

  for (let [objectType, dataObjects] of Object.entries(objects)) {
    if (exludedNodes.indexOf(objectType) > -1) continue;

    if (!Array.isArray(dataObjects)) dataObjects = [dataObjects];

    for (let i = 0, c = dataObjects.length; i < c; ++i) {
      const dataObject = dataObjects[i];
      const id = dataObject["@_ExternalId"];

      if (objectType !== `PmSource` && objectType !== `PmLayout` && !objectType.endsWith(`Prototype`) && (dataObject.children?.item || dataObject.inputFlows?.item || dataObject.prototype))
        items.set(id, {
          dataObject: dataObject,
          title: getTitle(dataObject.number, dataObject.name)
        });

      else
        supportingDataObjects.set(id, dataObject);
    }
  }

  postMessage({ completionValue: COMPLETION_VALUE, progressValue: 2 } as ITransformation);

  for (let item of items.values()) {
    const dataObject = item.dataObject;

    let children = dataObject.children?.item ?? [] as string[];
    if (!Array.isArray(children)) children = [children];

    let inputFlows = dataObject.inputFlows?.item ?? [] as string[];
    if (!Array.isArray(inputFlows)) inputFlows = [inputFlows];

    item.children = [
      ...children.map(id => items.get(id)).filter(item => item),
      ...inputFlows.map(id => {
        let parts = supportingDataObjects.get(id)?.parts?.item ?? [] as string[];
        if (!Array.isArray(parts)) parts = [parts];

        return parts.map(id => items.get(id)).filter(item => item);
      }).reduce((prev, curr) => [...prev, ...curr], [])
    ].map(childItem => {
      childItem.parent = item;
      return childItem;
    });


    const prototype = dataObject.prototype;
    if (prototype) {
      const prototypeObject = supportingDataObjects.get(prototype);

      if (prototypeObject) {
        item.title = getTitle(prototypeObject.catalogNumber, prototypeObject.name);

        item.filePath = supportingDataObjects.get(
          supportingDataObjects.get(prototypeObject.threeDRep)?.file
        )?.fileName;
      }

      const layout = dataObject.layout;
      if (layout) {
        const absoluteLocation = supportingDataObjects.get(layout)?.NodeInfo?.absoluteLocation;
        if (absoluteLocation) {
          const x = Number.parseFloat(absoluteLocation.x);
          const y = Number.parseFloat(absoluteLocation.y);
          const z = Number.parseFloat(absoluteLocation.z);

          const rx = Number.parseFloat(absoluteLocation.rx);
          const ry = Number.parseFloat(absoluteLocation.ry);
          const rz = Number.parseFloat(absoluteLocation.rz);

          if (x !== 0 || y !== 0 || z !== 0 || rx !== 0 || ry !== 0 || rz !== 0)
            item.transformationMatrix = eulerZYX2Matrix(x, y, z, rx, ry, rz);
        }
      }
    }

    item.dataObject = null;
  }

  postMessage({ completionValue: COMPLETION_VALUE, progressValue: 3 } as ITransformation);

  for (var supportingDataObject of supportingDataObjects.values()) {
    let outputFlows = supportingDataObject.outputFlows?.item;

    if (!outputFlows) continue;

    if (!Array.isArray(outputFlows)) outputFlows = [outputFlows];

    for (let pmFlowId of outputFlows) {
      const flowObject = supportingDataObjects.get(pmFlowId);
      if (!flowObject) continue;

      let parts = flowObject.parts?.item;
      if (!parts) continue;

      if (!Array.isArray(parts)) parts = [parts];

      for (let itemId of parts) {
        const item = items.get(itemId);
        if (!item) continue;

        //item.parent = null;
        items.delete(itemId);
      }
    }
  }

  postMessage({ completionValue: COMPLETION_VALUE, progressValue: 4 } as ITransformation);

  if (!data.configuration.includeBranchesWithoutCAD) {
    const emptyItems = Array.from(items.entries()).filter(([_, item]) => !item.filePath && (!item.children || !item.children.length));

    for (const [id, item] of emptyItems) {
      deleteEmptyItem(id, item, items);
    }
  }

  postMessage({ completionValue: COMPLETION_VALUE, progressValue: 5 } as ITransformation);

  const outputDocumentContent = data.configuration.outputType === OutputType.PLMXML ? items2XML(items, data) : items2AJT(items, data);

  const outputArrayBuffer = new TextEncoder().encode(outputDocumentContent).buffer;

  postMessage({ completionValue: COMPLETION_VALUE, progressValue: 6, arrayBuffer: outputArrayBuffer } as ITransformation, [outputArrayBuffer]);
});

const deleteEmptyItem = (id: string, item: IItem, items: Map<string, IItem>) => {
  if (item.filePath || (item.children && item.children.length)) return;

  if (items.has(id))
    items.delete(id);

  const parent = item.parent;
  if (parent) {
    let childIndex = parent.children.indexOf(item);

    while (childIndex > -1) {
      parent.children.splice(childIndex, 1);
      childIndex = parent.children.indexOf(item);
    }

    const parentIds = Array.from(items.entries()).filter(([_, item]) => item === parent).map(([id]) => id);

    for (const parentId of parentIds) {
      deleteEmptyItem(parentId, parent, items);
    }
  }
};

const getTitle = (number: string, name: string) => [number, name]
  .filter(value => value)
  .map(value => value.startsWith(`"`) && value.endsWith(`"`) ? value.substring(1, value.length - 1) : value).join(` - `);

const eulerZYX2Matrix = (x: number, y: number, z: number, rx: number, ry: number, rz: number) => new Matrix4()
  .makeRotationFromEuler(new Euler(rx, ry, rz, `ZYX`))
  .setPosition(x, y, z).toArray() as number[];//.join(` `) as string;