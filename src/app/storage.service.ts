import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  set(key: string, value: any) {
    if (value !== undefined)
      localStorage.setItem(key, JSON.stringify(value));
  }

  get<T>(key: string) {
    const value = localStorage.getItem(key);
    return value === null ? null : JSON.parse(value) as T;
  }
}
