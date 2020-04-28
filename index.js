const express = require('express');

// ====== enviroment variables file
require('dotenv').config();

// ======= picks udp request from router
const dgram = require('dgram');

// ======= radius module
var radius_module = require('radius');//decode upd authentification requests from router
radius_module.add_dictionary(__dirname + '/vendor_dictionary/'); //vendor specific router dictionary folder


// ==== handle tcp requets (get/post/delete/etc)
const app = express();



// ===================== radius server =====================


const socket = dgram.createSocket('udp4');// udp socket

// .... radius server secret from .env file or use default

var radius_secret = process.env.RADIUS_SECRET || 'testing123'; //radius secret

// .... listen for udp socket conection requests

socket.on('listening', () => {
  let addr = socket.address();
  console.log(`===========================================\nListening for UDP packets at ${addr.address}:${addr.port}\n===========================================`);
  console.log(`===========================================\nListening for radius Authentification\n\t request on ${addr.address}:${addr.port}\n===========================================`);
  console.log(`===========================================\nListening for radius Accounting request\n\t on ${addr.address}:${addr.port}\n===========================================`);
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

  //console.log(radius_in_message )

  // radius in message types

  //  --------------- access requesting authentification request  ---------------
  if (radius_in_message.code == 'Access-Request') { 


        /* user authentification request from mikrotik  [ console.log(radius_in_message) ]

            Access-Request message :  {
            code: 'Access-Request',
            identifier: 25,
            length: 209,
            authenticator: <Buffer 14 0e 0f 76 33 52 25 5a 10 9c f9 2e 0d ed 72 63>,
            attributes: {
                'NAS-Port-Type': 'Wireless-802.11',
                'Calling-Station-Id': 'C8:94:BB:38:A7:01',
                'Called-Station-Id': 'hotspot1',
                'NAS-Port-Id': 'bridge',
                'User-Name': 'usbwalt',
                'NAS-Port': 2156920838,
                'Acct-Session-Id': '80900006',
                'Framed-IP-Address': '192.168.88.254',
                'Vendor-Specific': {},
                'User-Password': 'usbwalt',
                'Service-Type': 'Login-User',
                'NAS-Identifier': 'MikroTik-OrangeFarm_Extension_9_iCafe',
                'NAS-IP-Address': '192.168.1.2'
            },
            raw_attributes: [xxxxx]
            }
        
        */

        // ... retrive passwords from requests


        console.log('Authentification Access-Request message : ',radius_in_message);


        var  username = radius_in_message.attributes['User-Name'];
        var password =radius_in_message.attributes['User-Password'];
        


        // ... check password against the db


        //if password match // give accepted response

        var  reply_code; //will contain reply code
        var reply_contents = {}; //will contain reply data to be encoded
        var attribute_container = []; //contains atribute data of reply data

        if (username == 'usbwalt' && password == 'usbwalt') {

            reply_code = 'Access-Accept';

        }
        
        //if no match// give rejected response
        else {

            reply_code = 'Access-Reject';

        }

         //--------------------- Authenticated user account limits
             
        // radius_in_message.attributes['Acct-Link-Count'] = '167544565543';
        // radius_in_message.attributes['Acct-Output-Packets'] = '2G';
        
        //Mikrotik-Total-Limit 
        attribute_container.push(['Vendor-Specific', 'Mikrotik',[['Mikrotik-Total-Limit', 4294967290]] ]);
        
       
        // ---------------------- radius authentification attributes
        
        //check attributes, en add to be encoded if they have values // you may need to add more for other routers //tested on mikrotik
       
       
        if(radius_in_message.attributes['NAS-Port-Type']){ //if provided // add to  reply data attributes
            attribute_container.push(['NAS-Port-Type', radius_in_message.attributes['NAS-Port-Type']]);
        }
        if(radius_in_message.attributes['Calling-Station-Id']){ //if provided // add to  reply data attributes
            attribute_container.push(['Calling-Station-Id',radius_in_message.attributes['Calling-Station-Id']]);
        }
        if(radius_in_message.attributes['Called-Station-Id']){ //if provided // add to  reply data attributes
            attribute_container.push(['Called-Station-Id', radius_in_message.attributes['Called-Station-Id']]);
        }
        if(radius_in_message.attributes['NAS-Port-Id']){ //if provided // add to  reply data attributes
            attribute_container.push(['NAS-Port-Id', radius_in_message.attributes['NAS-Port-Id']]);
        }
        if(radius_in_message.attributes['User-Name']){ //if provided // add to  reply data attributes
            attribute_container.push(['User-Name', radius_in_message.attributes['User-Name']]);
        }
        if(radius_in_message.attributes['NAS-Port']){ //if provided // add to  reply data attributes
            attribute_container.push(['NAS-Port', radius_in_message.attributes['NAS-Port']]);
        }
        if(radius_in_message.attributes['Acct-Session-Id']){ //if provided // add to  reply data attributes
            attribute_container.push(['Acct-Session-Id', radius_in_message.attributes['Acct-Session-Id']]);
        }
        if(radius_in_message.attributes['Framed-IP-Address']){ //if provided // add to  reply data attributes
            attribute_container.push( ['Framed-IP-Address', radius_in_message.attributes['Framed-IP-Address']]);
        }


        /* --- This give vendor library name if vendor specific Object has content. [ development was done using mikrotik router for testing : hence vendor is Mikrotik ] ---

        if(radius_in_message.attributes['Vendor-Specific']){ //if provided 

            var vendor_specific_attributes_to_array = [];
            var vendor_provided_attributes_object_array = radius_in_message.attributes['Vendor-Specific'];

            if(Object.keys(vendor_provided_attributes_object_array).length > 0){ //if vendor attributes has object data

                Object.keys(vendor_provided_attributes_object_array).forEach(function(object_property){ //turn object pair to array // required by encode to properly encode data using vendor dictionary // [ https://github.com/retailnext/node-radius ]
                    vendor_specific_attributes_to_array.push([object_property, vendor_provided_attributes_object_array[object_property]]);
                })
            }
            attribute_container.push(['Vendor-Specific', 'Mikrotik', vendor_specific_attributes_to_array]);// include vendor dictionary name en add to  reply data attributes
        }

        */

        /* --- attempt to circumvent the above by replacing with raw attribute that present the vendor line ---  */


        if(radius_in_message.attributes['Vendor-Specific']){

            var vendor_raw_attribute_id = ''; //vendor atribute name default id is 26
            var vendor_raw_attribute_value = ''; // its value is an object

            radius_in_message.raw_attributes.forEach(function(raw_attribute){
  
                 if(raw_attribute[1].toString().indexOf(':') != -1 && Number(raw_attribute[0]) == 26){ //find attributes that has id of 26 [ its a non vendor specific code for [ vendor-specic ] attribute ]
                    
                    
                    /* 
                            ----------------------------------------------------
                             on mikrotik two attribute passes the filter    ;
                            ----------------------------------------------------

                            // Attribute one, when converted from buffer to string give nonsense results, its likely whant im looking for

                            26,  :���X�

                            // attribute two that also passes the filter, its certainly not what im looking for 
                            26,  7*http://192.168.88.1/logout


                            ----------------------------------------------------------------------------------
                                    console log of request from Mikrotik router after being decoded
                            -----------------------------------------------------------------------------------

                            { 
                                code: 'Access-Request',
                                identifier: 56,
                                length: 209,
                                authenticator: <Buffer 2d f6 d6 48 46 b7 d4 47 4a 2a c3 15 39 ee 01 5c>,
                                attributes:
                                { 'NAS-Port-Type': 'Wireless-802.11',
                                    'Calling-Station-Id': '90:2E:1C:69:B3:BA',
                                    'Called-Station-Id': 'hotspot1',
                                    'NAS-Port-Id': 'bridge',
                                    'User-Name': 'usbwalt',
                                    'NAS-Port': 2159018029,
                                    'Acct-Session-Id': '80b0002d',
                                    'Framed-IP-Address': '192.168.88.252',
                                    'Vendor-Specific': { 'Mikrotik-Host-IP': '192.168.88.252' },
                                    'User-Password': 'usbwalt',
                                    'Service-Type': 'Login-User',
                                    'NAS-Identifier': 'MikroTik-OrangeFarm_Extension_9_iCafe',
                                    'NAS-IP-Address': '192.168.88.1' },
                                raw_attributes:
                                [ [ 61, <Buffer 00 00 00 13> ],
                                    [ 31,
                                    <Buffer 39 30 3a 32 45 3a 31 43 3a 36 39 3a 42 33 3a 42 41> ],
                                    [ 30, <Buffer 68 6f 74 73 70 6f 74 31> ],
                                    [ 87, <Buffer 62 72 69 64 67 65> ],
                                    [ 1, <Buffer 75 73 62 77 61 6c 74> ],
                                    [ 5, <Buffer 80 b0 00 2d> ],
                                    [ 44, <Buffer 38 30 62 30 30 30 32 64> ],
                                    [ 8, <Buffer c0 a8 58 fc> ],
                                    [ 26, <Buffer 00 00 3a 8c 0a 06 c0 a8 58 fc> ],
                                    [ 2, <Buffer 79 89 59 bc 2f 98 2f 33 98 11 59 ed 38 28 ac 3e> ],
                                    [ 6, <Buffer 00 00 00 01> ],
                                    [ 26,
                                    <Buffer 00 00 37 2a 03 1c 68 74 74 70 3a 2f 2f 31 39 32 2e 31 36 38 2e 38 38 2e 31 2f 6c 6f 67 6f 75 74> ],
                                    [ 32,
                                    <Buffer 4d 69 6b 72 6f 54 69 6b 2d 4f 72 61 6e 67 65 46 61 72 6d 5f 45 78 74 65 6e 73 69 6f 6e 5f 39 5f 69 43 61 66 65> ],
                                    [ 4, <Buffer c0 a8 58 01> ] ] 
                                
                                }


                                -----------------------------------------------------------------------------

                                attempt was to get a raw value presentation of : 'Vendor-Specific': { 'Mikrotik-Host-IP': '192.168.88.252' },

                                doing that will remove the need to specifiy which vendor library to use to find [ Mikrotik-Host-IP ] id code, 
                                when encoding the message to be sent router that did request, 
                    
                    */


                    if(raw_attribute[1].toString().indexOf(':') < 4){//return attribute thas has ':' closer to position 1, 

                       // console.log(raw_attribute);
                        attribute_container.push(raw_attribute);// included un decoded vendor library name, this way no need to define libary specific to vendor

                    }    

                 }

            });

        }


        if(radius_in_message.attributes['User-Password']){ //if vendor attributes has object data
            attribute_container.push(['User-Password', radius_in_message.attributes['User-Password']]);
        }
        if( radius_in_message.attributes['Service-Type']){ //if vendor attributes has object data
            attribute_container.push(['Service-Type', radius_in_message.attributes['Service-Type']]); 
        } 
        if(radius_in_message.attributes['NAS-Identifier']){ //if vendor attributes has object data
            attribute_container.push(['NAS-Identifier', radius_in_message.attributes['NAS-Identifier']]);
        }
        if(radius_in_message.attributes['NAS-IP-Address']){ //if vendor attributes has object data
            attribute_container.push(['NAS-IP-Address', radius_in_message.attributes['NAS-IP-Address']]);
        }

        // chap authentification password 
        if(radius_in_message.attributes['CHAP-Password']){ //if vendor attributes has object data
            attribute_container.push(['CHAP-Password', radius_in_message.attributes['CHAP-Password']]);
        }

        // console.log('code', reply_code);
        // console.log('secret', radius_secret);
        // console.log(attribute_container);


        // ---------------------- authetification reply components

        if(radius_in_message.identifier){ //if identifier provided // add to reply data
            reply_contents.identifier = radius_in_message.identifier;
        }
        if(radius_in_message.authenticator){ //if authentificator provided // add to reply data
            reply_contents.authenticator = radius_in_message.authenticator;
        }

      

        //reply data
        reply_contents.code = reply_code;
        reply_contents.secret = radius_secret;
        reply_contents.attributes = attribute_container;
       


        try{ //encode reply to radius formate
            console.log('reply message not encoded : ',reply_contents);
            var reply = radius_module.encode(reply_contents);
        }
        catch(err){ //if encoding error
            
            console.log('error attempting to encode, reply data : ', err);
            return;
         };


        // ... send reply data

        socket.send(reply, 0, reply.length, reply_info.port, reply_info.address, function(err, bytes) {
           // console.log('reply sending')
            
            if (err) {

              console.log('Error sending response to ', reply_info);
            }

        });

        return;
   
    }


  // --------------- accounting data requesting authentification request  ---------------

  if (radius_in_message.code == 'Accounting-Request') {



    if(radius_in_message.attributes['Acct-Status-Type'] == 'Start' ){ // start accounting data for user

        console.log('Accounting start for user, requested : ', radius_in_message);

       /* accounting start request from mikrotik after user login  [ console.log(radius_in_message) ]
            {
                code: 'Accounting-Request',
                identifier: 22,
                length: 169,
                authenticator: <Buffer a1 80 1d 6a 24 81 b9 72 38 83 c2 7b d7 b1 77 1c>,
                attributes: {
                    'Acct-Status-Type': 'Start',
                    'NAS-Port-Type': 'Wireless-802.11',
                    'Calling-Station-Id': 'C8:94:BB:38:A7:01',
                    'Called-Station-Id': 'hotspot1',
                    'NAS-Port-Id': 'bridge',
                    'User-Name': 'usbwalt',
                    'NAS-Port': 2156920837,
                    'Acct-Session-Id': '80900005',
                    'Framed-IP-Address': '192.168.88.254',
                    'Vendor-Specific': {},
                    'Event-Timestamp': 2020-04-26T17:13:47.000Z,
                    'NAS-Identifier': 'MikroTik-OrangeFarm_Extension_9_iCafe',
                    'Acct-Delay-Time': 1,
                    'NAS-IP-Address': '192.168.1.2'
                },
                raw_attributes: [xxxxxx]
            }

       
       
       */ 


        /* ......  DO WHAT YOU WANT HERE ....... */

            
       // ----------- return response
       // ... prepare reply data
        var reply = radius_module.encode_response({

            packet: radius_in_message,
            code: 'Accounting-Response',
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



    if(radius_in_message.attributes['Acct-Status-Type'] == 'Stop' ){ // stop accounting data  for user

           
        console.log('Accounting stop for user, requested : ', radius_in_message);

        /* -- accounting stop request from mikrotik after user logout  [ console.log(radius_in_message) ]
                     
        {
            code: 'Accounting-Request',
            identifier: 24,
            length: 217,
            authenticator: <Buffer 98 dd 88 fb 22 d1 82 38 ce d2 d1 03 72 f4 2b ce>,
            attributes: {
                'Acct-Status-Type': 'Stop',
                'Acct-Terminate-Cause': 'User-Request',
                'NAS-Port-Type': 'Wireless-802.11',
                'NAS-Port-Type': 'Wireless-802.11',
                'Calling-Station-Id': 'C8:94:BB:38:A7:01',
                'Called-Station-Id': 'hotspot1',
                'NAS-Port-Id': 'bridge',
                'User-Name': 'usbwalt',
                'NAS-Port': 2156920837,
                'Acct-Session-Id': '80900005',
                'Framed-IP-Address': '192.168.88.254',
                'Vendor-Specific': {},
                'Event-Timestamp': 2020-04-26T17:18:31.000Z,
                'Acct-Input-Octets': 185300, ===[upload data in bytes (equates to 180 kilobyte)]===
                'Acct-Output-Octets': 848015, ===[download data in bytes (equates to 848 kilobytes)]===
                'Acct-Input-Gigawords': 0,
                'Acct-Output-Gigawords': 0,
                'Acct-Input-Packets': 7108,
                'Acct-Output-Packets': 18397,
                'Acct-Session-Time': 1089, ====[time used in seconds (equates to 18 minutes )]====
                'NAS-Identifier': 'MikroTik-OrangeFarm_Extension_9_iCafe',
                'Acct-Delay-Time': 1,
                'NAS-IP-Address': '192.168.1.2'
            },
            raw_attributes: [xxxxxx]
            }
        
        
        */
        
     

        /* ......  DO WHAT YOU WANT HERE ....... */


       // ----------- return response
       // ... prepare reply data
       var reply = radius_module.encode_response({

            packet: radius_in_message,
            code: 'Accounting-Response',
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

    if(radius_in_message.attributes['Acct-Status-Type'] == 'Interim-Update' ){ // periodic update of accounting data  for user active session

        

        console.log('Accounting data update for user, requested : ', radius_in_message);

        /*  accounting usage update for active user session from mikrotik  [ console.log(radius_in_message) ]
        {
            code: 'Accounting-Request',
            identifier: 42,
            length: 211,
            authenticator: <Buffer 3b f3 ac 20 81 92 3f 60 39 04 6f 48 98 8f 8f 8b>,
            attributes: {
                'Acct-Status-Type': 'Interim-Update',
                'NAS-Port-Type': 'Wireless-802.11',
                'Calling-Station-Id': 'C8:94:BB:38:A7:01',
                'Called-Station-Id': 'hotspot1',
                'NAS-Port-Id': 'bridge',
                'User-Name': 'usbwalt',
                'NAS-Port': 2156920841,
                'Acct-Session-Id': '80900009',
                'Framed-IP-Address': '192.168.88.254',
                'Vendor-Specific': {},
                'Event-Timestamp': 2020-04-26T18:12:52.000Z,
                'Acct-Input-Octets': 14960,
                'Acct-Output-Octets': 12341,
                'Acct-Input-Gigawords': 0,
                'Acct-Output-Gigawords': 0,
                'Acct-Input-Packets': 86,
                'Acct-Output-Packets': 87,
                'Acct-Session-Time': 60,
                'NAS-Identifier': 'MikroTik-OrangeFarm_Extension_9_iCafe',
                'Acct-Delay-Time': 1,
                'NAS-IP-Address': '192.168.1.2'
            },
            raw_attributes: [xxxxx]
        
        */


        /* ......  DO WHAT YOU WANT HERE ....... */


       // ----------- return response
       // ... prepare reply data
       var reply = radius_module.encode_response({

            packet: radius_in_message,
            code: 'Accounting-Response',
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

    if(radius_in_message.attributes['Acct-Status-Type'] == 'Accounting-On' ){ // set accounting on for user

        
        console.log('Accounting on for user, requested : ', radius_in_message);

        /* -- accounting on request from mikrotik after user login [ console.log(radius_in_message) ]
        
            Accounting on for user, requested :  {
            code: 'Accounting-Request',
            identifier: 23,
            length: 77,
            authenticator: <Buffer f4 54 ce f7 56 da 9f c2 1b 8e 5b 0b 5e a2 c1 0a>,
            attributes: {
                'Acct-Status-Type': 'Accounting-On',
                'NAS-Identifier': 'MikroTik-OrangeFarm_Extension_9_iCafe',
                'Acct-Delay-Time': 0,
                'NAS-IP-Address': '192.168.1.2'
            },
            raw_attributes: [xxxx]
            }
        
        */



        /* ......  DO WHAT YOU WANT HERE ....... */


       // ----------- return response
       // ... prepare reply data
       var reply = radius_module.encode_response({

            packet: radius_in_message,
            code: 'Accounting-Response',
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


    if(radius_in_message.attributes['Acct-Status-Type'] == 'Accounting-Off' ){// set accounting off for user
        console.log('Accounting off for user, requested : ', radius_in_message)

        /*
         { code: 'Accounting-Request',
            identifier: 45,
            length: 42,
            authenticator: <Buffer 20 80 39 b0 07 46 64 5a 04 05 48 97 74 57 b0 73>,
            attributes:
            { 'User-Name': 'usbwalt',
                'Acct-Status-Type': 'Accounting-Off',
                'Acct-Session-Id': '15060' },
            raw_attributes:
            [ [ 1, <Buffer 75 73 62 77 61 6c 74> ],
                [ 40, <Buffer 00 00 00 08> ],
                [ 44, <Buffer 31 35 30 36 30> ] ] 
            }
                    
        */

        
        /* ......  DO WHAT YOU WANT HERE ....... */


       // ----------- return response
       // ... prepare reply data
       var reply = radius_module.encode_response({

            packet: radius_in_message,
            code: 'Accounting-Response',
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

   
   
}


if(radius_in_message.code == 'Status-Server'){// return user account data
    console.log('Accounting + authentification data of user requested : ', radius_in_message)
    /*

    { 
        code: 'Status-Server',
        identifier: 42,
        length: 29,
        authenticator: <Buffer a4 bf 93 d5 32 10 c0 50 64 4a 6d 82 3f 62 2d 90>,
        attributes: { 'User-Name': 'usbwalt' },
        raw_attributes: [ [ 1, <Buffer 75 73 62 77 61 6c 74> ] ] 
    }



    */
          
    return;
}



});



// ===================== non radius -=====================

app.get('/', function(req,res){

    console.log('recieved, get request')
    res.send('hello');
    res.end
})




// -- ports --

app.set('port', process.env.PPORT_TCP || 3000); // set port for TCP with Express
app.listen(process.env.PPORT_TCP || 3000, function(){
    console.log(`===========================================\nListening for TCP request at port : ${process.env.PPORT_TCP || 3000}\n===========================================`);
}); //listen for tcp requests

socket.bind(process.env.PPORT_UDP || 8082);//bind port for udp requests