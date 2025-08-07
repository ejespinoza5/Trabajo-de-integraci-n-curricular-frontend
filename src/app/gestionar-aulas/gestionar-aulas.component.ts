import { Component, OnInit, HostListener, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Aulas, AulasService, CrearAula } from '../aulas.service';
import { NotificationService } from '../notificacion.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-gestionar-aulas',
  templateUrl: './gestionar-aulas.component.html',
  styleUrls: ['./gestionar-aulas.component.css']
})
export class GestionarAulasComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dropdownContainer', { static: false }) dropdownContainer!: ElementRef;
  @ViewChild('dropdownUbicacionContainer', { static: false }) dropdownUbicacionContainer!: ElementRef;
  aulas: Aulas[] = [];
  aulasTotales: Aulas[] = [];  // Almacenamos todas las aulas aquí
  tipos: string[] = ['Normal', 'Laboratorio', 'Taller de moda', 'Taller de electricidad'];

  // Cambié la inicialización para que sea solo con los campos que necesitas
  nuevaAula: CrearAula = {
    nombre: '',
    tipo: '',
    ubicacion: ''
  };

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 5;
  totalPaginas: number = 0;

  tiposAula: any[] = [];
  ubicacionesAula: any[] = [];

  // Variables para el ng-select integrado
  agregandoNuevoTipo = false;
  editandoTipoEnSelect = false;
  nuevoTipoNombre = '';
  editandoTipoId: number | null = null;
  editandoTipoNombre = '';

  // Variables para ubicaciones
  agregandoNuevaUbicacion = false;
  editandoUbicacionEnSelect = false;
  nuevaUbicacionNombre = '';
  editandoUbicacionId: number | null = null;
  editandoUbicacionNombre = '';

  // Variables para el custom dropdown
  dropdownOpen = false;
  searchTerm = '';

  // Variables para el dropdown de ubicaciones
  dropdownUbicacionOpen = false;
  searchTermUbicacion = '';



  constructor(private router: Router, private aulaService: AulasService, private notificationService: NotificationService,
    public usuarioService: AuthService
  ) { }

  ngOnInit(): void {
    this.ObtenerAulas();
    this.obtenerTipos();
    this.obtenerUbicaciones();
  }

  ngAfterViewInit(): void {
    // Set up document click listener to close dropdown
    document.addEventListener('click', this.handleDocumentClick.bind(this));
  }

  ngOnDestroy(): void {
    // Clean up the document click listener
    document.removeEventListener('click', this.handleDocumentClick.bind(this));
  }

  private handleDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    
    // Verificar si el clic fue dentro del contenedor del dropdown de tipos
    if (this.dropdownContainer && this.dropdownContainer.nativeElement) {
      const isClickInside = this.dropdownContainer.nativeElement.contains(target);
      
      // Si el clic no fue dentro del dropdown, cerrarlo
      if (!isClickInside && this.dropdownOpen) {
        this.dropdownOpen = false;
        this.searchTerm = '';
      }
    }

    // Verificar si el clic fue dentro del contenedor del dropdown de ubicaciones
    if (this.dropdownUbicacionContainer && this.dropdownUbicacionContainer.nativeElement) {
      const isClickInside = this.dropdownUbicacionContainer.nativeElement.contains(target);
      
      // Si el clic no fue dentro del dropdown, cerrarlo
      if (!isClickInside && this.dropdownUbicacionOpen) {
        this.dropdownUbicacionOpen = false;
        this.searchTermUbicacion = '';
      }
    }
  }

  ObtenerAulas(): void {
  this.aulaService.obtenerAulas().subscribe({
    next: (data) => {
      this.aulasTotales = data;

      // Calcular el total de páginas
      this.totalPaginas = Math.ceil(this.aulasTotales.length / this.itemsPorPagina);
      // Actualizar aulas visibles por página
      this.actualizarAulasPorPagina();
    },
    error: (error) => {

      let mensajeError = 'Error al cargar las aulas';

      if (error.error && error.error.message) {
        mensajeError = error.error.message;
      } else if (error.message) {
        mensajeError = error.message;
      }

      this.notificationService.showWarning('Error: ' + mensajeError);

      // Opcional: Inicializar arrays vacíos para evitar errores en la vista
      this.aulasTotales = [];
      this.totalPaginas = 0;
      this.actualizarAulasPorPagina();
    }
  });
}

  agregarAulas() {
    if (!this.nuevaAula.nombre?.trim() || !this.nuevaAula.tipo || !this.nuevaAula.ubicacion) {
      this.notificationService.showWarningReport(
        'Advertencia',
        'Por favor, complete todos los campos antes de crear el aula.',
        'Cerrar'
      );
      return; // Salir del método para no continuar con la llamada al servicio
    }

    const aulaData = {
      nombre: this.nuevaAula.nombre,
      tipo: this.nuevaAula.tipo,
      ubicacion: this.nuevaAula.ubicacion
    };

    this.notificationService.showLoading('Creando aula...');
    this.aulaService.crearAulas(aulaData).subscribe({
      next: (response) => {
        this.notificationService.hideLoading();
        this.notificationService.showSuccessReport(
          'Aula Creada',
          response.id.mensaje,
          'Cerrar'
        );

        // Limpiar el formulario
        this.nuevaAula = {
          nombre: '',
          tipo: '',
          ubicacion: ''
        };

        // Recargar las aulas
        this.ObtenerAulas();
      },
      error: (error) => {
        this.notificationService.hideLoading();

        let mensajeError = 'Error al crear el aula';

        if (error.status === 403 && error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.status === 404 && error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.status === 409 && error.error && error.error.message) {
          // Conflicto - nombre duplicado
          mensajeError = 'Ya existe un aula con ese nombre';
        } else if (error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        }

        this.notificationService.showWarning('Error: ' + mensajeError);
      }
    });
  }

  editarAula(id: string): void {
    // Navegar al componente de editar aula
    this.router.navigate(['/inicio/editar-aula', id]);
  }

eliminarAula(id: number): void {
  this.notificationService.showConfirm(
    '¿Estás seguro?',
    'Esta acción eliminará permanentemente el aula. ¿Deseas continuar?',
    'Eliminar',
    'Cancelar'
  ).then((result: boolean) => {
    if (result) {
      this.procederConEliminacion(id);
    }
  });
}

private procederConEliminacion(id: number): void {
  this.notificationService.showLoading('Eliminando aula...');
  this.aulaService.eliminarAulas(id).subscribe({
    next: (response: any) => {
      this.notificationService.hideLoading();
      this.notificationService.showSuccessReport(
        'Aula Eliminada',
        response.mensaje,
        'Cerrar'
      );

      // Recargar las aulas
      this.ObtenerAulas();
    },
    error: (error: any) => {
      this.notificationService.hideLoading();

      let mensajeError = 'Error al eliminar el aula';

      if (error.status === 403 && error.error && error.error.message) {
        mensajeError = error.error.message;
      } else if (error.status === 404 && error.error && error.error.message) {
        mensajeError = error.error.message;
      } else if (error.error && error.error.message) {
        mensajeError = error.error.message;
      } else if (error.message) {
        mensajeError = error.message;
      }

      this.notificationService.showErrorReport(
        'Error',
        mensajeError,
        'Cerrar'
      );
    }
  });
}

  actualizarAulasPorPagina(): void {
    const inicio = (this.paginaActual - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.aulas = this.aulasTotales.slice(inicio, fin);
  }

  cambiarPagina(incremento: number): void {
    const nuevaPagina = this.paginaActual + incremento;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.actualizarAulasPorPagina();
    }
  }

obtenerTipos(): void {
  this.aulaService.obtenerTipoAulas().subscribe({
    next: (data: any) => {
      this.tiposAula = data;
      
      // Agregar la opción "agregar" solo si hay tipos existentes y no estamos en modo agregar
      if (this.tiposAula.length > 0 && !this.agregandoNuevoTipo) {
        this.tiposAula.push({ ID_TIPO: 'agregar', NOMBRE_TIPO: 'agregar' });
      }
    },
    error: (error: any) => {
      let mensajeError = 'Error al cargar los tipos de aula';

      if (error.error && error.error.message) {
        mensajeError = error.error.message;
      } else if (error.message) {
        mensajeError = error.message;
      }

      this.notificationService.showWarning('Error: ' + mensajeError);
    }
  });
}

  // Método para activar el modo agregar desde el clic directo
  activarModoAgregar(): void {
    this.agregandoNuevoTipo = true;
    this.nuevoTipoNombre = '';
    this.nuevaAula.tipo = null;
    
    // Cerrar el dropdown inmediatamente
    this.cerrarDropdown();
  }

  // Método para cerrar el dropdown
  cerrarDropdown(): void {
    this.dropdownOpen = false;
  }

  // Método para manejar el cambio de estado del ng-select
  onTipoChange(event: any): void {
    if (event && event.ID_TIPO === 'agregar') {
      this.agregandoNuevoTipo = true;
      this.nuevoTipoNombre = '';
      this.nuevaAula.tipo = null;
      // Cerrar el dropdown inmediatamente
      setTimeout(() => {
        this.cerrarDropdown();
      }, 100);
    }
  }

  // Método para agregar nuevo tipo desde el dropdown
  agregarNuevoTipoDesdeSelect(): void {
    this.agregandoNuevoTipo = true;
    this.nuevoTipoNombre = '';
    this.nuevaAula.tipo = null;
  }

  // Método para guardar el nuevo tipo desde el dropdown
  guardarNuevoTipoDesdeSelect(): void {
    if (!this.nuevoTipoNombre.trim()) {
      this.notificationService.showWarningReport(
        'Advertencia',
        'Por favor, ingrese un nombre para el nuevo tipo de aula.',
        'Cerrar'
      );
      return;
    }

    this.notificationService.showLoading('Creando nuevo tipo de aula...');
    this.aulaService.crearTipoAula({ nombre: this.nuevoTipoNombre }).subscribe({
      next: (response: any) => {
        this.notificationService.hideLoading();
        this.notificationService.showSuccessReport(
          'Tipo Creado',
          response.mensaje,
          'Cerrar'
        );
        
        // Cerrar el dropdown inmediatamente
        this.cerrarDropdown();
        
        // Limpiar el formulario
        this.agregandoNuevoTipo = false;
        this.nuevoTipoNombre = '';
        
        // Recargar los tipos con un pequeño delay para asegurar que se actualice correctamente
        setTimeout(() => {
          this.obtenerTipos();
        }, 100);
      },
      error: (error: any) => {
        this.notificationService.hideLoading();
        let mensajeError = 'Error al crear el tipo de aula';

        if (error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        }

        this.notificationService.showWarning('Error: ' + mensajeError);
      }
    });
  }

  // Método para cancelar el modo de agregar/editar
  cancelarModoAgregar(): void {
    // Cerrar el dropdown
    this.cerrarDropdown();
    
    // Limpiar el formulario
    this.agregandoNuevoTipo = false;
    this.editandoTipoEnSelect = false;
    this.nuevoTipoNombre = '';
    this.editandoTipoId = null;
    this.editandoTipoNombre = '';
    
    // Recargar los tipos con un pequeño delay para asegurar que se actualice correctamente
    setTimeout(() => {
      this.obtenerTipos();
    }, 100);
  }

  // Método para editar tipo desde el dropdown
  editarTipoDesdeSelect(tipo: any): void {
    this.editandoTipoEnSelect = true;
    this.editandoTipoId = tipo.ID_TIPO;
    this.editandoTipoNombre = tipo.NOMBRE_TIPO;
    
    // Cerrar ambos dropdowns
    this.cerrarDropdown();
    this.dropdownUbicacionOpen = false;
  }

  // Método para guardar la edición desde el dropdown
  guardarEdicionDesdeSelect(): void {
    if (!this.editandoTipoNombre.trim()) {
      this.notificationService.showWarningReport(
        'Advertencia',
        'Por favor, ingrese un nombre para el tipo de aula.',
        'Cerrar'
      );
      return;
    }

    if (!this.editandoTipoId) {
      this.notificationService.showWarning('Error: ID del tipo no encontrado');
      return;
    }

    this.notificationService.showLoading('Actualizando tipo de aula...');
    this.aulaService.actualizarTipoAulas(this.editandoTipoId, { nombre: this.editandoTipoNombre }).subscribe({
      next: (response: any) => {
        this.notificationService.hideLoading();
        this.notificationService.showSuccessReport(
          'Tipo Actualizado',
          response.mensaje,
          'Cerrar'
        );
        
        // Cerrar el dropdown inmediatamente
        this.cerrarDropdown();
        
        // Limpiar el formulario manualmente
        this.editandoTipoEnSelect = false;
        this.editandoTipoId = null;
        this.editandoTipoNombre = '';
        
        // Recargar los tipos con un pequeño delay para asegurar que se actualice correctamente
        setTimeout(() => {
          this.obtenerTipos();
        }, 100);
      },
      error: (error: any) => {
        this.notificationService.hideLoading();
        let mensajeError = 'Error al actualizar el tipo de aula';

        if (error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        }

        this.notificationService.showWarning('Error: ' + mensajeError);
      }
    });
  }

  // Método para eliminar tipo desde el dropdown
  eliminarTipoDesdeSelect(id: number, nombre: string): void {
    this.notificationService.showConfirm(
      '¿Estás seguro?',
      `Esta acción eliminará permanentemente el tipo "${nombre}". ¿Deseas continuar?`,
      'Eliminar',
      'Cancelar'
    ).then((result: boolean) => {
      if (result) {
        this.procederConEliminacionTipo(id, nombre);
      }
    });
  }

  private procederConEliminacionTipo(id: number, nombreTipo: string): void {
    this.aulaService.eliminarTipoAulas(id).subscribe({
      next: (response: any) => {
        this.notificationService.hideLoading();
        this.notificationService.showSuccessReport(
          'Tipo Eliminado',
          response.mensaje,
          'Cerrar'
        );
        this.obtenerTipos();
      },
      error: (error: any) => {
        this.notificationService.hideLoading();
        let mensajeError = 'Error al eliminar el tipo de aula';

        if (error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        }

        this.notificationService.showError('Error: ' + mensajeError);
      }
    });
  }

  // Métodos para el custom dropdown
  toggleDropdown(): void {
    if (!this.agregandoNuevoTipo && !this.editandoTipoEnSelect) {
      this.dropdownOpen = !this.dropdownOpen;
      if (this.dropdownOpen) {
        this.searchTerm = '';
      }
    }
  }

  selectTipo(item: any): void {
    if (item.ID_TIPO !== 'agregar') {
      this.nuevaAula.tipo = item.ID_TIPO;
      this.dropdownOpen = false;
      this.searchTerm = '';
    }
  }

  getSelectedTipoName(): string {
    if (!this.nuevaAula.tipo) return '';
    const selectedTipo = this.tiposAula.find(tipo => tipo.ID_TIPO === this.nuevaAula.tipo);
    return selectedTipo ? selectedTipo.NOMBRE_TIPO : '';
  }

  getFilteredTipos(): any[] {
    if (!this.searchTerm) {
      return this.tiposAula.filter(tipo => tipo.ID_TIPO !== 'agregar');
    }
    return this.tiposAula.filter(tipo => 
      tipo.ID_TIPO !== 'agregar' && 
      tipo.NOMBRE_TIPO.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  // Métodos para ubicaciones
  obtenerUbicaciones(): void {
    this.aulaService.obtenerUbicacionesAulas().subscribe({
      next: (data: any) => {
        // Verificar si data es un array o si está dentro de una propiedad
        if (Array.isArray(data)) {
          this.ubicacionesAula = data;
        } else if (data && Array.isArray(data.data)) {
          this.ubicacionesAula = data.data;
        } else if (data && Array.isArray(data.ubicaciones)) {
          this.ubicacionesAula = data.ubicaciones;
        } else {
          this.ubicacionesAula = [];
        }
      },
      error: (error: any) => {
        let mensajeError = 'Error al cargar las ubicaciones de aula';

        if (error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        }

        this.notificationService.showWarning('Error: ' + mensajeError);
      }
    });
  }

  toggleDropdownUbicacion(): void {
    this.dropdownUbicacionOpen = !this.dropdownUbicacionOpen;
    if (!this.dropdownUbicacionOpen) {
      this.searchTermUbicacion = '';
    }
  }

  selectUbicacion(item: any): void {
    // Asegurar que el ID sea un número - usar ID_UBICACION
    this.nuevaAula.ubicacion = typeof item.ID_UBICACION === 'string' ? parseInt(item.ID_UBICACION) : item.ID_UBICACION;
    this.dropdownUbicacionOpen = false;
    this.searchTermUbicacion = '';
  }

  getSelectedUbicacionName(): string {
    if (!this.nuevaAula.ubicacion) return '';
    // Convertir a número para comparación - usar ID_UBICACION
    const ubicacionId = typeof this.nuevaAula.ubicacion === 'string' ? parseInt(this.nuevaAula.ubicacion) : this.nuevaAula.ubicacion;
    const ubicacion = this.ubicacionesAula.find(u => {
      const uId = typeof u.ID_UBICACION === 'string' ? parseInt(u.ID_UBICACION) : u.ID_UBICACION;
      return uId === ubicacionId;
    });
    return ubicacion ? ubicacion.NOMBRE_UBICACION : '';
  }

  getFilteredUbicaciones(): any[] {
    if (!this.ubicacionesAula || this.ubicacionesAula.length === 0) {
      return [];
    }
    
    if (!this.searchTermUbicacion) {
      return this.ubicacionesAula;
    }
    
    return this.ubicacionesAula.filter(ubicacion => 
      ubicacion.NOMBRE_UBICACION && ubicacion.NOMBRE_UBICACION.toLowerCase().includes(this.searchTermUbicacion.toLowerCase())
    );
  }

  activarModoAgregarUbicacion(): void {
    this.agregandoNuevaUbicacion = true;
    this.nuevaUbicacionNombre = '';
    this.dropdownUbicacionOpen = false;
    this.dropdownOpen = false;
  }

  cerrarDropdownUbicacion(): void {
    this.dropdownUbicacionOpen = false;
    this.searchTermUbicacion = '';
  }

  editarUbicacionDesdeSelect(ubicacion: any): void {
    this.editandoUbicacionEnSelect = true;
    // Asegurar que el ID sea un número - usar ID_UBICACION
    this.editandoUbicacionId = typeof ubicacion.ID_UBICACION === 'string' ? parseInt(ubicacion.ID_UBICACION) : ubicacion.ID_UBICACION;
    this.editandoUbicacionNombre = ubicacion.NOMBRE_UBICACION;
    this.dropdownUbicacionOpen = false;
    this.dropdownOpen = false;
  }

  eliminarUbicacionDesdeSelect(id: number | string, nombre: string): void {
    // Asegurar que el ID sea un número
    const idNumero = typeof id === 'string' ? parseInt(id) : id;
    this.notificationService.showConfirm(
      'Confirmar eliminación',
      `¿Está seguro de que desea eliminar la ubicación "${nombre}"?`,
      'Eliminar',
      'Cancelar'
    ).then((result: boolean) => {
      if (result) {
        this.procederConEliminacionUbicacion(idNumero, nombre);
      }
    });
  }

  

  private procederConEliminacionUbicacion(id: number, nombreUbicacion: string): void {
    this.aulaService.eliminarUbicacionAulas(id).subscribe({
      next: (response: any) => {
        this.notificationService.showSuccess('Ubicación eliminada exitosamente');
        this.obtenerUbicaciones(); // Recargar la lista
      },
      error: (error: any) => {
        let mensajeError = 'Error al eliminar la ubicación';

        if (error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        }

        this.notificationService.showError('Error: ' + mensajeError);
      }
    });
  }

  // Métodos faltantes para tipos
  guardarNuevoTipo(): void {
    if (!this.nuevoTipoNombre.trim()) {
      this.notificationService.showWarningReport(
        'Advertencia',
        'Por favor, ingrese un nombre para el tipo.',
        'Cerrar'
      );
      return;
    }

    const datos = { nombre: this.nuevoTipoNombre.trim() };

    this.aulaService.crearTipoAula(datos).subscribe({
      next: (response: any) => {
        this.notificationService.showSuccess('Tipo creado exitosamente');
        this.obtenerTipos(); // Recargar la lista
        this.agregandoNuevoTipo = false;
        this.nuevoTipoNombre = '';
      },
      error: (error: any) => {
        let mensajeError = 'Error al crear el tipo';

        if (error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        }

        this.notificationService.showWarning('Error: ' + mensajeError);
      }
    });
  }

  guardarEditarTipo(): void {
    if (!this.editandoTipoNombre.trim()) {
      this.notificationService.showWarningReport(
        'Advertencia',
        'Por favor, ingrese un nombre para el tipo.',
        'Cerrar'
      );
      return;
    }

    if (!this.editandoTipoId) {
      this.notificationService.showWarning('Error: ID de tipo no válido');
      return;
    }

    const datos = { nombre: this.editandoTipoNombre.trim() };

    this.aulaService.actualizarTipoAulas(this.editandoTipoId, datos).subscribe({
      next: (response: any) => {
        this.notificationService.showSuccess('Tipo actualizado exitosamente');
        this.obtenerTipos(); // Recargar la lista
        this.editandoTipoEnSelect = false;
        this.editandoTipoId = null;
        this.editandoTipoNombre = '';
      },
      error: (error: any) => {
        let mensajeError = 'Error al actualizar el tipo';

        if (error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        }

        this.notificationService.showWarning('Error: ' + mensajeError);
      }
    });
  }

  cancelarAgregarTipo(): void {
    this.agregandoNuevoTipo = false;
    this.nuevoTipoNombre = '';
    this.dropdownOpen = false;
    this.dropdownUbicacionOpen = false;
  }

  cancelarEditarTipo(): void {
    this.editandoTipoEnSelect = false;
    this.editandoTipoId = null;
    this.editandoTipoNombre = '';
    this.dropdownOpen = false;
    this.dropdownUbicacionOpen = false;
  }

  // Métodos faltantes para ubicaciones
  guardarNuevaUbicacion(): void {
    if (!this.nuevaUbicacionNombre.trim()) {
      this.notificationService.showWarningReport(
        'Advertencia',
        'Por favor, ingrese un nombre para la ubicación.',
        'Cerrar'
      );
      return;
    }

    const datos = { nombre: this.nuevaUbicacionNombre.trim() };

    this.aulaService.crearUbicacionAula(datos).subscribe({
      next: (response: any) => {
        this.notificationService.showSuccess('Ubicación creada exitosamente');
        this.obtenerUbicaciones(); // Recargar la lista
        this.agregandoNuevaUbicacion = false;
        this.nuevaUbicacionNombre = '';
      },
      error: (error: any) => {
        let mensajeError = 'Error al crear la ubicación';

        if (error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        }

        this.notificationService.showWarning('Error: ' + mensajeError);
      }
    });
  }

  guardarEditarUbicacion(): void {
    if (!this.editandoUbicacionNombre.trim()) {
      this.notificationService.showWarningReport(
        'Advertencia',
        'Por favor, ingrese un nombre para la ubicación.',
        'Cerrar'
      );
      return;
    }

    if (!this.editandoUbicacionId) {
      this.notificationService.showWarning('Error: ID de ubicación no válido');
      return;
    }

    const datos = { nombre: this.editandoUbicacionNombre.trim() };

    this.aulaService.actualizarUbicacionAulas(this.editandoUbicacionId, datos).subscribe({
      next: (response: any) => {
        this.notificationService.showSuccess('Ubicación actualizada exitosamente');
        this.obtenerUbicaciones(); // Recargar la lista
        this.editandoUbicacionEnSelect = false;
        this.editandoUbicacionId = null;
        this.editandoUbicacionNombre = '';
      },
      error: (error: any) => {
        let mensajeError = 'Error al actualizar la ubicación';

        if (error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.message) {
          mensajeError = error.message;
        }

        this.notificationService.showWarning('Error: ' + mensajeError);
      }
    });
  }

  cancelarAgregarUbicacion(): void {
    this.agregandoNuevaUbicacion = false;
    this.nuevaUbicacionNombre = '';
    this.dropdownUbicacionOpen = false;
    this.dropdownOpen = false;
  }

  cancelarEditarUbicacion(): void {
    this.editandoUbicacionEnSelect = false;
    this.editandoUbicacionId = null;
    this.editandoUbicacionNombre = '';
    this.dropdownUbicacionOpen = false;
    this.dropdownOpen = false;
  }

  activarModoAgregarTipo(): void {
    this.agregandoNuevoTipo = true;
    this.nuevoTipoNombre = '';
    this.dropdownOpen = false;
    this.dropdownUbicacionOpen = false;
  }
}


