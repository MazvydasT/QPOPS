/* eslint-disable @typescript-eslint/naming-convention */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, from, fromEvent, Observable, pipe } from 'rxjs';
import { delay, distinctUntilChanged, filter, map, shareReplay, take, tap, timeout } from 'rxjs/operators';

const MS_COONECTION_STATUS_DELAY = 6000;

enum ConnectionStatus {
  Waiting,
  NoNetwork,
  NotLoggedIn,
  LoggedIn
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  readonly ConnectionStatus = ConnectionStatus;

  private connectionStatusSubject = new BehaviorSubject(ConnectionStatus.Waiting);
  private $connectionStatus = this.connectionStatusSubject.pipe(
    distinctUntilChanged(),
    shareReplay(1)
  );

  private startTime = Date.now();

  constructor(
    private httpClient: HttpClient
  ) {
    /*if (!this.isTopWindow()) {
      top.postMessage(`done`, location.origin);
    }

    else {
      addEventListener(`message`, event => {
        if (event.origin === location.origin) {
          if (event.data === `done`) {
            location.reload();
          }
        }
      }, false);
    }*/
  }

  /*isTopWindow() {
    return window === window.top;
  }*/

  getConnectionStatus() {
    setTimeout(() => {
      this.httpClient.options(``, {
        headers: { 'ngsw-bypass': `` },
        observe: `response`
      })
        .toPromise()
        .catch(response => response)
        .then(response => {
          const status: number = response.status;

          let connectionStatus: ConnectionStatus;

          if (status === 0) {
            connectionStatus = ConnectionStatus.NoNetwork;
          }

          else if (status >= 200 && status < 300) {
            connectionStatus = ConnectionStatus.LoggedIn;
          }

          else {
            connectionStatus = ConnectionStatus.NotLoggedIn;
          }

          this.connectionStatusSubject.next(connectionStatus);
        });
    }, Math.max(0, MS_COONECTION_STATUS_DELAY - (Date.now() - this.startTime)));

    return this.$connectionStatus;
  }

  logIn() {
    /*this.overlayService.open({
      link: this.domSanitizer.bypassSecurityTrustResourceUrl(`.?ngsw-bypass`),
      overlayContentType: OverlayContentType.IFrameLink
    });*/

    location.href = `.?ngsw-bypass`;
  }
}
