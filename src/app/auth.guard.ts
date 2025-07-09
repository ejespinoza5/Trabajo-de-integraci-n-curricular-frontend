import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { Roles } from './roles';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  canActivate(route: ActivatedRouteSnapshot): boolean {
    const token = localStorage.getItem('token');

    if (!token) {
      window.location.href = 'https://horarios.istla-sigala.edu.ec/';
      return false;
    }

    try {
      const payload: any = jwtDecode(token);
      const rolNumerico: number = payload.rol;
      const rolUsuario: string = Roles[rolNumerico];

      if (!rolUsuario) {
        window.location.href = 'https://horarios.istla-sigala.edu.ec/';
        return false;
      }

      const rolesPermitidos = route.data['roles'] as string[] | undefined;

      if (!rolesPermitidos || rolesPermitidos.includes(rolUsuario)) {
        return true;
      }

      window.location.href = 'https://horarios.istla-sigala.edu.ec/';
      return false;
    } catch (error) {
      console.error('Error al decodificar el token', error);
      window.location.href = 'https://horarios.istla-sigala.edu.ec/';
      return false;
    }
  }
}
