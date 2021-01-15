import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  constructor() { }

  getVersion = () => ({
    major: 1,
    minor: 13,
    patch: 1
  });
}
