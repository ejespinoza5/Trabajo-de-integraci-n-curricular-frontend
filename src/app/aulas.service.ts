import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export interface Aulas {
  ID_AULA: number;
  NOMBRE_AULA: string;
  TIPO_AULA: string;
}

export interface CrearAula {
  nombre: string;
  tipo: string;
}


@Injectable({
  providedIn: 'root'
})
export class AulasService {
  private apiUrl = 'http://localhost:3000/v1';
  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  obtenerAulas(): Observable<Aulas[]> {
    return this.http.get<Aulas[]>(this.apiUrl+'/aulas', {
      headers: this.getAuthHeaders()
    });
  }

  obtenerAulasId(id: number): Observable<Aulas> {
    return this.http.get<Aulas>(`${this.apiUrl}/aulas/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  crearAulas(aula: CrearAula): Observable<Aulas> {
    return this.http.post<Aulas>(this.apiUrl + '/aulas', aula, {
      headers: this.getAuthHeaders()
    });
  }


  actualizarAulas(id: number, aula: Aulas): Observable<Aulas> {
    return this.http.put<Aulas>(`${this.apiUrl}/aulas/${id}`, aula, {
      headers: this.getAuthHeaders()
    });
  }

  eliminarProducto(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/aulas/${id}`, {
      headers: this.getAuthHeaders()
    });
  }


  


}
