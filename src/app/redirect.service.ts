import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RedirectService {

  constructor(private httpClient: HttpClient) { }

  private isOfflineOrRedirected(url: string) {
    return this.httpClient.head(url, {
      headers: { 'ngsw-bypass': `` },
      observe: `response`
    }).pipe(
      catchError(err => of(true)),
      map(isOfflineOrRedirected => isOfflineOrRedirected === true)
    );
  }

  redirectToLoginIfNeeded(force: boolean = false) {
    return (force ? Promise.resolve(true) : this.httpClient.post(`_api/contextinfo`, null, {
      headers: { 'ngsw-bypass': `` },
      observe: `response`
    })
      .toPromise()
      .catch(response => response)
      .then(response => {
        const status: number = response.status;

        return status === 0 || status === 404 || (status >= 200 && status < 300) ? false : true;
      }))
      .then(redirectToLogin => {
        if (!redirectToLogin)
          return false;
          
        return navigator?.serviceWorker?.getRegistration()
          .then(registration => registration?.unregister() ?? false)
          .then(unregistered => {
            if (unregistered)
              window.location.reload();

            return unregistered;
          });
      })
  }
}
