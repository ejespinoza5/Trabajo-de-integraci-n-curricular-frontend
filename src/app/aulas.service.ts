import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';

export interface Aulas {
  mensaje: string;
  ID_AULA: number;
  NOMBRE_AULA: string;
  TIPO_AULA:number;
  NOMBRE_TIPO: string;
}
export interface TipoAula {
  ID_TIPO: number;
  NOMBRE_TIPO: string;
}
export interface AulaCreatedResponse {
  id: {
    mensaje: string;
    id: number;
  };
  nombre: string;
  tipo: string;
}
export interface CrearAula {
  nombre: string;
  tipo: string;
}

export interface Aulas {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class AulasService {
  private apiUrl = 'https://horarios.istla-sigala.edu.ec/api/v1';
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

  crearAulas(aula: CrearAula): Observable<AulaCreatedResponse> {
    return this.http.post<AulaCreatedResponse>(this.apiUrl + '/aulas', aula, {
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

   obtenerTipoAulas(): Observable<Aulas[]> {
    return this.http.get<Aulas[]>(this.apiUrl + '/tipos-aula', {
      headers: this.getAuthHeaders()
    });
  }

  obtenerTiposAulasId(id: number): Observable<Aulas> {
    return this.http.get<Aulas>(`${this.apiUrl}/tipos-aula/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  crearTipoAula(datos: { nombre: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/tipos-aula`, datos, {
      headers: this.getAuthHeaders()
    });
  }

  actualizarTipoAulas(id: number, datos: { nombre: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/tipos-aula/${id}`, datos, {
      headers: this.getAuthHeaders()
    });
  }

  eliminarTipoAulas(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tipos-aula/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

}
