/// <reference lib="webworker" />

import { parse, X2jOptions } from 'fast-xml-parser';
import { decode } from 'he';
import { Euler, Matrix4 } from 'three/build/three.module.js';
import { IJTNode } from './IJTNode';
import { IInput } from './input';
import { IDataObject, IItem } from './item';
import { ITransformation } from './transformation';
import { ContentType, OutputType } from './transformation-configuration';
import { items2AJT } from './transformer.2ajt';
import { items2JT } from './transformer.2jt';
import { items2XML } from './transformer.2xml';
import { getFullFilePath } from './utils';

addEventListener(`message`, async ({ data }: { data: IInput }) => {
  try {
    transform(data);
  } catch (error) {
    handleError((error as Error).message);
    return;
  }
});

const transform = async (data: IInput) => {
  const COMPLETION_VALUE = 6;

  postMessage({
    completionValue: COMPLETION_VALUE,
    progressValue: 0,
  } as ITransformation);

  const exludedNodes = [
    `Human`,
    `PmAttachment`,
    `PmImage`,
    `PmVariantSet`,
    `ScoreableOperation`,
  ];

  const requiredForProduct = [
    `CompoundProcess`,
    `HumanOperation`,
    `PmCompoundOperation`,
    `PmCompoundPart`,
    `PmOperation`,
    `PmPartInstance`,
    `PmPartPrototype`,
    `PmPartPrototype`,
    `PrLineProcess`,
    `PrPlantProcess`,
    `PrStationProcess`,
    `PrZoneProcess`,
  ];

  const requiredForResources = [
    `PmCompoundResource`,
    `PmPartPrototypeUsage`,
    `PmResourcePlaceholder`,
    `PmToolInstance`,
    `PmToolPrototype`,
    `PrLine`,
    `PrPlant`,
    `PrStation`,
    `PrZone`,
    `Station_Geometry`,
  ];

  for (const contentSelection of data.configuration.selectedContentTypes) {
    if (!contentSelection.selected) {
      switch (contentSelection.contentType) {
        case ContentType.Resource:
          exludedNodes.push(...requiredForResources);
          break;

        case ContentType.Product:
          exludedNodes.push(...requiredForProduct);
          break;
      }
    }
  }

  const dataArrayBuffer = data.arrayBuffer;
  let byteIndex = 0;

  const chunkSize = 104857600; // 100 MiB

  const dataStream = new ReadableStream({
    pull: (controller) => {
      if (byteIndex >= dataArrayBuffer.byteLength) {
        controller.close();
      } else {
        controller.enqueue(
          dataArrayBuffer.slice(byteIndex, byteIndex + chunkSize)
        );
        byteIndex += chunkSize;
      }
    },
  });

  const reader = dataStream.pipeThrough(new TextDecoderStream()).getReader();
  let text = ``;

  const elementNameRegExp = /\<\s*([0-9a-z]+)\s+?ExternalId.*?\>/is;
  const blankElementRegExp = /\<[a-z]*?\/\>\s*/gi;

  const wholeElements = new Array<string>();

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    text += value;

    while (true) {
      const [, elementName] = elementNameRegExp.exec(text) ?? [];

      if (!elementName) {
        break;
      }

      const [wholeElement] =
        new RegExp(
          `\<\s*${elementName}\s*.*?\<\s*\/\s*${elementName}\s*\>`,
          `s`
        ).exec(text) ?? [];

      if (!wholeElement) {
        break;
      }

      text = text.substring(text.indexOf(wholeElement) + wholeElement.length);

      if (exludedNodes.includes(elementName)) {
        continue;
      }

      wholeElements.push(wholeElement.replace(blankElementRegExp, ``));
    }
  }

  const parseOptions: Partial<X2jOptions> = {
    ignoreAttributes: false,
    stopNodes: exludedNodes,
    parseNodeValue: false,

    attrValueProcessor: (attrValue: any, attrName: string) =>
      attrName === `ExternalId`
        ? decode(attrValue, { isAttributeValue: true })
        : null,

    tagValueProcessor: (tagValue, _tagName) => decode(tagValue),
  };

  const arrayOfObjects = new Array<{ [key: string]: IDataObject[] }>();
  const numberOfObjectsToParseInOneGo = 100000;

  try {
    for (
      let objectsIndex = 0;
      objectsIndex < wholeElements.length;
      objectsIndex += numberOfObjectsToParseInOneGo
    ) {
      arrayOfObjects.push(
        parse(
          `<O>${wholeElements
            .slice(objectsIndex, objectsIndex + numberOfObjectsToParseInOneGo)
            .join(``)}</O>`,
          parseOptions
        )?.O
      );
    }
  } catch (error) {
    handleError(`Input file is not valid XML.`);
    return;
  }

  postMessage({
    completionValue: COMPLETION_VALUE,
    progressValue: 1,
  } as ITransformation);

  const items = new Map<string, IItem>();
  const supportingDataObjects = new Map<string, IDataObject>();

  let idCounter = 0;

  for (const objects of arrayOfObjects) {
    // eslint-disable-next-line prefer-const
    for (let [objectType, dataObjects] of Object.entries(objects)) {
      if (exludedNodes.indexOf(objectType) > -1) {
        continue;
      }

      if (!Array.isArray(dataObjects)) {
        dataObjects = [dataObjects];
      }

      for (let i = 0, c = dataObjects.length; i < c; ++i) {
        const dataObject = dataObjects[i];
        const id = dataObject['@_ExternalId'];

        const isProduct = requiredForProduct.includes(objectType);
        const isResource = requiredForResources.includes(objectType);

        if (
          objectType !== `PmSource` &&
          objectType !== `PmLayout` &&
          !objectType.endsWith(`Prototype`) &&
          (isProduct || isResource)
        ) {
          const item: IItem = {
            type: isProduct ? ContentType.Product : ContentType.Resource,
            dataObject,
            title: getTitle(dataObject.number, dataObject.name),
            children: null,
            filePath: null,
            fileIsPart: isProduct,
            parent: null,
            transformationMatrix: null,
            attributes: new Map(),
          };

          if (data.isInCefSharp) {
            item.id = idCounter++;
          }

          items.set(id, item);
        } else {
          supportingDataObjects.set(id, dataObject);
        }
      }
    }
  }

  postMessage({
    completionValue: COMPLETION_VALUE,
    progressValue: 2,
  } as ITransformation);

  for (const item of items.values()) {
    const dataObject = item.dataObject;

    let children = dataObject.children?.item ?? ([] as string[]);
    if (!Array.isArray(children)) {
      children = [children];
    }

    let inputFlows = dataObject.inputFlows?.item ?? ([] as string[]);
    if (!Array.isArray(inputFlows)) {
      inputFlows = [inputFlows];
    }

    item.children = [
      ...children.map((id) => items.get(id)).filter((childItem) => childItem),
      ...inputFlows
        .map((id) => {
          let parts =
            supportingDataObjects.get(id)?.parts?.item ?? ([] as string[]);
          if (!Array.isArray(parts)) {
            parts = [parts];
          }

          return parts
            .map((partId) => items.get(partId))
            .filter((partItem) => partItem);
        })
        .reduce((prev, curr) => [...prev, ...curr], []),
    ].map((childItem) => {
      childItem.parent = item;
      return childItem;
    });

    let tceRevision: string = null;
    let activeInCurrentVersion: string = null;

    const prototype = dataObject.prototype;
    if (prototype) {
      const prototypeObject = supportingDataObjects.get(prototype);

      if (prototypeObject) {
        /*item.title = getTitle(
          prototypeObject.catalogNumber,
          prototypeObject.name
        );*/

        item.filePath = getFullFilePath(
          data.configuration.sysRootPath,
          supportingDataObjects.get(
            supportingDataObjects.get(prototypeObject.threeDRep)?.file
          )?.fileName
        );

        if (
          item.type === ContentType.Resource &&
          data.configuration.resourceSysRootJTFilesAreAssemblies &&
          !item.filePath?.startsWith(data.configuration.sysRootPath)
        ) {
          item.fileIsPart = true;
        }

        if (prototypeObject?.TCe_Revision) {
          tceRevision = prototypeObject.TCe_Revision;
        }

        if (prototypeObject?.ActiveInCurrentVersion) {
          activeInCurrentVersion = `${prototypeObject?.ActiveInCurrentVersion} (prototype)`;
        }
      }

      const layout = dataObject.layout;
      if (layout) {
        const absoluteLocation =
          supportingDataObjects.get(layout)?.NodeInfo?.absoluteLocation;
        if (absoluteLocation) {
          const x = Number.parseFloat(absoluteLocation.x);
          const y = Number.parseFloat(absoluteLocation.y);
          const z = Number.parseFloat(absoluteLocation.z);

          const rx = Number.parseFloat(absoluteLocation.rx);
          const ry = Number.parseFloat(absoluteLocation.ry);
          const rz = Number.parseFloat(absoluteLocation.rz);

          if (
            x !== 0 ||
            y !== 0 ||
            z !== 0 ||
            rx !== 0 ||
            ry !== 0 ||
            rz !== 0
          ) {
            item.transformationMatrix = eulerZYX2Matrix(x, y, z, rx, ry, rz);
          }
        }
      }
    }

    item.attributes.set(`3D file`, item.filePath ?? ``);

    const status = dataObject?.NodeInfo?.status;

    item.attributes.set(`Created by`, status?.createdBy ?? ``);
    item.attributes.set(`Last modified by`, status?.lastModifiedBy ?? ``);
    item.attributes.set(`Date`, status?.modificationDate ?? ``);

    if (!tceRevision && dataObject?.TCe_Revision) {
      tceRevision = dataObject.TCe_Revision;
    }

    item.attributes.set(`TCe_Revision`, tceRevision ?? ``);

    item.attributes.set(`Comment`, dataObject?.comment ?? ``);
    item.attributes.set(`Comment1`, dataObject?.Comment1 ?? ``);
    item.attributes.set(`Comment2`, dataObject?.Comment2 ?? ``);

    item.attributes.set(
      `ActiveInCurrentVersion`,
      dataObject?.ActiveInCurrentVersion ?? activeInCurrentVersion ?? ``
    );

    if (data.additionalAttributes) {
      for (const [key, value] of data.additionalAttributes) {
        item.attributes.set(key, value);
      }
    }

    item.dataObject = null;
  }

  postMessage({
    completionValue: COMPLETION_VALUE,
    progressValue: 3,
  } as ITransformation);

  for (const supportingDataObject of supportingDataObjects.values()) {
    let outputFlows = supportingDataObject.outputFlows?.item;

    if (!outputFlows) {
      continue;
    }

    if (!Array.isArray(outputFlows)) {
      outputFlows = [outputFlows];
    }

    for (const pmFlowId of outputFlows) {
      const flowObject = supportingDataObjects.get(pmFlowId);
      if (!flowObject) {
        continue;
      }

      let parts = flowObject.parts?.item;
      if (!parts) {
        continue;
      }

      if (!Array.isArray(parts)) {
        parts = [parts];
      }

      for (const itemId of parts) {
        const item = items.get(itemId);
        if (!item) {
          continue;
        }

        items.delete(itemId);
      }
    }
  }

  postMessage({
    completionValue: COMPLETION_VALUE,
    progressValue: 4,
  } as ITransformation);

  if (!data.configuration.includeBranchesWithoutCAD) {
    const emptyItems = Array.from(items.entries()).filter(
      ([_, item]) => !item.filePath && (!item.children || !item.children.length)
    );

    for (const [id, item] of emptyItems) {
      deleteEmptyItem(id, item, items);
    }
  }

  postMessage({
    completionValue: COMPLETION_VALUE,
    progressValue: 5,
  } as ITransformation);

  const outputType = data.configuration.outputType;

  const root: IItem = {
    title: data.inputFileName,
    attributes: null,
    children: [],
    dataObject: null,
    fileIsPart: null,
    filePath: null,
    parent: null,
    transformationMatrix: null,
    type: null,
  };

  for (const item of items.values()) {
    if (!item.parent) {
      if (item.type === ContentType.Resource) {
        item.title = `Resource: ${item.title}`;
      }

      root.children.push(item);
      item.parent = root;
    }
  }

  if (data.isInCefSharp) {
    root.id = idCounter++;
  }

  items.set(`${Date.now()}-root`, root);

  if (data.isInCefSharp) {
    const jtNodeLookup = item2JTNodeLookup(root, new Map());
    const jtNodes = Array.from(jtNodeLookup.entries());

    postMessage({
      completionValue: COMPLETION_VALUE,
      progressValue: 5,
      jtNodes,
    } as ITransformation);
  } else {
    const outputArrayBuffer =
      outputType === OutputType.JT
        ? items2JT(items)
        : outputType === OutputType.PLMXML
        ? items2XML(items)
        : items2AJT(items);

    postMessage(
      {
        completionValue: COMPLETION_VALUE,
        progressValue: 6,
        arrayBuffer: outputArrayBuffer,
      } as ITransformation,
      [outputArrayBuffer]
    );
  }
};

const item2JTNodeLookup = (item: IItem, inLookup: Map<number, IJTNode>) => {
  const jtNode: IJTNode = {
    isRoot: !item.parent,
    name: item.title,
    transformationMatrix: item.transformationMatrix,
    childrenIDs: item.children?.map((child) => {
      item2JTNodeLookup(child, inLookup);
      return child.id;
    }),
    referencedFile: item.filePath,
    referencedFileIsPart: item.fileIsPart,
    attributes: !!item.attributes
      ? Array.from(item.attributes.entries())
      : undefined,
  };

  inLookup.set(item.id, jtNode);

  return inLookup;
};

const deleteEmptyItem = (
  id: string,
  item: IItem,
  items: Map<string, IItem>
) => {
  if (item.filePath || (item.children && item.children.length)) {
    return;
  }

  if (items.has(id)) {
    items.delete(id);
  }

  const parent = item.parent;
  if (parent) {
    let childIndex = parent.children.indexOf(item);

    while (childIndex > -1) {
      parent.children.splice(childIndex, 1);
      childIndex = parent.children.indexOf(item);
    }

    const parentIds = Array.from(items.entries())
      .filter(([_, parentItem]) => parentItem === parent)
      .map(([parentId]) => parentId);

    for (const parentId of parentIds) {
      deleteEmptyItem(parentId, parent, items);
    }
  }
};

const getTitle = (itemNumber: string, name: string) =>
  [itemNumber, name]
    .filter((value) => value)
    .map((value) =>
      value.startsWith(`"`) && value.endsWith(`"`)
        ? value.substring(1, value.length - 1)
        : value
    )
    .join(` - `);

const eulerZYX2Matrix = (
  x: number,
  y: number,
  z: number,
  rx: number,
  ry: number,
  rz: number
) =>
  new Matrix4()
    .makeRotationFromEuler(new Euler(rx, ry, rz, `ZYX`))
    .setPosition(x, y, z)
    .toArray() as number[];

const handleError = (message: string) =>
  postMessage({
    completionValue: 1,
    progressValue: 1,
    errorMessage: message,
  } as ITransformation);
