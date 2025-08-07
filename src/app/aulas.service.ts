import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { API_BASE_URL } from './api-config';

export interface Aulas {
  mensaje: string;
  ID_AULA: number;
  NOMBRE_AULA: string;
  TIPO_AULA:number;
  NOMBRE_TIPO: string;
  ID_UBICACION?: number;
  NOMBRE_UBICACION?: string;
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
  tipo: string | null;
  ubicacion: string | null;
}

export interface ActualizarAula {
  nombre: string;
  tipo: number;
  ubicacion: number;
}

export interface AulaSimple {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root'
})
export class AulasService {
  private apiUrl = API_BASE_URL;
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


  actualizarAulas(id: number, aula: ActualizarAula): Observable<Aulas> {
    return this.http.put<Aulas>(`${this.apiUrl}/aulas/${id}`, aula, {
      headers: this.getAuthHeaders()
    });
  }

  eliminarAulas(id: number): Observable<any> {
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


  //Ubicaciones
  crearUbicacionAula(datos: { nombre: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/aulas-ubicacion`, datos, {
      headers: this.getAuthHeaders()
    });
  }

  actualizarUbicacionAulas(id: number, datos: { nombre: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/aulas-ubicacion/${id}`, datos, {
      headers: this.getAuthHeaders()
    });
  }

  eliminarUbicacionAulas(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/aulas-ubicacion/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  obtenerUbicacionesAulas(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/aulas-ubicacion`, {
      headers: this.getAuthHeaders()
    });
  }

  obtenerUbicacionesAulasId(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/aulas-ubicacion/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
}
