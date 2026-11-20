export type Role='admin'|'manager'|'requester';
export interface User{id:number;username:string;displayName:string;role:Role;active:boolean}
export interface LoginResponse{token:string;user:User}
