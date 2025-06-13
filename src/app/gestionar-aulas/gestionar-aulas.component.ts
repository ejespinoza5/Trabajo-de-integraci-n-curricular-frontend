import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Aulas, AulasService, CrearAula } from '../aulas.service';
import { NotificationService } from '../notificacion.service';

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

  constructor(private router: Router, private aulaService: AulasService, private notificationService: NotificationService) { }

  ngOnInit(): void {
    this.ObtenerAulas();
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
  if (!this.nuevaAula.nombre?.trim() || !this.nuevaAula.tipo?.trim()) {
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
}
