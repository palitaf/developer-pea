import {inject} from '@angular/core';import {CanActivateFn,Router} from '@angular/router';import {AuthService} from './auth.service';
export const authGuard:CanActivateFn=()=>{const a=inject(AuthService);return a.loggedIn()?true:inject(Router).createUrlTree(['/login'])};
export const roleGuard=(...roles:string[]):CanActivateFn=>()=>{const a=inject(AuthService);return a.hasRole(...roles)?true:inject(Router).createUrlTree(['/'])};
