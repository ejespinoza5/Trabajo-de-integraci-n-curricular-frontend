import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/v1';

  constructor(private http: HttpClient) { }
  login(correo: string, cedula: string): Observable<any> {
    const body = { correo, cedula };
    return this.http.post(this.apiUrl+'/login', body);
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

  guardarToken(token: string) {
    localStorage.setItem('token', token);
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  cerrarSesion() {
    localStorage.removeItem('token');
  }


   getUsuarioById(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    return this.http.get(`${this.apiUrl}/usuario/${id}`, { headers });
  }
}
