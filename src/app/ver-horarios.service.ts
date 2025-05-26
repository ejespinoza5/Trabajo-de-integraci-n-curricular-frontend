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
export class VerHorariosService {

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
    return this.http.get<Periodo[]>(this.apiUrl + '/horarios-periodos', {
      headers: this.getAuthHeaders()
    });
  }

  //obtener carrera por periodo
  obtenerCarrerasPorPeriodo(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/horarios-carreras/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
  //obtener cursos porperiodo y carrera
  obtenerCursosPorPeriodoYCarrera(idPeriodo: number, idCarrera: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/horarios-cursos/${idPeriodo}/${idCarrera}`, {
      headers: this.getAuthHeaders()
    });
  }
  obtenerHorariosPorPeriodoCarreraCurso(idPeriodo: number, idCarrera: number, idCurso: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/horarios/${idPeriodo}/${idCarrera}/${idCurso}`, {
      headers: this.getAuthHeaders()
    });
  }


}
