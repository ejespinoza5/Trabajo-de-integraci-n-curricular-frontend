import { Component, OnInit } from '@angular/core';
import { Carreras, Coordinadores, CoordinadoresService, CoordinadoresTodos } from '../coordinadores.service';
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

  constructor(private coordinadoresService: CoordinadoresService) {}

  ngOnInit(): void {
    this.cargarCoordinadores();
    this.cargarCarreras();
    this.cargarCoordinadoresNombres();
  }

  cargarCoordinadores(): void {
    this.coordinadoresService.obtenerTodosCoordinadores().subscribe(data => {
      this.coordinadoresTodos = data;
      this.totalPaginas = Math.ceil(this.coordinadoresTodos.length / this.itemsPorPagina);
    });
  }
searchInput = new Subject<string>();
  customSearchFn(term: string, item: any): boolean {
  term = term.toLowerCase();
  return item.DOCUMENTO_USUARIOS.toLowerCase().includes(term) ||
         item.APELLIDOS_USUARIOS.toLowerCase().includes(term) ||
         item.NOMBRES_USUARIOS.toLowerCase().includes(term);
}
    cargarCoordinadoresNombres(): void {
    this.coordinadoresService.obtenerNombresCoordinadores().subscribe(data => {
      this.coordinadoresTotales = data;

      // Para futura tabla (sin afectar select)
      this.totalPaginas = Math.ceil(this.coordinadoresTotales.length / this.itemsPorPagina);
    });
  }

  cargarCarreras(): void {
    this.coordinadoresService.obtenerCarreras().subscribe(data => {
      this.carrerasTotales = data;
    });
  }

  insertarCoordinador() {
    if (!this.coordinadorSeleccionado || !this.carreraSeleccionada) {
      alert('Por favor selecciona un coordinador y una carrera');
      return;
    }

    const nuevoCoordinador = {
      cedula_coordinador: this.coordinadorSeleccionado.DOCUMENTO_USUARIOS,
      nombre_coordinador: this.coordinadorSeleccionado.NOMBRES_USUARIOS,
      apellido_coordinador: this.coordinadorSeleccionado.APELLIDOS_USUARIOS,
      idCarrera: this.carreraSeleccionada,
      correo_coordinador: this.coordinadorSeleccionado.CORREO_USUARIOS || ''
    };

    this.coordinadoresService.crearCoordinador(nuevoCoordinador).subscribe({
      next: () => {
        alert('Coordinador creado con éxito!');
        this.cargarCoordinadores();
      },
      error: (err) => {
        alert('Error: ' + (err.error?.message || 'No se pudo crear el coordinador'));
      }
    });
  }

  eliminarCoordinador(id: number): void {
  const confirmacion = confirm('¿Estás seguro de eliminar este coordinador?');
  if (!confirmacion) return;

  this.coordinadoresService.eliminarCoordinador(id).subscribe({
    next: () => {
      alert('Coordinador eliminado exitosamente');
      this.cargarCoordinadores(); // Recarga la lista actualizada
    },
    error: (err) => {
      alert('Error al eliminar: ' + (err.error?.message || 'Error desconocido'));
    }
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
