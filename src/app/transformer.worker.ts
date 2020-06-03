/// <reference lib="webworker" />

import { Euler, Matrix4 } from 'three/build/three.module.js';

import { parse, X2jOptions } from 'fast-xml-parser';

import { IInput } from './input';
import { ITransformation } from './transformation';

interface IItem {
  title: string,
  children?: IItem[],
  transformationMatrix?: string,
  filePath?: string,

  dataObject: IDataObject,

  hasParent?: boolean
}

interface IDataObject {
  '@_ExternalId': string,

  name?: string,
  number?: string,
  catalogNumber?: string,

  children?: { item?: string[] },
  inputFlows?: { item?: string[] },
  parts?: { item?: string[] },

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

addEventListener(`message`, ({ data }: { data: IInput }) => {
  postMessage({ completionValue: 4, progressValue: 0 } as ITransformation);

  const exludedNodes = [
    `Human`,
    `PmAttachment`,
    `PmCompoundResource`,
    `PmImage`,
    `PmPartPrototypeUsage`,
    `PmResourcePlaceholder`,
    `PmSource`,
    `PmToolInstance`,
    `PmToolPrototype`,
    `PmVariantSet`,
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

  postMessage({ completionValue: 4, progressValue: 1 } as ITransformation);

  const items = new Map<string, IItem>();
  const supportingDataObjects = new Map<string, IDataObject>();

  for (let [objectType, dataObjects] of Object.entries(objects)) {
    if (exludedNodes.indexOf(objectType) > -1) continue;

    if (!Array.isArray(dataObjects)) dataObjects = [dataObjects];

    for (let i = 0, c = dataObjects.length; i < c; ++i) {
      const dataObject = dataObjects[i];
      const id = dataObject["@_ExternalId"];

      if (objectType !== `PmLayout` && !objectType.endsWith(`Prototype`) && (dataObject.children?.item || dataObject.inputFlows?.item || dataObject.prototype))
        items.set(id, {
          dataObject: dataObject,
          title: getTitle(dataObject.number, dataObject.name)
        });

      else
        supportingDataObjects.set(id, dataObject);
    }
  }

  postMessage({ completionValue: 4, progressValue: 2 } as ITransformation);

  for (let item of items.values()) {
    const dataObject = item.dataObject;

    let children = dataObject.children?.item ?? [] as string[];
    if (!Array.isArray(children)) children = [children];

    let inputFlows = dataObject.inputFlows?.item ?? [] as string[];
    if (!Array.isArray(inputFlows)) inputFlows = [inputFlows];

    item.children = [
      ...children.map(id => items.get(id)).filter(item => item),
      ...(inputFlows).map(id => {
        let parts = supportingDataObjects.get(id)?.parts?.item ?? [] as string[];
        if (!Array.isArray(parts)) parts = [parts];

        return parts.map(id => items.get(id)).filter(item => item);
      }).reduce((prev, curr) => [...prev, ...curr], [])
    ].map(item => {
      item.hasParent = true;
      return item;
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

  postMessage({ completionValue: 4, progressValue: 3 } as ITransformation);

  const instanceGraphContent = new Array<string>();

  const partIdLookup = new Map<string, number>();

  const idTracker = [0];
  const rootRefs = Array.from(items.entries()).filter(([id, item]) => !item.hasParent).map(([id]) =>
    item2XML(items.get(id), data.sysRootPath, idTracker, instanceGraphContent, partIdLookup, data?.options?.includeBranchesWithoutCAD ?? false));

  const currentTime = new Date();
  const timeString = `${currentTime.getHours().toString().padStart(2, `0`)}:${currentTime.getMinutes().toString().padStart(2, `0`)}:${currentTime.getSeconds().toString().padStart(2, `0`)}`;
  const dateString = `${currentTime.getFullYear()}-${(currentTime.getMonth() + 1).toString().padStart(2, `0`)}-${currentTime.getDate().toString().padStart(2, `0`)}`;

  const outputDocumentLines = [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<PLMXML xmlns="http://www.plmxml.org/Schemas/PLMXMLSchema" xmlns:vis="PLMXMLTcVisSchema" time="${timeString}" schemaVersion="6" author="Qpops" date="${dateString}">`,
    `<ProductDef>`,
    `<UserData><UserValue title="__TC-VIS_NO_UNITS" type="boolean" value="true"/></UserData>`,
    `<InstanceGraph rootRefs="${rootRefs.join(` `)}">`,
    ...instanceGraphContent,
    `</InstanceGraph>`,
    `</ProductDef>`,
    `</PLMXML>`
  ];

  const outputArrayBuffer = new TextEncoder().encode(outputDocumentLines.join(`\n`)).buffer;

  postMessage({ completionValue: 4, progressValue: 4, arrayBuffer: outputArrayBuffer } as ITransformation, [outputArrayBuffer]);
});

const doubleBackSlashRegExp = /(?<!^)\\{2,}/g;
const doubleForwardSlashRegExp = /\//g;

const item2XML = (item: IItem, sysRootPath: string, id: number[], xmlElements: string[], partIdLookup: Map<string, number>, includeEmpty: boolean = false) => {
  const childInstanceIds = (item.children ?? []).map(child => item2XML(child, sysRootPath, id, xmlElements, partIdLookup, includeEmpty)).filter(childId => childId !== null);

  if (!includeEmpty && !item.filePath && !childInstanceIds.length) return null;

  const instanceId = ++id[0];

  let filePath = item.filePath;
  let representationXML = ``;

  let location: string = null;

  if (filePath) {
    if (filePath.startsWith(`"`) && filePath.endsWith(`"`)) filePath = filePath.substring(1, filePath.length - 1);

    location = `${filePath.replace(`#`, sysRootPath).replace(doubleForwardSlashRegExp, `\\`).replace(doubleBackSlashRegExp, `\\`)}`;

    if (location.endsWith(`.cojt`)) {
      const fullFilePathSegments = location.split(`\\`);
      const fileName = fullFilePathSegments[fullFilePathSegments.length - 1];
      const fileNameSegments = fileName.split(`.`);
      const fileNameWithoutExtention = fileNameSegments.slice(0, fileNameSegments.length - 1).join(`.`);
      location += `\\${fileNameWithoutExtention}.jt`;
    }

    representationXML = `<Representation format="JT" location="${location}"/>`;
  }

  const instanceRefs = `${childInstanceIds.length ? `instanceRefs="${childInstanceIds.join(' ')}" ` : ``}`;

  let partId: number;

  if (location) {
    if (partIdLookup.has(location))
      partId = partIdLookup.get(location);

    else {
      partId = ++id[0];
      partIdLookup.set(location, partId);

      xmlElements.push(`<Part id="${partId}" name="${item.title}" type="solid">${representationXML}</Part>`);
    }
  }

  else {
    partId = ++id[0];
    xmlElements.push(`<Part id="${partId}" name="${item.title}" ${instanceRefs}type="assembly"/>`);
  }

  const transformXML = item.transformationMatrix ? `<Transform>${item.transformationMatrix}</Transform>` : null;
  const instanceXML = `<Instance id="${instanceId}" partRef="#${partId}"` + (transformXML ? `>${transformXML}</Instance>` : `/>`);

  xmlElements.unshift(instanceXML);

  return instanceId;
}

const ampRegExp = /&/g;
const ltRegExp = /</g;
const gtRegExp = />/g;
const aposRegExp = /'/g;
const quotRegExp = /"/g;

const cleanStringForXML = (inputString: string) => inputString
  //.replace(ampRegExp, `&amp;`)
  .replace(ltRegExp, `&lt;`)
  .replace(gtRegExp, `&gt;`)
  .replace(aposRegExp, `&apos;`)
  .replace(quotRegExp, `&quot;`);

const getTitle = (number: string, name: string) => cleanStringForXML([number, name]
  .filter(value => value)
  .map(value => value.startsWith(`"`) && value.endsWith(`"`) ? value.substring(1, value.length - 1) : value).join(` - `));

const eulerZYX2Matrix = (x: number, y: number, z: number, rx: number, ry: number, rz: number) => new Matrix4()
  .makeRotationFromEuler(new Euler(rx, ry, rz, `ZYX`))
  .setPosition(x, y, z).toArray().join(` `);