import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { API_BASE_URL } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = API_BASE_URL;

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  constructor(private http: HttpClient) { }
  login(correo: string, cedula: string): Observable<any> {
    const body = { correo, cedula };
    return this.http.post(this.apiUrl + '/login', body);
  }


  // Nuevo método para obtener el ID del usuario del token
  ObtenerIdToken(): number | null {
    const token = this.obtenerToken();
    if (!token) return null;

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;

      const payload = JSON.parse(atob(tokenParts[1]));
      return payload.id;
    } catch (error) {
      console.error('Error al decodificar el token', error);
      return null;
    }
  }

  ObtenerIdRol(): number | null {
    const token = this.obtenerToken();
    if (!token) return null;

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;

      const payload = JSON.parse(atob(tokenParts[1]));
      return payload.rol;
    } catch (error) {
      console.error('Error al decodificar el token', error);
      return null;
    }
  }

  obtenerIdCarrera(): number | null {
  if (this.ObtenerIdRol() === 17) {
    const token = this.obtenerToken();
    if (!token) return null;

    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) return null;

      const payload = JSON.parse(atob(tokenParts[1]));
      return payload.carrera;
    } catch (error) {
      console.error('Error al decodificar el token', error);
      return null;
    }
  }

  return null; // En caso de que el rol no sea 17
}


  guardarToken(token: string) {
    localStorage.setItem('token', token);
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  cerrarSesion() {
    localStorage.removeItem('token');
    sessionStorage.clear();
  }


  getUsuarioById(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/usuario/${id}`, { headers });
  }

  getCoordinadorById(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/coordinador/${id}`, { headers });
  }
  getRolNombre(): string | null {
    const rol = this.ObtenerIdRol();
    if (rol === null) return null;

    switch (rol) {
      case 17: return 'COORDINADOR';
      case 13: return 'SUPERADMINISTRADOR';
      case 14: return 'ESTUDIANTE';
      case 15: return 'DOCENTE';
      case 12: return 'ADMINISTRADOR';
      default: return null;
    }
  }
  tieneRol(rolesPermitidos: string[]): boolean {
    const rolNombre = this.getRolNombre();
    return rolNombre ? rolesPermitidos.includes(rolNombre) : false;
  }

  dashboard(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/dashboard`, { headers });
  }




}
