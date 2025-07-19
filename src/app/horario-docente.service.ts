import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class HorarioDocenteService {
private apiUrl = API_BASE_URL;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  //obtener horario
obtenerHorarioDocente(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/horario-docente`, {
      headers: this.getAuthHeaders()
    });
  }
   //Obtener pdf docente
   generarPdfDocente(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/pdf-docente`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }
}
