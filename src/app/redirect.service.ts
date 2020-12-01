import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class RedirectService {

  constructor(private httpClient: HttpClient) { }

  async redirectToLoginIfNeeded(force: boolean = false) {
    const redirectToLogin = await (force ? Promise.resolve(true) : this.httpClient.post(`_api/contextinfo`, null, {
      headers: { 'ngsw-bypass': `` },
      observe: `response`
    })
      .toPromise()
      .catch(response => response)
      .then(response => {
        const status: number = response.status;

        return status === 0 || status === 404 || (status >= 200 && status < 300) ? false : true;
      }));

    if (!redirectToLogin) {
      return false;
    }

    const registration = await navigator?.serviceWorker?.getRegistration();
    const unregistered = registration?.unregister() ?? false;

    if (unregistered) {
      window.location.reload();
    }

    return unregistered;
  }
}
