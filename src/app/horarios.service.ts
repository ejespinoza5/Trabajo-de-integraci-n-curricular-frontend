import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class HorariosService {

  private apiUrl = 'http://localhost:3000/v1';
    constructor(private http: HttpClient) { }

    private getAuthHeaders(): HttpHeaders {
      const token = localStorage.getItem('token');
      return new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
    }

    obtenerPeriodos() {
      return this.http.get<any[]>(this.apiUrl+'/periodos',{
        headers: this.getAuthHeaders()
      });
    }

    obtenerDocentes(idPeriodo: number) {
      return this.http.get<any[]>(this.apiUrl+`/docentes/${idPeriodo}`,{
        headers: this.getAuthHeaders()
      });
    }

    obtenerAsignaturas(idPeriodo: number, idDocente: number) {
      return this.http.get<any[]>(this.apiUrl+`/asignaturas/${idPeriodo}/${idDocente}`,{
        headers: this.getAuthHeaders()
      });
    }

    obtenerDias() {
      return this.http.get<any[]>(this.apiUrl+'/dias',{
        headers: this.getAuthHeaders()
      });
    }

    obtenerCarreras(idAsignatura: number) {
      return this.http.get<any[]>(this.apiUrl+`/carrera/${idAsignatura}`,{
        headers: this.getAuthHeaders()
      });
    }

    obtenerNiveles(idAsignatura: number) {
      return this.http.get<any[]>(this.apiUrl+`/nivel/${idAsignatura}`,{
        headers: this.getAuthHeaders()
      });
      
    }

}
