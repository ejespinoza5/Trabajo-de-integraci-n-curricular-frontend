import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Periodo {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class VerHorariosDocentesService {
  private apiUrl = 'http://localhost:3000/v1';

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

  //obtener carrera por periodo
  obtenerCarrerasPorPeriodo(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/horarios-carreras-general/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
  //obtener docente por periodo y carrera
  obtenerDocentesPorPeriodoYCarrera(idPeriodo: number, idCarrera: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/horarios-docentes-general/${idPeriodo}/${idCarrera}`, {
      headers: this.getAuthHeaders()
    });
  }
  obtenerHorariosPorPeriodoCarreraDocente(idPeriodo: number, idCarrera: number, idDocente: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/horarios-docentes-general/${idPeriodo}/${idCarrera}/${idDocente}`, {
      headers: this.getAuthHeaders()
    });
  }
}
