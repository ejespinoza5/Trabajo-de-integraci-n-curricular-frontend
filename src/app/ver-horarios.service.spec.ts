import { TestBed } from '@angular/core/testing';

import { VerHorariosService } from './ver-horarios.service';

describe('VerHorariosService', () => {
  let service: VerHorariosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VerHorariosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
