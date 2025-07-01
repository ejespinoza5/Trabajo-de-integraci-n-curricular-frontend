import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Aulas, AulasService, CrearAula } from '../aulas.service';
import { NotificationService } from '../notificacion.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-gestionar-aulas',
  templateUrl: './gestionar-aulas.component.html',
  styleUrls: ['./gestionar-aulas.component.css']
})
export class GestionarAulasComponent implements OnInit {
  aulas: Aulas[] = [];
  aulasTotales: Aulas[] = [];  // Almacenamos todas las aulas aquí
  tipos: string[] = ['Normal', 'Laboratorio', 'Taller de moda', 'Taller de electricidad'];

  // Cambié la inicialización para que sea solo con los campos que necesitas
  nuevaAula: CrearAula = {
    nombre: '',
    tipo: ''
  };

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 5;
  totalPaginas: number = 0;

   mostrarModal = false;
  tiposAula: any[] = [];
  nuevoTipo: any = { nombre: '' };
  editandoId: number | null = null;

  constructor(private router: Router, private aulaService: AulasService, private notificationService: NotificationService,
    public usuarioService: AuthService
  ) { }

  ngOnInit(): void {
    this.ObtenerAulas();
    this.obtenerTipos();
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
      console.error('Error al obtener aulas:', error);

      let mensajeError = 'Error al cargar las aulas';

      if (error.error && error.error.message) {
        mensajeError = error.error.message;
      } else if (error.message) {
        mensajeError = error.message;
      }

      this.notificationService.showError('Error: ' + mensajeError);

      // Opcional: Inicializar arrays vacíos para evitar errores en la vista
      this.aulasTotales = [];
      this.totalPaginas = 0;
      this.actualizarAulasPorPagina();
    }
  });
}

  agregarAulas() {
  if (!this.nuevaAula.nombre?.trim() || !this.nuevaAula.tipo) {
    this.notificationService.showWarningReport(
      'Advertencia',
      'Por favor, complete todos los campos antes de crear el aula.',
      'Cerrar'
    );
    return; // Salir del método para no continuar con la llamada al servicio
  }

  const aulaData = {
    nombre: this.nuevaAula.nombre,
    tipo: this.nuevaAula.tipo
  };

  this.notificationService.showLoading('Creando aula...');
  this.aulaService.crearAulas(aulaData).subscribe({
    next: (response) => {
      this.notificationService.hideLoading();
      this.notificationService.showSuccessReport(
        'Aula Creada',
        response.id.mensaje,
        'Continuar'
      );
      this.ObtenerAulas();
    },
    error: (error) => {
      this.notificationService.hideLoading();
      console.error('Error al agregar aula', error);
      let mensajeError = 'Error al crear el aula';

      if (error.error && error.error.message) {
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



  editarAula(id: string): void {
    this.router.navigate([`/inicio/editar-aula/${id}`]);
  }

eliminarAula(id: number): void {
  this.notificationService.showConfirm(
    '¿Estás seguro?',
    '¿Estás seguro de que deseas eliminar esta aula?',
    'Eliminar',
    'Cancelar'
  ).then((confirmed) => {
    if (confirmed) {
      this.procederConEliminacion(id);
    }
  });
}

private procederConEliminacion(id: number): void {
  this.notificationService.showLoading('Eliminando aula...');

  this.aulaService.eliminarProducto(id).subscribe({
    next: (response) => {
      this.notificationService.hideLoading();
      this.notificationService.showSuccess(response.mensaje || 'Aula eliminada correctamente');
      this.aulasTotales = this.aulasTotales.filter(aula => aula.ID_AULA !== id);
      this.ObtenerAulas();
    },
    error: (error) => {
      this.notificationService.hideLoading();
      console.error('Error al eliminar aula:', error);

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
    this.aulas = this.aulasTotales.slice(inicio, fin);  // Mostrar solo las aulas correspondientes a la página actual
  }

  cambiarPagina(incremento: number): void {
    const nuevaPagina = this.paginaActual + incremento;
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas) {
      this.paginaActual = nuevaPagina;
      this.actualizarAulasPorPagina();  // Actualiza la vista con las aulas correspondientes a la nueva página
    }
  }
  abrirModal(): void {
    this.mostrarModal = true;
    this.obtenerTipos();
    this.nuevoTipo = { nombre: '' };
    this.editandoId = null;
  }
  cerrarModal(): void {
    this.mostrarModal = false;
    this.limpiarFormulario();
  }

  

obtenerTipos(): void {
  this.notificationService.showLoading('Cargando tipos de aula...');
  
  this.aulaService.obtenerTipoAulas().subscribe({
    next: (response) => {
      this.notificationService.hideLoading();
      this.tiposAula = response;
      
      if (response.length === 0) {
        this.notificationService.showWarning(
          'No se encontraron tipos de aula registrados.'
        );
      }
    },
    error: (error) => {
      this.notificationService.hideLoading();
      console.error('Error al obtener tipos de aula:', error);
      
      let mensajeError = 'Error al cargar los tipos de aula';
      
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

guardarTipoAula(): void {
  // Validación de campo vacío
  if (!this.nuevoTipo.nombre || this.nuevoTipo.nombre.trim() === '') {
    this.notificationService.showWarningReport(
      'El nombre del tipo de aula es obligatorio.',
      'Por favor, ingrese un nombre válido para el tipo de aula.',
    );
    return;
  }

  // Validación de longitud mínima
  if (this.nuevoTipo.nombre.trim().length < 3) {
    this.notificationService.showWarning(
      'El nombre debe tener al menos 3 caracteres.'
    );
    return;
  }

  const mensaje = this.editandoId ? 'Actualizando tipo de aula...' : 'Guardando tipo de aula...';
  this.notificationService.showLoading(mensaje);

  if (this.editandoId) {
    // Actualizar tipo existente
    this.aulaService.actualizarTipoAulas(this.editandoId, this.nuevoTipo).subscribe({
      next: (response) => {
        this.notificationService.hideLoading();
        this.notificationService.showSuccess(
          'Tipo de aula actualizado correctamente.'
        );
        
        this.obtenerTipos();
        this.cerrarModal();
        this.limpiarFormulario();
      },
      error: (error) => {
        this.notificationService.hideLoading();
        console.error('Error al actualizar tipo de aula:', error);
        
        let mensajeError = 'Error al actualizar el tipo de aula';
        
        if (error.status === 403 && error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.status === 404 && error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.status === 409 && error.error && error.error.message) {
          // Conflicto - nombre duplicado
          mensajeError = 'Ya existe un tipo de aula con ese nombre';
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
  } else {
    // Crear nuevo tipo
    this.aulaService.crearTipoAula(this.nuevoTipo).subscribe({
      next: (response) => {
        this.notificationService.hideLoading();
        this.notificationService.showSuccess(
          'Tipo de aula creado correctamente.'
        );
        
        this.obtenerTipos();
        this.limpiarFormulario();
      },
      error: (error) => {
        this.notificationService.hideLoading();
        console.error('Error al crear tipo de aula:', error);
        
        let mensajeError = 'Error al crear el tipo de aula';
        
        if (error.status === 403 && error.error && error.error.message) {
          mensajeError = error.error.message;
        } else if (error.status === 409 && error.error && error.error.message) {
          // Conflicto - nombre duplicado
          mensajeError = 'Ya existe un tipo de aula con ese nombre';
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
}

editar(tipo: any): void {
  this.nuevoTipo.nombre = tipo.NOMBRE_TIPO;
  this.editandoId = tipo.ID_TIPO;
}

eliminar(id: number): void {
  // Buscar el nombre del tipo para el mensaje de confirmación
  const tipoAEliminar = this.tiposAula.find(tipo => tipo.ID_TIPO === id);
  const nombreTipo = tipoAEliminar ? tipoAEliminar.NOMBRE_TIPO : 'este tipo de aula';
  
  this.notificationService.showConfirm(
    '¿Estás seguro?',
    `¿Estás seguro de que deseas eliminar "${nombreTipo}"?`,
    'Eliminar',
    'Cancelar'
  ).then((confirmed) => {
    if (confirmed) {
      this.procederConEliminacionTipo(id, nombreTipo);
    }
  });
}
private procederConEliminacionTipo(id: number, nombreTipo: string): void {
  this.notificationService.showLoading('Eliminando tipo de aula...');
  
  this.aulaService.eliminarTipoAulas(id).subscribe({
    next: (response) => {
      this.notificationService.hideLoading();
      this.notificationService.showSuccess(
        `Tipo de aula "${nombreTipo}" eliminado correctamente.`
      );
      
      this.obtenerTipos();
      
      // Si estaba editando el tipo eliminado, limpiar el formulario
      if (this.editandoId === id) {
        this.limpiarFormulario();
      }
    },
    error: (error) => {
      this.notificationService.hideLoading();
      console.error('Error al eliminar tipo de aula:', error);
      
      let mensajeError = 'Error al eliminar el tipo de aula';
      
      if (error.status === 403 && error.error && error.error.message) {
        mensajeError = error.error.message;
      } else if (error.status === 404 && error.error && error.error.message) {
        mensajeError = 'El tipo de aula no existe o ya fue eliminado';
      } else if (error.status === 409 && error.error && error.error.message) {
        // Conflicto - puede estar en uso
        mensajeError = 'No se puede eliminar este tipo de aula porque está siendo utilizado';
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
private limpiarFormulario(): void {
  this.nuevoTipo = { nombre: '' };
  this.editandoId = null;
}
}


