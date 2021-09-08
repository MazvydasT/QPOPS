import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  constructor() { }

  getVersion = () => ({
    major: 1,
    minor: 17,
    patch: 0
  });
}
