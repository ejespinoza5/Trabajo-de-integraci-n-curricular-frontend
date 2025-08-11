import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class HorarioDocenteService {
private apiUrl = API_BASE_URL;

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  //obtener horario
obtenerHorarioDocente(): Observable<any[]> {
    const periodoId = this.authService.obtenerPeriodoId();
    const docenteId = this.authService.obtenerIdDocente();
    
    if (!periodoId || !docenteId) {
      throw new Error('No se pudo obtener el periodoId o docenteId del token');
    }

    return this.http.get<any[]>(`${this.apiUrl}/horario-docente?periodoId=${periodoId}&docenteId=${docenteId}`, {
      headers: this.getAuthHeaders()
    });
  }
   //Obtener pdf docente
   generarPdfDocente(): Observable<Blob> {
    const periodoId = this.authService.obtenerPeriodoId();
    const docenteId = this.authService.obtenerIdDocente();
    
    if (!periodoId || !docenteId) {
      throw new Error('No se pudo obtener el periodoId o docenteId del token');
    }

    return this.http.get(`${this.apiUrl}/pdf-docente?periodoId=${periodoId}&docenteId=${docenteId}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }
}
