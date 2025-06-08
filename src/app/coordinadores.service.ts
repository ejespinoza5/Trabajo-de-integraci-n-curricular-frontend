import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';


export interface Coordinadores {
  DOCUMENTO_USUARIOS: string;
  APELLIDOS_USUARIOS: string;
  NOMBRES_USUARIOS: string;
  CORREO_USUARIOS: string;
}

export interface Carreras{
  ID_CARRERAS: number;
  NOMBRE_CARRERAS: string;
}

export interface CoordinadorCrear {
  cedula_coordinador: string;
  nombre_coordinador: string;
  apellido_coordinador: string;
  idCarrera: number;
  correo_coordinador: string;
}

export interface CoordinadoresTodos {
  ID_COORDINADOR: number;
  CEDULA_COORDINADOR: string;
  NOMBRE_COORDINADOR: string;
  APELLIDO_COORDINADOR: string;
  ID_CARRERA_COORDINADOR: number;
  ID_ROL: number;
  NOMBRE_CARRERA: string;
}


@Injectable({
  providedIn: 'root'
})
export class CoordinadoresService {

  private apiUrl = 'http://localhost:3000/v1';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  obtenerNombresCoordinadores(): Observable<Coordinadores[]> {
    return this.http.get<Coordinadores[]>(this.apiUrl + '/coordinadores', {
      headers: this.getAuthHeaders()
    });
  }

  obtenerCoordinadorId(id: string): Observable<Coordinadores> {
    return this.http.get<Coordinadores>(`${this.apiUrl}/coordinadores/${id}`, {
      headers: this.getAuthHeaders()
    });
  }
  crearCoordinador(coordinador: CoordinadorCrear): Observable<Coordinadores> {
    return this.http.post<Coordinadores>(this.apiUrl + '/coordinadores', coordinador, {
      headers: this.getAuthHeaders()
    });
  }

  actualizarCoordinador(id: string, coordinador: CoordinadorCrear): Observable<Coordinadores> {
    return this.http.put<Coordinadores>(`${this.apiUrl}/coordinadores/${id}`, coordinador, {
      headers: this.getAuthHeaders()
    });
  }

  eliminarCoordinador(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/coordinadores/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  //obtener carreras
  obtenerCarreras(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl + '/carreras', {
      headers: this.getAuthHeaders()
    });
  }

  //Obtener todos coordinadores
  obtenerTodosCoordinadores(): Observable<CoordinadoresTodos[]> {
    return this.http.get<CoordinadoresTodos[]>(this.apiUrl + '/coordinadores-todos', {
      headers: this.getAuthHeaders()
    });
  }

}
