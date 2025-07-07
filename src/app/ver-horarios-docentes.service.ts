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
  private apiUrl = 'https://horarios.istla-sigala.edu.ec/api/v1';

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
}
