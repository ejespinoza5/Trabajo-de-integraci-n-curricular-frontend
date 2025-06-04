import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { Roles } from './roles';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = localStorage.getItem('token');

    if (!token) {
      this.router.navigate(['/login']);
      return false;
    }

    try {
      const payload: any = jwtDecode(token);
      const rolNumerico: number = payload.rol;
      const rolUsuario: string = Roles[rolNumerico];

      if (!rolUsuario) {
        this.router.navigate(['/login']);
        return false;
      }

      const rolesPermitidos = route.data['roles'] as string[] | undefined;

      if (!rolesPermitidos || rolesPermitidos.includes(rolUsuario)) {
        return true;
      }

      this.router.navigate(['/inicio']);
      return false;
    } catch (error) {
      console.error('Error al decodificar el token', error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
