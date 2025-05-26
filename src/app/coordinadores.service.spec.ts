import { TestBed } from '@angular/core/testing';

import { CoordinadoresService } from './coordinadores.service';

describe('CoordinadoresService', () => {
  let service: CoordinadoresService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoordinadoresService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
