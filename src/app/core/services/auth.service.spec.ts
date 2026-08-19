import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not be authenticated by default', () => {
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should store the token and become authenticated after login', () => {
    service.login('mor_2314', '83r5^_').subscribe();

    const req = httpMock.expectOne('https://fakestoreapi.com/auth/login');
    expect(req.request.method).toBe('POST');
    req.flush({ token: 'fake-jwt-token' });

    expect(service.isAuthenticated()).toBe(true);
    expect(service.getToken()).toBe('fake-jwt-token');
  });

  it('should clear the token and become unauthenticated after logout', () => {
    service.login('mor_2314', '83r5^_').subscribe();
    httpMock.expectOne('https://fakestoreapi.com/auth/login').flush({ token: 'fake-jwt-token' });

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.getToken()).toBeNull();
  });
});