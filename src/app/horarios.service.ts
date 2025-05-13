import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  catchError,
  Observable,
  throwError,
  shareReplay,
  map,
  tap,
  BehaviorSubject,
  of,
  timer,
  switchMap,
  takeUntil,
  Subject
} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HorariosService {
  private apiUrl = 'http://localhost:3000/v1';

  // Cache storage
  private cacheMap = new Map<string, any>();
  private cacheDuration = 5 * 60 * 1000; // 5 minutes in milliseconds

  // Request cancellation
  private cancelRequestsSubject = new Subject<void>();

  // Observable store for common data
  private periodosSubject = new BehaviorSubject<any[]>([]);
  private diasSubject = new BehaviorSubject<any[]>([]);

  constructor(private http: HttpClient) {
    // Prefetch commonly used data when service initializes
    this.prefetchCommonData();
  }

  private prefetchCommonData(): void {
    // Prefetch periods and days which are likely to be used often
    this.fetchPeriodos().subscribe();
    this.fetchDias().subscribe();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private getFromCache<T>(key: string): T | null {
    const cachedItem = this.cacheMap.get(key);
    if (cachedItem && cachedItem.expiry > Date.now()) {
      return cachedItem.data;
    }
    return null;
  }

  private setCache<T>(key: string, data: T): void {
    const expiry = Date.now() + this.cacheDuration;
    this.cacheMap.set(key, { data, expiry });
  }

  private clearCache(): void {
    this.cacheMap.clear();
  }

  // Helper method to handle API requests with caching
  private cachedRequest<T>(url: string, forceRefresh = false): Observable<T> {
    if (!forceRefresh) {
      const cachedData = this.getFromCache<T>(url);
      if (cachedData) {
        return of(cachedData);
      }
    }

    return this.http.get<T>(url, {
      headers: this.getAuthHeaders()
    }).pipe(
      takeUntil(this.cancelRequestsSubject),
      tap(data => this.setCache(url, data)),
      shareReplay(1),
      catchError(err => this.handleError(err))
    );
  }

  // Cancel all pending requests
  cancelPendingRequests(): void {
    this.cancelRequestsSubject.next();
  }

  // Reset cache on user actions like logout
  resetCache(): void {
    this.clearCache();
    this.periodosSubject.next([]);
    this.diasSubject.next([]);
  }

  // Fetch periodos and update the BehaviorSubject
  private fetchPeriodos(): Observable<any[]> {
    const url = `${this.apiUrl}/periodos`;
    return this.cachedRequest<any[]>(url).pipe(
      tap(periodos => this.periodosSubject.next(periodos))
    );
  }

  // Fetch dias and update the BehaviorSubject
  private fetchDias(): Observable<any[]> {
    const url = `${this.apiUrl}/dias`;
    return this.cachedRequest<any[]>(url).pipe(
      tap(dias => this.diasSubject.next(dias))
    );
  }

  // Public methods
  obtenerPeriodos(forceRefresh = false): Observable<any[]> {
    if (forceRefresh || this.periodosSubject.value.length === 0) {
      return this.fetchPeriodos();
    }
    return this.periodosSubject.asObservable();
  }

  obtenerDocentes(idPeriodo: number, forceRefresh = false): Observable<any[]> {
    const url = `${this.apiUrl}/docentes/${idPeriodo}`;
    return this.cachedRequest<any[]>(url, forceRefresh);
  }

  obtenerAsignaturas(idPeriodo: number, idDocente: number, forceRefresh = false): Observable<any[]> {
    const url = `${this.apiUrl}/asignaturas/${idPeriodo}/${idDocente}`;
    return this.cachedRequest<any[]>(url, forceRefresh);
  }

  obtenerDias(forceRefresh = false): Observable<any[]> {
    if (forceRefresh || this.diasSubject.value.length === 0) {
      return this.fetchDias();
    }
    return this.diasSubject.asObservable();
  }

  obtenerCarreras(idAsignatura: number, forceRefresh = false): Observable<any[]> {
    const url = `${this.apiUrl}/carrera/${idAsignatura}`;
    return this.cachedRequest<any[]>(url, forceRefresh);
  }

  obtenerNiveles(idAsignatura: number, forceRefresh = false): Observable<any[]> {
    const url = `${this.apiUrl}/nivel/${idAsignatura}`;
    return this.cachedRequest<any[]>(url, forceRefresh);
  }

  asignarHorario(horarioData: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/horarios`,
      horarioData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      takeUntil(this.cancelRequestsSubject),
      tap(() => {
        // Invalidate relevant caches on successful creation
        this.invalidateRelatedCaches(horarioData.ID_PERIODO);
      }),
      catchError(this.handleError)
    );
  }

  // Helper to invalidate related caches after mutations
  private invalidateRelatedCaches(idPeriodo: number): void {
    // Clear specific cache entries related to the affected period
    const keysToRemove: string[] = [];

    this.cacheMap.forEach((_, key) => {
      if (key.includes(`/horarios-periodo/${idPeriodo}`) ||
          key.includes('/horarios-completo')) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach(key => this.cacheMap.delete(key));
  }

  obtenerDetalleHorario(idHorario: number): Observable<any> {
    const url = `${this.apiUrl}/horarios-completo/${idHorario}`;
    return this.cachedRequest<any>(url);
  }

  obtenerHorariosPorPeriodo(idPeriodo: number, forceRefresh = false): Observable<any[]> {
    const url = `${this.apiUrl}/horarios-periodo/${idPeriodo}`;
    return this.cachedRequest<any[]>(url, forceRefresh);
  }

  obtenerTodosHorarios(forceRefresh = false): Observable<any[]> {
    const url = `${this.apiUrl}/horarios-completo`;
    return this.cachedRequest<any[]>(url, forceRefresh);
  }

  actualizarHorario(horarioData: any): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/horarios/${horarioData.ID_HORARIO}`,
      horarioData,
      { headers: this.getAuthHeaders() }
    ).pipe(
      takeUntil(this.cancelRequestsSubject),
      tap(() => {
        // Invalidate relevant caches on successful update
        this.invalidateRelatedCaches(horarioData.ID_PERIODO);

        // Clear cache for the specific horario detail
        const detailUrl = `${this.apiUrl}/horarios-completo/${horarioData.ID_HORARIO}`;
        this.cacheMap.delete(detailUrl);
      }),
      catchError(this.handleError)
    );
  }

  eliminarHorario(idHorario: number): Observable<any> {
    // First get the horario details to know which period to invalidate
    return this.obtenerDetalleHorario(idHorario).pipe(
      switchMap(horarioDetalle => {
        // Now we have the horario details with period information
        const idPeriodo = horarioDetalle.ID_PERIODO;

        // Proceed with deletion
        return this.http.delete<any>(
          `${this.apiUrl}/horarios/${idHorario}`,
          { headers: this.getAuthHeaders() }
        ).pipe(
          takeUntil(this.cancelRequestsSubject),
          tap(() => {
            // Invalidate relevant caches on successful deletion
            if (idPeriodo) {
              this.invalidateRelatedCaches(idPeriodo);
            } else {
              // If we couldn't determine the period, clear all horario caches
              this.cacheMap.forEach((_, key) => {
                if (key.includes('/horarios')) {
                  this.cacheMap.delete(key);
                }
              });
            }

            // Clear cache for the specific horario detail
            const detailUrl = `${this.apiUrl}/horarios-completo/${idHorario}`;
            this.cacheMap.delete(detailUrl);
          })
        );
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ha ocurrido un error en el servidor';

    if (error.status === 0) {
      errorMessage = 'No hay conexión con el servidor. Verifique su conexión a internet.';
    } else if (error.status === 409) {
      errorMessage = error.error.message || 'Conflicto con los datos existentes';
    } else if (error.status === 400) {
      errorMessage = 'Datos inválidos: ' + (error.error.message || 'Verifique la información ingresada');
    } else if (error.status === 401) {
      errorMessage = 'Sesión expirada. Inicie sesión nuevamente.';
      // You might want to trigger a redirect to login here
    } else if (error.error && error.error.message) {
      errorMessage = error.error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
