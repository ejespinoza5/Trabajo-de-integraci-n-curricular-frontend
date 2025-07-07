import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HorarioDocenteService {
private apiUrl = 'https://horarios.istla-sigala.edu.ec/api/v1';

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
}
