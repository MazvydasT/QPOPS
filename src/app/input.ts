import { ITransformationConfiguration } from './transformation-configuration';

export interface IInput {
    arrayBuffer: ArrayBuffer;
    configuration: ITransformationConfiguration;
    additionalAttributes?: Map<string, string>;
}
