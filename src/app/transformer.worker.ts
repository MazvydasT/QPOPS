/// <reference lib="webworker" />

import { IInput } from "./input";

interface IPMUpdateObject {
  type: string,
  attributes: Map<string, string>
}

interface IItem {
  title: string,
  children?: IItem[],
  transformationMatrix?: string[],
  filePath?: string,

  pmUpdateObject: IPMUpdateObject
}

addEventListener('message', ({ data }: { data: IInput }) => {
  const textDecoder = new TextDecoder(`windows-1252`);

  const text = textDecoder.decode(data.arrayBuffer);

  const objectsData = text.split(`PM_UPDATE `);

  const items = new Map<string, IItem>();
  const supportingPMUpdateObjects = new Map<string, IPMUpdateObject>();

  let rootId: string = null;

  for (let objectDataIndex = 0, objectsDataLength = objectsData.length; objectDataIndex < objectsDataLength; ++objectDataIndex) {
    const objectData = objectsData[objectDataIndex].trim();

    const attributeOpeningBracendex = objectData.indexOf(`{`);

    if (objectData.length === 0 || attributeOpeningBracendex < 0) continue;

    const [type, id] = objectData.substr(0, attributeOpeningBracendex).trim().split(` `);

    if (rootId === null) rootId = id;

    const objectDataLines = objectData.substr(attributeOpeningBracendex + 1).trim().split(`;\n`);

    const attributes = new Map<string, string>();

    const pmUpdateObject = { type: type, attributes: attributes };

    for (let objectDataLineIndex = 0, objectDataLinesLength = objectDataLines.length; objectDataLineIndex < objectDataLinesLength; ++objectDataLineIndex) {
      const objectDataLine = objectDataLines[objectDataLineIndex];

      if (objectDataLine.length < 3) continue;

      const splitString = ` = `;

      const segments = objectDataLine.split(splitString);

      const key = segments[0].trim();
      let value = segments.slice(1).join(splitString).trim();

      if (value.length > 0 && value !== `""`)
        attributes.set(key, value);
    }

    if (type !== `PmLayout` && type !== `PmPartPrototype` && (attributes.has(`children`) || attributes.has(`inputFlows`) || attributes.has(`prototype`)))
      items.set(id, {
        pmUpdateObject: pmUpdateObject,
        title: cleanStringForXML([attributes.get(`number`), attributes.get(`name`)]
          .filter(value => value !== undefined)
          .map(value => value.startsWith(`"`) && value.endsWith(`"`) ? value.substring(1, value.length - 1) : value).join(` - `))
      });

    else
      supportingPMUpdateObjects.set(id, pmUpdateObject);
  }

  for (let item of items.values()) {
    const attributes = item.pmUpdateObject.attributes;

    const children = attributes.get(`children`);
    const inputFlows = attributes.get(`inputFlows`);
    const prototype = attributes.get(`prototype`);
    const layout = attributes.get(`layout`);

    if (children !== undefined)
      item.children = children.split(`,`).map(childId => items.get(childId)).filter(item => item !== undefined);

    if (inputFlows !== undefined)
      item.children = inputFlows.split(`,`).map(flowId => items.get(supportingPMUpdateObjects.get(flowId)?.attributes.get(`parts`))).filter(item => item !== undefined);

    if (prototype !== undefined)
      item.filePath = supportingPMUpdateObjects.get(
        supportingPMUpdateObjects.get(
          supportingPMUpdateObjects.get(prototype)?.attributes.get(`threeDRep`)
        )?.attributes.get(`file`)
      )?.attributes.get(`fileName`);

    if (layout) {
      const layoutObject = supportingPMUpdateObjects.get(layout);
      const location = layoutObject?.attributes.get(`location`) ?? `0,0,0`;
      const rotation = layoutObject?.attributes.get(`rotation`) ?? `0,0,0`;

      throw `not finished`;
    }

    item.pmUpdateObject = null;
  }

  const instanceGraphContent = new Array<string>();

  const rootRefs = item2XML(items.get(rootId), data.sysRootPath, [1], instanceGraphContent, data?.options?.includeBranchesWithoutCAD ?? false);

  const currentTime = new Date();
  const timeString = `${currentTime.getHours().toString().padStart(2, `0`)}:${currentTime.getMinutes().toString().padStart(2, `0`)}:${currentTime.getSeconds().toString().padStart(2, `0`)}`;
  const dateString = `${currentTime.getFullYear()}-${(currentTime.getMonth() + 1).toString().padStart(2, `0`)}-${currentTime.getDate().toString().padStart(2, `0`)}`;

  const outputDocumentLines = [
    `<?xml version="1.0" encoding="utf-8"?>`,
    `<PLMXML xmlns="http://www.plmxml.org/Schemas/PLMXMLSchema" xmlns:vis="PLMXMLTcVisSchema" time="${timeString}" schemaVersion="6" author="Qpops" date="${dateString}">`,
    `<ProductDef>`,
    `<InstanceGraph rootRefs="${rootRefs}">`,
    ...instanceGraphContent,
    `</InstanceGraph>`,
    `</ProductDef>`,
    `</PLMXML>`
  ];

  const outputArrayBuffer = new TextEncoder().encode(outputDocumentLines.join(``)).buffer;

  postMessage(outputArrayBuffer, [outputArrayBuffer]);
});

const doubleBackSlashRegExp = /(?<!:)\\{2,}/g;
const doubleForwardSlashRegExp = /\//g;

const item2XML = (item: IItem, sysRootPath: string, id: number[], xmlElements: string[], includeEmpty: boolean = false) => {
  const childInstanceIds = (item.children ?? []).map(child => item2XML(child, sysRootPath, id, xmlElements)).filter(childId => childId !== null);

  if (!includeEmpty && !item.filePath && !childInstanceIds.length)
    return null;

  const idValue = ++id[0];
  const instanceId = `${idValue}i`;
  const viewId = `${idValue}v`;

  const instanceRefs = `${childInstanceIds.length ? `instanceRefs="${childInstanceIds.join(' ')}" ` : ``}`;

  const instanceXML = `<ProductInstance id="${instanceId}" partRef="#${viewId}"/>`;

  let filePath = item.filePath;
  let representationXML = ``;

  if (filePath) {
    if (filePath.startsWith(`"`) && filePath.endsWith(`"`)) filePath = filePath.substring(1, filePath.length - 1);

    let location = `${filePath.replace(`#`, sysRootPath).replace(doubleForwardSlashRegExp, `\\`).replace(doubleBackSlashRegExp, `\\`)}`;

    if (location.endsWith(`.cojt`)) {
      const fullFilePathSegments = location.split(`\\`);
      const fileName = fullFilePathSegments[fullFilePathSegments.length - 1];
      const fileNameSegments = fileName.split(`.`);
      const fileNameWithoutExtention = fileNameSegments.slice(0, fileNameSegments.length - 1).join(`.`);
      location += `\\${fileNameWithoutExtention}.jt`;
    }

    representationXML = `<Representation format="JT" location="${location}"/>`;
  }

  const viewXML = `<ProductRevisionView id="${viewId}" name="${item.title}" ${instanceRefs}type="${!filePath ? `assembly` : `solid`}">${representationXML}</ProductRevisionView>`

  xmlElements.unshift(instanceXML, viewXML);

  return instanceId;
}

const ampRegExp = /&/g;
const ltRegExp = /</g;
const gtRegExp = />/g;
const aposRegExp = /'/g;
const quotRegExp = /"/g;

const cleanStringForXML = (inputString: string) => inputString
  .replace(ampRegExp, `&amp;`)
  .replace(ltRegExp, `&lt;`)
  .replace(gtRegExp, `&gt;`)
  .replace(aposRegExp, `&apos;`)
  .replace(quotRegExp, `&quot;`);