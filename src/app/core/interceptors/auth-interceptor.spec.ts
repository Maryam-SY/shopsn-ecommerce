import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('should attach the Authorization header when a token is present', () => {
    localStorage.setItem('auth_token', 'fake-jwt-token');
    const req = new HttpRequest('GET', '/products');
    const next = vi.fn().mockReturnValue(of({}));

    interceptor(req, next);

    const clonedReq = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(clonedReq.headers.get('Authorization')).toBe('Bearer fake-jwt-token');
  });

  it('should not attach an Authorization header when no token is present', () => {
    const req = new HttpRequest('GET', '/products');
    const next = vi.fn().mockReturnValue(of({}));

    interceptor(req, next);

    const passedReq = next.mock.calls[0][0] as HttpRequest<unknown>;
    expect(passedReq.headers.has('Authorization')).toBe(false);
  });
});