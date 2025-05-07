import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Aulas, AulasService, CrearAula } from '../aulas.service';

@Component({
  selector: 'app-gestionar-aulas',
  templateUrl: './gestionar-aulas.component.html',
  styleUrls: ['./gestionar-aulas.component.css']
})
export class GestionarAulasComponent implements OnInit {
  aulas: Aulas[] = [];
  aulasTotales: Aulas[] = [];  // Almacenamos todas las aulas aquí
  tipos: string[] = ['Normal','Laboratorio','Taller de moda','Taller de electricidad'];

  // Cambié la inicialización para que sea solo con los campos que necesitas
  nuevaAula: CrearAula = {
    nombre: '',
    tipo: ''
  };

  // Paginación
  paginaActual = 1;
  itemsPorPagina = 5;
  totalPaginas: number = 0;

  constructor(private router: Router, private aulaService: AulasService) { }

  ngOnInit(): void {
    this.ObtenerAulas();
  }

  ObtenerAulas(): void {
    this.aulaService.obtenerAulas().subscribe(data => {
      this.aulasTotales = data;

      // Calcular el total de páginas
      this.totalPaginas = Math.ceil(this.aulasTotales.length / this.itemsPorPagina);
      // Actualizar aulas visibles por página
      this.actualizarAulasPorPagina();
    });
  }

  agregarAulas() {
    const aulaData = {
      nombre: this.nuevaAula.nombre,
      tipo: this.nuevaAula.tipo
    };

    this.aulaService.crearAulas(aulaData).subscribe(
      (response) => {
        console.log('Aula agregada correctamente', response);
        this.ObtenerAulas();
        this.nuevaAula.nombre = '';
        this.nuevaAula.tipo = '';
      },
      (error) => {
        console.error('Error al agregar aula', error);
      }
    );
  }



  editarAula(id: string): void {
    this.router.navigate([`/inicio/editar-aula/${id}`]);
  }

  eliminarAula(id: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta aula?')) {
      this.aulaService.eliminarProducto(id).subscribe(() => {
        this.aulasTotales = this.aulasTotales.filter(aula => aula.ID_AULA !== id);
        this.ObtenerAulas(); // Actualizar la lista después de eliminar
      });
    }
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
