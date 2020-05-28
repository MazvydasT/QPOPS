/// <reference lib="webworker" />

interface IPMUpdateObject {
  type: string,
  attributes: Map<string, string>
}

interface IItem {
  title: string,
  children?: IItem[],
  transformationMatrix?: string,
  filePath?: string,

  pmUpdateObject: IPMUpdateObject
}

addEventListener('message', ({ data }) => {
  const textDecoder = new TextDecoder(`windows-1252`);

  const text = textDecoder.decode(data);

  const objectsData = text.split(`PM_UPDATE `);

  const items = new Map<string, IItem>();
  const supportingPMUpdateObjects = new Map<string, IPMUpdateObject>();

  for (let objectDataIndex = 0, objectsDataLength = objectsData.length; objectDataIndex < objectsDataLength; ++objectDataIndex) {
    const objectData = objectsData[objectDataIndex].trim();

    const attributeOpeningBracendex = objectData.indexOf(`{`);

    if (objectData.length === 0 || attributeOpeningBracendex < 0) continue;

    const [type, id] = objectData.substr(0, attributeOpeningBracendex).trim().split(` `);

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

    if (type !== "PmLayout" && (attributes.has(`children`) || attributes.has(`inputFlows`) || attributes.has(`prototype`)))
      items.set(id, {
        pmUpdateObject: pmUpdateObject,
        title: [attributes.get(`number`), attributes.get(`name`)]
          .filter(value => value !== undefined)
          .map(value => value.startsWith(`"`) && value.endsWith(`"`) ? value.substring(1, value.length - 1) : value).join(` - `)
      });

    else
      supportingPMUpdateObjects.set(id, pmUpdateObject);
  }

  for (let item of items.values()) {
    const attributes = item.pmUpdateObject.attributes;

    const children = attributes.get(`children`);
    const inputFlows = attributes.get(`inputFlows`);

    if (children !== undefined)
      item.children = children.split(`,`).map(childId => items.get(childId)).filter(item => item !== undefined);

    if (inputFlows !== undefined)
      item.children = inputFlows.split(`,`).map(flowId => items.get(supportingPMUpdateObjects.get(flowId)?.attributes.get(`parts`))).filter(item => item !== undefined);
  }
debugger;
  postMessage(items);
});