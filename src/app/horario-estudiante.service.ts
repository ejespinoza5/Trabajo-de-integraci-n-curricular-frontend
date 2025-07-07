import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HorarioEstudianteService {
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
obtenerHorarioEstudiante(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/mi-horario`, {
      headers: this.getAuthHeaders()
    });
  }
}
