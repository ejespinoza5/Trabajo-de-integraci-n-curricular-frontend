import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';

@Injectable({
  providedIn: 'root'
})
export class HorarioEstudianteService {
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
obtenerHorarioEstudiante(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mi-horario`, {
      headers: this.getAuthHeaders()
    });
  }

  generarPdfEstudiante(): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/pdf-estudiante`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }
}
