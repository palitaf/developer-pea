import {Injectable,signal,computed} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {tap} from 'rxjs';
import {LoginResponse,User} from './models';
const API_BASE=(window as any).__APP_CONFIG__?.apiBase||'/api';
@Injectable({providedIn:'root'}) export class AuthService{
 private readonly key='pea.auth.token'; private readonly userKey='pea.auth.user';
 readonly user=signal<User|null>(this.readUser()); readonly loggedIn=computed(()=>!!this.token&&!!this.user());
 constructor(private http:HttpClient){if(this.token)this.http.get<{user:User}>(`${API_BASE}/auth/me`).subscribe({next:r=>this.setUser(r.user),error:()=>this.logout()});}
 private readUser():User|null{try{return JSON.parse(sessionStorage.getItem(this.userKey)||'null')}catch{return null}}
 private setUser(u:User){sessionStorage.setItem(this.userKey,JSON.stringify(u));this.user.set(u)}
 get token(){return sessionStorage.getItem(this.key)}
 login(username:string,password:string){return this.http.post<LoginResponse>(`${API_BASE}/auth/login`,{username,password}).pipe(tap(r=>{sessionStorage.setItem(this.key,r.token);this.setUser(r.user)}))}
 logout(){sessionStorage.removeItem(this.key);sessionStorage.removeItem(this.userKey);this.user.set(null)}
 hasRole(...roles:string[]){return roles.includes(this.user()?.role||'')}
}
