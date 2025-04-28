import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  guardarToken(token: string) {
    localStorage.setItem('token', token);
  }

  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  cerrarSesion() {
    localStorage.removeItem('token');
  }
}
