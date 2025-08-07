import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api-config';

export interface Periodo {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class VerHorariosDocentesService {
  private apiUrl = API_BASE_URL;

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  obtenerPeriodos(): Observable<Periodo[]> {
    return this.http.get<Periodo[]>(this.apiUrl + '/horarios-periodos-general', {
      headers: this.getAuthHeaders()
    });
  }


  //obtener docente por periodo
  obtenerDocentesPorPeriodoYCarrera(idPeriodo: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/horarios-docentes-general/${idPeriodo}`, {
      headers: this.getAuthHeaders()
    });
  }
  obtenerHorariosPorPeriodoCarreraDocente(idPeriodo: number, idDocente: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/horarios-docentes-general/${idPeriodo}/${idDocente}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Método para generar PDF de horarios de docentes
  generarPDFHorariosDocente(idPeriodo: number, idDocente: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/pdf-docente-por-id/${idPeriodo}/${idDocente}`, {
      headers: this.getAuthHeaders(),
      responseType: 'blob'
    });
  }
 
}
