import { IItem } from './item';
import { encodeXML } from './utils';


export const items2XML = (items: Map<string, IItem>) => {
    const instanceGraphContent = new Array<string>();

    const partIdLookup = new Map<string, number>();

    const idTracker = [0];

    const rootRefs = Array.from(items.entries()).filter(([_, item]) => !item.parent).map(([id]) =>
        item2XML(items.get(id), idTracker, instanceGraphContent, partIdLookup));

    const currentTime = new Date();
    // eslint-disable-next-line max-len
    const timeString = `${currentTime.getHours().toString().padStart(2, `0`)}:${currentTime.getMinutes().toString().padStart(2, `0`)}:${currentTime.getSeconds().toString().padStart(2, `0`)}`;
    // eslint-disable-next-line max-len
    const dateString = `${currentTime.getFullYear()}-${(currentTime.getMonth() + 1).toString().padStart(2, `0`)}-${currentTime.getDate().toString().padStart(2, `0`)}`;

    return new TextEncoder().encode([
        `<?xml version="1.0" encoding="utf-8"?>`,
        // eslint-disable-next-line max-len
        `<PLMXML xmlns="http://www.plmxml.org/Schemas/PLMXMLSchema" xmlns:vis="PLMXMLTcVisSchema" time="${timeString}" schemaVersion="6" author="Qpops" date="${dateString}">`,
        `<ProductDef>`,
        `<UserData><UserValue title="__TC-VIS_NO_UNITS" type="boolean" value="true"/></UserData>`,
        `<InstanceGraph rootRefs="${rootRefs.join(` `)}">`,
        ...instanceGraphContent,
        `</InstanceGraph>`,
        `</ProductDef>`,
        `</PLMXML>`
    ].join(`\n`)).buffer;
};

const item2XML = (item: IItem, id: number[], xmlElements: string[], partIdLookup: Map<string, number>) => {
    const childInstanceIds = (item.children ?? [])
        .map(child => item2XML(child, id, xmlElements, partIdLookup))
        .filter(childId => childId !== null);

    const instanceId = ++id[0];

    const filePath = item.filePath;

    const location = filePath;

    const representationXML = location ? `<Representation format="JT" location="${location}"/>` : ``;

    const instanceRefs = `${childInstanceIds.length ? `instanceRefs="${childInstanceIds.join(' ')}" ` : ``}`;

    let partId: number;

    if (location) {
        if (partIdLookup.has(location)) {
            partId = partIdLookup.get(location);
        }

        else {
            partId = ++id[0];
            partIdLookup.set(location, partId);

            xmlElements.push(`<Part id="${partId}" name="${encodeXML(item.title)}" type="solid">${representationXML}</Part>`);
        }
    }

    else {
        partId = ++id[0];
        xmlElements.push(`<Part id="${partId}" name="${encodeXML(item.title)}" ${instanceRefs}type="assembly"/>`);
    }

    const transformXML = item.transformationMatrix ? `<Transform>${item.transformationMatrix.join(' ')}</Transform>` : null;
    const instanceXML = `<Instance id="${instanceId}" partRef="#${partId}"` + (transformXML ? `>${transformXML}</Instance>` : `/>`);

    xmlElements.unshift(instanceXML);

    return instanceId;
};
