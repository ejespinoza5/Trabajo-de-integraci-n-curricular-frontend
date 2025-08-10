import { Component, OnInit, HostListener, ChangeDetectorRef, NgZone } from '@angular/core';
import { Carreras, Coordinadores, CoordinadoresService, CoordinadoresTodos } from '../coordinadores.service';
import { NotificationService } from '../notificacion.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-coordinadores',
  templateUrl: './coordinadores.component.html',
  styleUrls: ['./coordinadores.component.css']
})
export class CoordinadoresComponent implements OnInit {
  coordinadoresTotales: Coordinadores[] = [];
  carrerasTotales: Carreras[] = [];
  coordinadoresTodos: CoordinadoresTodos[] = [];

  coordinadorSeleccionado: any = null;
  carreraSeleccionada: number | null = null;

  // Paginación
  paginaActual: number = 1;
  itemsPorPagina: number = 5;
  totalPaginas: number = 0;

  // Propiedades para dropdowns personalizados
  dropdownCoordinadorOpen = false;
  dropdownCarreraOpen = false;
  searchTermCoordinador = '';
  searchTermCarrera = '';
  coordinadoresFiltrados: Coordinadores[] = [];
  carrerasFiltradas: Carreras[] = [];

  constructor(
    private coordinadoresService: CoordinadoresService, 
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.cargarCoordinadores();
    this.cargarCarreras();
    this.cargarCoordinadoresNombres();
  }

  // =============================
  // MÉTODOS PARA DROPDOWNS PERSONALIZADOS
  // =============================

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    if (!target.closest('.dropdown-container') && !target.closest('.dropdown-button')) {
      this.ngZone.run(() => {
        this.dropdownCoordinadorOpen = false;
        this.dropdownCarreraOpen = false;
        this.cdr.detectChanges();
      });
    }
  }

  toggleDropdownCoordinador(): void {
    this.ngZone.run(() => {
      this.dropdownCoordinadorOpen = !this.dropdownCoordinadorOpen;
      this.dropdownCarreraOpen = false;
      if (this.dropdownCoordinadorOpen) {
        this.coordinadoresFiltrados = [...this.coordinadoresTotales];
      }
      this.cdr.detectChanges();
    });
  }

  toggleDropdownCarrera(): void {
    this.ngZone.run(() => {
      this.dropdownCarreraOpen = !this.dropdownCarreraOpen;
      this.dropdownCoordinadorOpen = false;
      if (this.dropdownCarreraOpen) {
        this.carrerasFiltradas = [...this.carrerasTotales];
      }
      this.cdr.detectChanges();
    });
  }

  getSelectedCoordinadorName(): string {
    if (!this.coordinadorSeleccionado) return '-- Selecciona --';
    return `${this.coordinadorSeleccionado.DOCUMENTO_USUARIOS} - ${this.coordinadorSeleccionado.APELLIDOS_USUARIOS.toUpperCase()} ${this.coordinadorSeleccionado.NOMBRES_USUARIOS.toUpperCase()}`;
  }

  getSelectedCarreraName(): string {
    if (!this.carreraSeleccionada) return '-- Selecciona --';
    const carrera = this.carrerasTotales.find(c => c.ID_CARRERAS === this.carreraSeleccionada);
    return carrera ? carrera.NOMBRE_CARRERAS.toUpperCase() : '-- Selecciona --';
  }

  getFilteredCoordinadores(): Coordinadores[] {
    if (!this.searchTermCoordinador) {
      return this.coordinadoresFiltrados;
    }
    return this.coordinadoresFiltrados.filter(coordinador =>
      coordinador.DOCUMENTO_USUARIOS.toLowerCase().includes(this.searchTermCoordinador.toLowerCase()) ||
      coordinador.APELLIDOS_USUARIOS.toLowerCase().includes(this.searchTermCoordinador.toLowerCase()) ||
      coordinador.NOMBRES_USUARIOS.toLowerCase().includes(this.searchTermCoordinador.toLowerCase())
    );
  }

  getFilteredCarreras(): Carreras[] {
    if (!this.searchTermCarrera) {
      return this.carrerasFiltradas;
    }
    return this.carrerasFiltradas.filter(carrera =>
      carrera.NOMBRE_CARRERAS.toLowerCase().includes(this.searchTermCarrera.toLowerCase())
    );
  }

  selectCoordinador(coordinador: Coordinadores): void {
    this.coordinadorSeleccionado = coordinador;
    this.dropdownCoordinadorOpen = false;
    this.searchTermCoordinador = '';
  }

  selectCarrera(carrera: Carreras): void {
    this.carreraSeleccionada = carrera.ID_CARRERAS;
    this.dropdownCarreraOpen = false;
    this.searchTermCarrera = '';
  }

  cargarCoordinadores(): void {
    this.coordinadoresService.obtenerTodosCoordinadores().subscribe(data => {
      this.coordinadoresTodos = data;
      this.totalPaginas = Math.ceil(this.coordinadoresTodos.length / this.itemsPorPagina);
    });
  }

    cargarCoordinadoresNombres(): void {
    this.coordinadoresService.obtenerNombresCoordinadores().subscribe(data => {
      this.coordinadoresTotales = data;
      this.coordinadoresFiltrados = [...data];

      // Para futura tabla (sin afectar select)
      this.totalPaginas = Math.ceil(this.coordinadoresTotales.length / this.itemsPorPagina);
    });
  }

  cargarCarreras(): void {
    this.coordinadoresService.obtenerCarreras().subscribe(data => {
      this.carrerasTotales = data;
      this.carrerasFiltradas = [...data];
    });
  }

  insertarCoordinador() {
  if (!this.coordinadorSeleccionado || !this.carreraSeleccionada) {
    this.notificationService.showWarningReport(
      'Datos incompletos',
      'Por favor selecciona un coordinador y una carrera.',
      'Entendido'
    );
    return;
  }

  const nuevoCoordinador = {
    cedula_coordinador: this.coordinadorSeleccionado.DOCUMENTO_USUARIOS,
    nombre_coordinador: this.coordinadorSeleccionado.NOMBRES_USUARIOS,
    apellido_coordinador: this.coordinadorSeleccionado.APELLIDOS_USUARIOS,
    idCarrera: this.carreraSeleccionada,
    correo_coordinador: this.coordinadorSeleccionado.CORREO_USUARIOS || ''
  };

  this.notificationService.showLoading('Registrando coordinador...');

  this.coordinadoresService.crearCoordinador(nuevoCoordinador).subscribe({
    next: () => {
      this.notificationService.hideLoading();
      this.notificationService.showSuccess(
        'El coordinador fue registrado correctamente.'
      );
      this.cargarCoordinadores();
    },
    error: (err) => {
      this.notificationService.hideLoading();

      const mensajeError = err.error?.message || 'No se pudo crear el coordinador';

      this.notificationService.showErrorReport(
        'Error',
        mensajeError,
        'Cerrar'
      );
    }
  });
}


 eliminarCoordinador(id: number): void {
  this.notificationService.showConfirm(
    'Confirmación',
    '¿Estás seguro de eliminar este coordinador?',
    'Sí, eliminar',
    'Cancelar'
  ).then((confirmado) => {
    if (!confirmado) return;

    this.notificationService.showLoading('Eliminando coordinador...');

    this.coordinadoresService.eliminarCoordinador(id).subscribe({
      next: () => {
        this.notificationService.hideLoading();
        this.notificationService.showSuccess(
          'El coordinador fue eliminado exitosamente.'
        );
        this.cargarCoordinadores();
      },
      error: (err) => {
        this.notificationService.hideLoading();
        const mensajeError = err.error?.message || 'Error desconocido al eliminar el coordinador';
        this.notificationService.showErrorReport('Error', mensajeError, 'Cerrar');
      }
    });
  });
}


  // Obtener coordinadores paginados
  getCoordinadoresPaginados(): CoordinadoresTodos[] {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    return this.coordinadoresTodos.slice(inicio, inicio + this.itemsPorPagina);
  }

  cambiarPagina(incremento: number): void {
    const nuevaPagina = this.paginaActual + incremento;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
    }
  }
}
