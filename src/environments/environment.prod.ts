import { SocketIoConfig } from 'ngx-socket-io';


//Dependiendo de donde este alojada la app o pwa se puede guardar el url de prod
//como variable de entrono en el respectivo servidor 
export const config: SocketIoConfig = { url: 'https://angularmapbox.herokuapp.com', options: {} };

export const environment = {
  production: false,
  socketIoConfig: config
};
