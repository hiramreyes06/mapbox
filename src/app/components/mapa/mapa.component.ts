import { Component, OnInit } from '@angular/core';

//para el mapa en js
import * as mapboxgl from 'mapbox-gl';
import { Lugar } from '../../interfaces/interfaces';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from '../../services/websocket.service';
import { environment } from 'src/environments/environment';


interface RespMarcadores{

  //La key puede ser un id
  [ key: string]: Lugar
}

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})
export class MapaComponent implements OnInit {

  //Se tiene que instalar el type para mapbox
  mapa: mapboxgl.Map;

  lugares :RespMarcadores= {};

  //Creamos un objeto lleno de objetos que empiezan y se separan con la propiedad id,
  //Se crea una estructura y una forma de buscar los datos
  markersMapbox :{ [id:string] : mapboxgl.Marker } ={};

  constructor( private http: HttpClient,
    private wsService: WebsocketService) { }

  //AL iniciar el componente
  ngOnInit() {

    this.http.get<RespMarcadores>(environment.socketIoConfig.url+'/mapa')
    .subscribe( lugares =>{
    
    
    //console.log(lugares);
      this.lugares= lugares;

    //Por ser la peticin http asincrona  primero deben ser cargados los datos
    //antes de mostrar el mapa
    this.cargarMapa();
    });

  this.escucharSockets();    


  }

  cargarMapa(){
    //Asi utilizamos la libreria de js en angular
    (mapboxgl as any).accessToken = 'pk.eyJ1IjoiaGlyYW1yZXllczA2IiwiYSI6ImNrM3VxdWpwNTBnNmgzZW8xZ2JydXp6c2YifQ.TfmBRbY6OAJQLdhUBM8iRw';
this.mapa = new mapboxgl.Map({
container: 'mapa',//aqui va el id del html
style: 'mapbox://styles/mapbox/streets-v11',
center:[-75.75512993582937, 45.349977429009954],
zoom: 15.8
});


//ASi creamos multiples marcadores dependiendo de los datos de lugares
//el .entries sirve para regresar un arreglo con las propiedades que tengan los obj lugares
//el const [] usa la destructuracion del objeto, el primero es la llave y el segundo el marcador
for( const [id,marcador] of Object.entries(this.lugares) ){

 //console.log(id, marcador);

  this.agregarMarcador(marcador);
}

  }

  


  agregarMarcador(marcador: Lugar){

    //PARA CREAR UN POPUP MAS PERSONALIZABLE Y QUE SE PUEDA BORRAR EL MARKADOR

const h2= document.createElement('h2');
h2.innerText= marcador.nombre.toString();

const btnBorrar= document.createElement('button');
btnBorrar.innerText='Borrar';

const div= document.createElement('div');
div.append(h2, btnBorrar);

/////////////////////////////////////

    //Crear un popup basico al clickear el markador
//     const html =`
//  <h2>${marcador.nombre}</h2>
//  <br>
//  <button>Borrar</button>`;

 //Asi creamos un html que va a mostrar los marcadores
 const customPopup= new mapboxgl.Popup({
   //Asi para indicar la distancia del popup del markador
   offset: 25,
   //Asi desabilitamos que se cierren al hacer click al mapa
   closeOnClick: false
 }).setDOMContent(div);
 
 
 //Si quiero usar el popup simple
 //.setHTML( html);

    //Asi se crean los marcadores con sus configuraciones
    const marker= new mapboxgl.Marker({
      //Asi agregamos la propiedad de ser arrastrable
      draggable: true,
      color: marcador.color.toString()
    })
    //Asi se establece la posicion del marcador
    .setLngLat([marcador.lng, marcador.lat])
    .setPopup( customPopup)
    .addTo(this.mapa);

    //Asi capturamos el evento de arrastrar un marcador y tener su lng y lat
    marker.on('drag', ()=>{

      const lngLat = marker.getLngLat();

      
      //De esta forma creamos un nuevo objeto para guardar y mandar las propiedades lng y lat
      // const nuevoMarcador = {
      //   id: marcador.id,
      //   //asi se desfragmenta el obj en cada propiedad
      //   ...lngLat
      // }

      //Una forma de enviar propiedades
      //console.log( {id: marcador.id, ...lngLat } );

      //Asi tambien se pueden enviar los valores de las propiedades y ... para desfragmentar
      this.wsService.emit('marcador-mover', {id: marcador.id, ...lngLat } );

      //console.log(lngLat);
    });

    //Asi esta al pendiente del evento click en el boton borrar
    btnBorrar.addEventListener('click', ()=>{

      //Asi borramos el marker del obj mapa
      marker.remove();
      //Emitimos el evento del marcador borrado
      this.wsService.emit('marcador-borrar', marcador.id);
    });

    //Asi actualizamos el arreglo de obj markers a del borrado
    this.markersMapbox[ marcador.id.toString() ] = marker;

    //Son todos los objetos markers con sus propiedades
    //console.log(this.markersMapbox);

  }

  crearMarcador(){

    const customMarker: Lugar={
      //El Id se podria generar con datos del usuario
      id: new Date().toISOString(),
      lng: -75.75512993582937,
      lat: 45.349977429009954,
      nombre: 'Cualquier nombre',
      color: '#'+ Math.floor( Math.random()*16777215).toString(16)
    }
    this.agregarMarcador( customMarker);

    //Asi le asignamos un nombre al evento, y en el payload va el obj markador
    this.wsService.emit('marcador-nuevo', customMarker );

  }

  escucharSockets(){

    //Asi captamos el evento emitido por el servidor
    this.wsService.listen('marcador-nuevo')
    .subscribe( (marcador:Lugar) =>{
      //console.log('Marcador nuevo');
      //console.log(marcador);

      this.agregarMarcador(marcador);
    });

    //Asi escuchamos el evento emitido por el servidor
    this.wsService.listen('marcador-borrar')
    .subscribe( ( id: string ) =>{
      //console.log('Marcador Borrado');
     // console.log(id);

      //Asi eliminamos el marcador del arreglo
      this.markersMapbox[id].remove();

      //De esta forma eliminamos obj de markersMapboc progresivamente en memoria
      delete this.markersMapbox[id];
    });

    //Asi captamos el evento emitido por el servidor
    this.wsService.listen('marcador-mover')
    .subscribe( (marcador:Lugar) =>{
      //console.log('Marcador nuevo');
     // console.log(marcador);

      //Asi cambiamos las coordenadas del obj en especifico
      this.markersMapbox[ marcador.id.toString() ].setLngLat([marcador.lng, marcador.lat]);
    });

    

  }//Escuchar sockets()

  

}
