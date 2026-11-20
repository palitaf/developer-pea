import {Injectable} from '@angular/core';import {HttpClient} from '@angular/common/http';
const API_BASE=(window as any).__APP_CONFIG__?.apiBase||'/api';
@Injectable({providedIn:'root'}) export class SheetsApiService{constructor(private http:HttpClient){} getMaterials(){return this.http.get(`${API_BASE}/sheets`)} getOrders(){return this.http.get(`${API_BASE}/sheets`,{params:{action:'getOrders'}})} post(payload:unknown){return this.http.post(`${API_BASE}/sheets`,payload)} }
