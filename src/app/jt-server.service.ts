import { Injectable } from '@angular/core';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { distinctUntilChanged, flatMap, shareReplay, map } from 'rxjs/operators';
import { webSocket } from 'rxjs/webSocket';
import { minInt32, maxInt32, uint8ArrayToInt32, int32ToUint8Array } from './utils';

interface IMessage {
  Id: number;
  Command?: ICommand;
  Data?: ArrayBuffer;
  Error?: string;
}

interface ICommand {
  Name: string;
  Arguments?: { [key: string]: string };
  BinaryData?: Uint8Array[];
  BinaryDataLengths?: number[];
}

const serverURL = `ws://localhost:9876/`;
const connectionRetryDelay = 5000;

@Injectable({
  providedIn: 'root'
}) export class JtServerService {
  private textDecoder = new TextDecoder();
  private textEncoder = new TextEncoder();

  private webSocketConnection = webSocket<IMessage>({
    url: serverURL,
    binaryType: 'arraybuffer',
    serializer: message => {
      const binaryData = message.Command?.BinaryData ?? [];

      if (binaryData.length) {
        message.Command.BinaryDataLengths = binaryData.map(value => value.byteLength);
        message.Command.BinaryData = undefined;
      }

      const messageByteArray = this.textEncoder.encode(JSON.stringify(message));

      return new Uint8Array([
        ...int32ToUint8Array(messageByteArray.length),
        ...messageByteArray,
        ...binaryData.map(byteArray => [...byteArray]).flat()
      ]);
    },
    deserializer: ({ data: messageData }: { data: ArrayBuffer }) => {
      const id = uint8ArrayToInt32(new Uint8Array(messageData.slice(0, 4)));

      const isError = !!new Uint8Array(messageData.slice(4, 5))[0];
      const data = messageData.slice(5);

      const message: IMessage = {
        Id: id
      };

      if (isError) {
        message.Error = this.textDecoder.decode(data);
      }

      else {
        message.Data = data;
      }

      return message;
    }
  });

  private serverVersion = new BehaviorSubject(null);
  public version = this.serverVersion.pipe(distinctUntilChanged(), shareReplay(1));
  public online = this.version.pipe(flatMap(v => of(!!v)));

  private messageIdTracker = minInt32; // Number.MIN_SAFE_INTEGER;

  private messageTracker = new Map<number, Subject<ArrayBuffer>>();

  constructor() {
    this.subscribeToWebSocket();
  }

  private subscribeToWebSocket(delay: number = 0) {
    setTimeout(() => {
      this.webSocketConnection.subscribe(
        message => this.handleIncommingMessage(message),
        () => this.handleErrorOrCompletion(),
        () => this.handleErrorOrCompletion()
      );

      this.getVersion();
    }, delay);
  }

  private handleIncommingMessage(message: IMessage) {
    const messageId = message.Id;

    const responseSubject = this.messageTracker.get(messageId);

    if (responseSubject) {
      if (message.Error) {
        responseSubject.error(new Error(message.Error));
      }

      else {
        responseSubject.next(message.Data);
      }
    }

    this.messageTracker.delete(messageId);
  }

  private handleErrorOrCompletion() {

    this.serverVersion.next(null);

    this.clearOutstandingMessages();

    this.subscribeToWebSocket(connectionRetryDelay);
  }

  private clearOutstandingMessages() {
    const messageIds = Array.from(this.messageTracker.keys());
    const messageTracker = this.messageTracker;

    for (const messageId of messageIds) {
      messageTracker.get(messageId)?.error(new Error(`Connection to server lost.`));
      messageTracker.delete(messageId);
    }
  }

  private sendCommand(command: ICommand) {
    const messageId = this.messageIdTracker++;

    if (messageId === maxInt32 /*Number.MAX_SAFE_INTEGER*/) {
      this.messageIdTracker = minInt32; // Number.MIN_SAFE_INTEGER;
    }

    const responseSubject = new Subject<ArrayBuffer>();

    this.messageTracker.set(messageId, responseSubject);

    this.webSocketConnection.next({
      Id: messageId,
      Command: command
    });

    return responseSubject.asObservable();
  }

  private getVersion() {
    this.sendCommand({ Name: `getVersion` }).toPromise()
      .catch(() => null as string)
      .then(v => this.serverVersion.next(v));
  }

  public ajt2jt(ajtData: ArrayBuffer, fileName: string, ajt2jtConverterPath: string) {
    return this.sendCommand({
      Name: `convertAjtToJt`,
      Arguments: {
        ajt2jt: ajt2jtConverterPath,
        fileName
        // ajtSource
      },
      BinaryData: [
        new Uint8Array(ajtData)
      ]
    });
  }
}
