import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { from, switchMap } from 'rxjs';

import { routes } from './app.routes';
import { Auth } from './services/auth';

// Ensures a real backend token exists (silently signs in with the fixed
// credentials when needed) and attaches it to every API request.
const authInterceptor = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
  const auth = inject(Auth);

  return from(auth.ensureSession()).pipe(
    switchMap(() => {
      const token = auth.getToken();
      if (!token) {
        return next(req);
      }

      return next(
        req.clone({
          setHeaders: { Authorization: `Bearer ${token}` },
        })
      );
    })
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
