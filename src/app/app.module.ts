import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { MapaComponent } from './components/mapa/mapa.component';

import { HttpClientModule } from '@angular/common/http';


//Asi usuamos el servicio rest con sockets
import { SocketIoModule } from 'ngx-socket-io'

//asi usamos la configuracion necesitada para prod o dev
import { environment } from 'src/environments/environment';
import { ServiceWorkerModule } from '@angular/service-worker';


@NgModule({
  declarations: [
    AppComponent,
    MapaComponent
  ],
  imports: [
    BrowserModule,
    SocketIoModule.forRoot( environment.socketIoConfig),
    HttpClientModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
