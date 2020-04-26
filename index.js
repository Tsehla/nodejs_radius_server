const express = require('express');

// ====== enviroment variables file
require('dotenv').config();

// ======= picks udp request from router
const dgram = require('dgram');

// ======= radius module
var radius_module = require('radius');//decode upd authentification requests from router


// ==== handle tcp requets (get/post/delete/etc)
const app = express();



// ===================== radius server =====================


const socket = dgram.createSocket('udp4');// udp socket

// .... radius server secret from .env file or use default

var radius_secret = process.env.RADIUS_SECRET || 'testing123'; //radius secret

// .... listen for udp socket conection requests

socket.on('listening', () => {
  let addr = socket.address();
  console.log(`Listening for UDP packets at ${addr.address}:${addr.port}`);
});


// .... if error listening

socket.on('error', (err) => {
  console.error(`UDP error: ${err.stack}`);
});



// .... if client connected and message recieved

socket.on('message', (msg, reply_info) => {
  console.log('Recieved UDP message');
 // console.log('msg',msg)
  //console.log('rinfo',rinfo)

  // decode message recieved 
  var radius_in_message; //will contain decoded message

  try {

    radius_in_message = radius_module.decode({packet: msg, secret:  radius_secret});
    //console.log(radius_in_message);

  } catch(error){

    console.log('error, attempting to decode udp message. ending conncetion :', error);
    return;

  }


  // radius in message types

  // ... access requesting authentification request
  if (radius_in_message.code == 'Access-Request') { 


        /* 
            //Recieved UDP message // example request made by NradPing utility

            { code: 'Access-Request',
            identifier: 9,
            length: 56,
            authenticator: <Buffer 20 20 20 20 20 20 31 35 38 37 39 30 38 37 38 36>,
            attributes:
            { 'User-Name': 'dvdwalt@meshdesk', 'User-Password': 'dvdwalt' },
            raw_attributes:
            [ [ 1, <Buffer 64 76 64 77 61 6c 74 40 6d 65 73 68 64 65 73 6b> ],
                [ 2, <Buffer 9d fb ed 4c 9d 1d df fb 1f 97 60 0d 37 0c ef 4e> ] ] }
        
        */

        // ... retrive passwords from requests

        var  username = radius_in_message.attributes['User-Name'];
        var password =radius_in_message.attributes['User-Password'];


        // ... check password against the db


        //if password match // give accepted response

        var  reply_code; //will contain reply code

        if (username == 'usbwalt' && password == 'usbwalt') {

            reply_code = 'Access-Accept';

        }
        
        //if no match// give rejected response
        else {

            reply_code = 'Access-Reject';

        }


        // ... prepare reply data

        var reply = radius_module.encode_response({

            packet: radius_in_message,
            code: reply_code,
            secret: radius_secret

        });


        // ... send reply data

        socket.send(reply, 0, reply.length, reply_info.port, reply_info.address, function(err, bytes) {
            
            if (err) {

              console.log('Error sending response to ', reply_info);
            }

        });

        return;
   
    }


  // ... accounting data requesting authentification request
  if (radius_in_message.code == 'Accounting-Request') {


    /* 
        // Recieved UDP message// example request made by NradPing utility

        { code: 'Accounting-Request',
        identifier: 10,
        length: 51,
        authenticator: <Buffer 6e 94 b5 78 70 55 40 ac dd b7 a8 cd e2 d7 2c 4b>,
        attributes:
        { 'User-Name': 'dvdwalt@meshdesk',
            'Acct-Status-Type': 'Start',
            'Acct-Session-Id': '15060' },
        raw_attributes:
        [ [ 1, <Buffer 64 76 64 77 61 6c 74 40 6d 65 73 68 64 65 73 6b> ],     
            [ 40, <Buffer 00 00 00 01> ],
            [ 44, <Buffer 31 35 30 36 30> ] ] }
    
    
    
    */

    if(radius_in_message.attributes['Acct-Status-Type'] == 'Start' ){ // start accounting data for user
        console.log('Accounting start for user, requested')
        return;
    }

    if(radius_in_message.attributes['Acct-Status-Type'] == 'Stop' ){ // stop accounting data  for user
        console.log('Accounting stop for user, requested')
        return;
    }

    if(radius_in_message.attributes['Acct-Status-Type'] == 'Interim-Update' ){ // update accounting data  for user
        console.log('Accounting data update for user, requested')
        return;
    }

    if(radius_in_message.attributes['Acct-Status-Type'] == 'Accounting-On' ){ // set accounting on for user
        console.log('Accounting on for user, requested')
        return;
    }

    if(radius_in_message.attributes['Acct-Status-Type'] == 'Accounting-Off' ){// set accounting off for user
        console.log('Accounting off for user, requested')
        return;
    }
   
   
}



});



// ===================== non radius -=====================

app.get('/', function(req,res){

    console.log('recieved, get request')
    res.send('hello');
    res.end
})




// -- ports --

app.set('port', process.env.PPORT_TCP || 8080); // set port for TCP with Express
app.listen(process.env.PPORT_TCP || 8080); //listen for tcp requests
socket.bind(process.env.PPORT_UDP || 8082);//bind port for udp requests