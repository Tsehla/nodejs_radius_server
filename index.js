// ======== Modules
//express module
var express = require('express');
// fs/ file system module
var fs = require('fs');


// ====== enviroment variables file
require('dotenv').config();

// ======= picks udp request from router
var dgram = require('dgram');

// ======= radius module
var radius_module = require('radius');//decode upd authentification requests from router
radius_module.add_dictionary(__dirname + '/vendor_dictionary/'); //vendor specific router dictionary folder


// ==== handle tcp requets (get/post/delete/etc)
var app = express();




// ===================== Cross servers variabls =====================

//profiles group / allow grouping of attributes 
// -- this allowes adding or removing of login attributes to already existing user accounts
var login_in_account_limit_profile_groups = [ [ 'Mikrotik 4.9 gig data, 1meg download speed',[ 'Mikrotik 4.9 gig total data', 'Mikrotik 4.9 gig total data' ] ] ];

//account profile attributes
// --- vendor specific limits / attributes add-able to profiles
var login_in_account_limit_profile_attributes = [ //stores defined authorization profiles
    ['Mikrotik 4.9 gig total data', ['Vendor-Specific', 'Mikrotik',[['Mikrotik-Total-Limit', 4294967290]] ]]
];

// logged in or logged out users
var  users = [
    {
        name : 'usbwalt', 
        password : 'usbwalt', 
        bind_mac : false, //restrict usage of this account to binded mac
        binded_mac : [],//keep track of binded mac, adheres to [ max_users ] limit
        max_users : 1, //number of users who can use this voucher at same time
        user_device_mac : [], //keep track of mac of users using the vouchers, //mac are removed when user log out
        type_of_account : 'normal', //keep record of account being normal or voucher
        batch_group_name : '', //used to keep track if account is part of batch // usefull for grouping
        last_contact_date :  { 'day_of_week' : '', 'day_of_month' : '', 'month ': '', 'year' : '' }, //used to keep track of reset
        last_contact_time : { 'hour' : '', 'minute': '', 'second' : '' }, //used to keep track of reset
        account_depleted : false, //is voucher reached use limits // may remove this //each login voucher should re-calulate limits
        reset : false, // is account reset-able
        reset_date : { 'day_of_week' : '', 'day_of_month' : '', 'month ': '', 'year' : '' }, // used to reset account limits//day = weekday mon-sun; month = monthDay 1-30/31/28; 
        reset_time : { 'hour' : '', 'minute': '', 'second' : '' },
        active : false, //is voucher active
        creation_date : { 'day_of_week': 2, 'day_of_month': 2, 'month': 4, 'year': 2020 }, //date account created
        first_used_date : { 'day_of_week' : '', 'day_of_month' : '', 'month ': '', 'year' : '' }, //used to allow reset calculation//day = weekday mon-sun; month = monthDay 1-30/31/28; 
        first_used_time : { 'hour' : '', 'minute': '', 'second' : '' },
        expire : true, //is voucher expire
        expire_date : { 'day_of_week' : '', 'day_of_month' : '', 'month ': '', 'year' : '' }, //expires after first activation//day = weekday mon-sun; month = monthDay 1-30/31/28; 
        expire_time : { 'hour' : '', 'minute': '', 'second' : '' },

        profile_attribute_group : '',//keep track of profile attriute, changable

        nas_identifier_id : '', // tracks name of device used to contact radius server
        
        profile_default_data : '',//account limit / at account define
        profile_available_data : '', //account left after each update

        profile_default_time : '',
        profile_available_time : '',

        profile_default_upload : '',
        profile_available_upload : '',

        profile_default_download : '',
        profile_available_download : '',
    
    }


];

/**
 * Here define upload limit for each vendor device or router
 * 
 * Format shuld be 
 * ['device vendor name','limit atribute name'];
 * 
 * Example
 * 
 * [ 'Mikrotik','Mikrotik-Total-Limit']
 * 
 * Add in attribute related array
 * 
 */

var time_limit_define = [ //for time related limits 

    [ 'Mikrotik','Mikrotik-Total-Limit']

]

var upload_limit_define = [
    [ 'Mikrotik','Mikrotik-Total-Limit']
]

var download_limit_define = [
    [ 'Mikrotik','Mikrotik-Total-Limit']

]

var total_download_upload_limit_define = [
    [ 'Mikrotik','Mikrotik-Total-Limit']
]




//radius requesting device name
var nas_identifier = [
    {
        identifier_name : '',
        identifier_ip : '',
        allow : false,
        last_contact : {
            date : {
                day : '',
                month : '',
                year : ''
            },
            time : {
                hour : '',
                minute : '',
                second : '',
            }
        }

    }

];



// ===================== radius server / udp server =====================

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
    console.log(radius_in_message);

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

        if(login_in_account_limit){//add authentification limits, if available
            attribute_container.push(login_in_account_limit);

        }
        
        
       
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
                IF YOU USING NON MIKROTIK ROUTER AND GETTING SOME AUTHENTIFICATION PROBLEM
                1) CHANGE attribute_container.push(['Vendor-Specific', 'Mikrotik', vendor_specific_attributes_to_array]), "MIKROTIK" TO YOU VENDOR RADIUS LIBRARY ID OR NAME, ASK MANUFACTURE FOR THAT
                2) MAKE SURE 'library' FOLDER CONTAINS YOU VENDOR SPECIFIC RADIUS LIBRARY ATTRIBUTES, IF NOT FIND AND ADD THEM
                3) ENABLE THIS
                4) TRY BELOW SOLUTION FIRST, BEFORE THIS

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




     //--- attempt to circumvent the above by replacing with raw attribute that present the vendor line ---  */


    /*              IF YOU USING NON MIKROTIK ROUTER AND GETTING SOME ISSUSUE DOING AUTHENTIFICATION ENABLE THIS,
                        DO NOT ENABLE THE ABOVE, 



        if(radius_in_message.attributes['Vendor-Specific']){

            var vendor_raw_attribute_id = ''; //vendor atribute name default id is 26
            var vendor_raw_attribute_value = ''; // its value is an object

            radius_in_message.raw_attributes.forEach(function(raw_attribute){
  
                 if(raw_attribute[1].toString().indexOf(':') != -1 && Number(raw_attribute[0]) == 26){ //find attributes that has id of 26 [ its a non vendor specific code for [ vendor-specic ] attribute ]
                    
                    
                    /* *
                    
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
                    
                    *//*


                    if(raw_attribute[1].toString().indexOf(':') < 4){//return attribute thas has ':' closer to position 1, 

                       // console.log(raw_attribute);
                        attribute_container.push(raw_attribute);// included un decoded vendor library name, this way no need to define libary specific to vendor

                    }    

                 }

            });

        }

        */

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


// ----- front page serving -----

//serve index html
// app.get('/', function(req,res){

//     res.sendFile(path.resolve('./html/index.html'));
  
// });


//---- log requests of tcp incoming ----
app.use(function(req, res,next){
    console.log(req.protocol + '://' + req.get('host') + req.originalUrl);//shor url of request
    next()
});

// serve images/scripts/etc
app.use(express.static('public'));



/* ---- radius dictionary ----- */
// --- read dictioanry foder contents

app.get('/dictionary_files', function(req, res){

  
    fs.readdir(__dirname + '/vendor_dictionary/', function (err, files) {
        
        
        if(err){//give error response back

            res.jsonp('unable to scan vendor dictionary directory');
            console.log('Radius :: unable to scan vendor library directory: ' + err);
            return;
        } 
        
        //give sucess response back
        res.jsonp(files);

        //console.log(files);


    });


});


// --- read vendor dictioanary file contents
app.get('/dictionary_files_content', function(req, res){

  
    fs.readFile(__dirname + '/vendor_dictionary/dictionary.'+ req.query.library_name,'utf-8', function (err, file_content) {
        
        
        if(err){

            //if error do search again this time do not add prefix to file name 'dictionaray.'
            fs.readFile(__dirname + '/vendor_dictionary/'+ req.query.library_name,'utf-8', function (err, file_content_) {

                if(err){//give error response back

                    res.jsonp('unable to scan vendor dictionary file content');
                    console.log('Radius :: unable to scan vendor dictionary file content: ' + err);
                    return;
                }
                //pass files to processing function
                send_prepared_attributes_as_response(res, file_content_);
                return;

            });

            return;
            
        }


        //if its internal library requested
        if(req.query.library_name == 'wifi-radius-standard'){
            //console.log(file_content);

            var libary_file_content = file_content.split(/\s/); //slit by white space and turn to array

            var library_file_content_array = [];//contains file content as array

            //process array contents
            libary_file_content.forEach(function(data){

                if(data.trim().length != 0){ //if not an empty space
                    library_file_content_array.push({attribute_name : data, attribute_type : 'string'});//save content as object and push to array
                }
                
            });


            //send response 
            res.jsonp({library_attributes:library_file_content_array,vendor_library_name:'none'});
            return;

        }
        
        //pass files to processing function
        send_prepared_attributes_as_response(res, file_content)
    });

});


    //process vendor attribute library file, and give respose
    function send_prepared_attributes_as_response(res, raw_file_content){
        //console.log(raw_file_content);

        // ----------- filter files, send response -------------
        var vendor_attributes_to_array = raw_file_content.split(/\s/);
        var cleaned_attributes_and_values = [];//store filtered attributes / values names
        var library_vendor_name = 'none';//store registred library vendor name

        //console.log(vendor_attributes_to_array);


        /* =============  i do not know how to deal with 'VALUE' attribute or its purpose /  so im leaving it out ===========

        vendor_attributes_to_array.forEach(function(text, index){

            if(text.trim() == 'ATTRIBUTE' || text.trim() == 'VALUE' ){
                
                if(text.trim() == 'VALUE'){
                        
                    var value_attribute_combined_text = vendor_attributes_to_array[ index + 1] + ' ' + vendor_attributes_to_array[ index + 3 ];
                    cleaned_attributes_and_values.push(value_attribute_combined_text);
                    return;
                }
            
                cleaned_attributes_and_values.push(vendor_attributes_to_array[ index + 1]);
            
            }
        });
            
        */
        vendor_attributes_to_array.forEach(function(text, index){
            
            if(text.trim() == 'ATTRIBUTE'){

                // check if attribute type is number or string
                var attribute_value_type = 'string'

                // position of attribute type can change position when text file is converted to array; do console log (vendor_attributes_to_array); try different files, compare to non converted files
                if(vendor_attributes_to_array[index + 3] == 'integer' && vendor_attributes_to_array[index + 3] != 'VALUE' && vendor_attributes_to_array[index + 3] != 'ATTRIBUTE'){
                    attribute_value_type = 'number';
                }
                else if(vendor_attributes_to_array[index + 4]  == 'integer' && vendor_attributes_to_array[index + 4] != 'VALUE' && vendor_attributes_to_array[index + 4] != 'ATTRIBUTE'){
                    attribute_value_type = 'number';
                }
                else if(vendor_attributes_to_array[index + 5]  == 'integer' && vendor_attributes_to_array[index + 5] != 'VALUE' && vendor_attributes_to_array[index + 5] != 'ATTRIBUTE'){
                    attribute_value_type = 'number';
                }
                else if(vendor_attributes_to_array[index + 6]  == 'integer' && vendor_attributes_to_array[index + 6] != 'VALUE' && vendor_attributes_to_array[index + 6] != 'ATTRIBUTE'){
                    attribute_value_type = 'number';
                }
                else if(vendor_attributes_to_array[index + 7]  == 'integer' && vendor_attributes_to_array[index + 7] != 'VALUE' && vendor_attributes_to_array[index + 7] != 'ATTRIBUTE'){
                    attribute_value_type = 'number';
                }
                else if(vendor_attributes_to_array[index + 8]  == 'integer' && vendor_attributes_to_array[index + 8] != 'VALUE' && vendor_attributes_to_array[index + 8] != 'ATTRIBUTE'){
                    attribute_value_type = 'number';
                }
                else if(vendor_attributes_to_array[index + 9] == 'integer' && vendor_attributes_to_array[index + 9] != 'VALUE' && vendor_attributes_to_array[index + 9] != 'ATTRIBUTE'){
                    attribute_value_type = 'number';
                }
                else if(vendor_attributes_to_array[index + 10] == 'integer' && vendor_attributes_to_array[index + 10] != 'VALUE' && vendor_attributes_to_array[index + 10] != 'ATTRIBUTE'){
                    attribute_value_type = 'number';
                }
                else if(vendor_attributes_to_array[index + 11] == 'integer' && vendor_attributes_to_array[index + 11] != 'VALUE' && vendor_attributes_to_array[index + 11] != 'ATTRIBUTE'){
                    attribute_value_type = 'number';
                }
                else if(vendor_attributes_to_array[index + 12] == 'integer' && vendor_attributes_to_array[index + 12] != 'VALUE' && vendor_attributes_to_array[index + 12] != 'ATTRIBUTE'){
                    attribute_value_type = 'number';
                }
                else if(vendor_attributes_to_array[index + 13] == 'integer' && vendor_attributes_to_array[index + 13] != 'VALUE' && vendor_attributes_to_array[index + 13] != 'ATTRIBUTE'){
                    attribute_value_type = 'number';
                }
                else if(vendor_attributes_to_array[index + 14] == 'integer' && vendor_attributes_to_array[index + 14] != 'VALUE' && vendor_attributes_to_array[index + 14] != 'ATTRIBUTE'){
                    attribute_value_type = 'number';
                }

                //find clean attributes values
                var find_attribute_name = (vendor_attributes_to_array[ index + 1] != '')?vendor_attributes_to_array[ index + 1]: (vendor_attributes_to_array[ index + 2] != '')? vendor_attributes_to_array[ index + 2]:(vendor_attributes_to_array[ index + 4] != '')?vendor_attributes_to_array[ index + 4]: (vendor_attributes_to_array[ index + 5] != '')? vendor_attributes_to_array[ index + 5]:(vendor_attributes_to_array[ index + 6] != '')?vendor_attributes_to_array[ index + 6]: (vendor_attributes_to_array[ index + 7] != '')? vendor_attributes_to_array[ index + 7]:(vendor_attributes_to_array[ index + 8] != '')?vendor_attributes_to_array[ index + 8]: (vendor_attributes_to_array[ index + 9] != '')? vendor_attributes_to_array[ index + 9]:(vendor_attributes_to_array[ index + 10] != '')? vendor_attributes_to_array[ index + 10]:(vendor_attributes_to_array[ index + 11] != '')? vendor_attributes_to_array[ index + 11]:(vendor_attributes_to_array[ index + 12] != '')? vendor_attributes_to_array[ index + 12]:(vendor_attributes_to_array[ index + 13] != '')? vendor_attributes_to_array[ index + 13]:(vendor_attributes_to_array[ index + 14] != '')? vendor_attributes_to_array[ index + 14]:'error, Please check library format and spacing';

                //save attribute value
                cleaned_attributes_and_values.push({attribute_name : find_attribute_name, attribute_type : attribute_value_type});
            
            }

             //find lbrary vendor
             if(text.trim() == 'VENDOR'){
                //console.log(0, vendor_attributes_to_array[index ], 1,vendor_attributes_to_array[index + 1], 2,vendor_attributes_to_array[index + 2],3, vendor_attributes_to_array[index + 3]   )
                
                if(vendor_attributes_to_array[index + 1].length != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 1];//save vendo name
                }
                else if(vendor_attributes_to_array[index + 2] != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 2];//save vendo name
                }
                else if(vendor_attributes_to_array[index + 3] != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 3];//save vendo name
                }
                else if(vendor_attributes_to_array[index + 4] != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 4];//save vendo name
                }
                else if(vendor_attributes_to_array[index + 5] != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 5];//save vendo name
                }
                else if(vendor_attributes_to_array[index + 6] != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 6];//save vendo name
                }
                else if(vendor_attributes_to_array[index + 7] != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 7];//save vendo name
                }
                else if(vendor_attributes_to_array[index + 8] != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 8];//save vendo name
                }
                else if(vendor_attributes_to_array[index + 9] != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 9];//save vendo name
                }
                else if(vendor_attributes_to_array[index + 10] != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 10];//save vendo name
                }
                else if(vendor_attributes_to_array[index + 11] != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 11];//save vendo name
                }
                else if(vendor_attributes_to_array[index + 12] != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 12];//save vendo name
                }
                else if(vendor_attributes_to_array[index + 13] != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 13];//save vendo name
                }
                else if(vendor_attributes_to_array[index + 14] != '' ){

                    library_vendor_name = vendor_attributes_to_array[index + 14];//save vendo name
                }


             }


        });
            
            
        //console.log(cleaned_attributes_and_values);
        //console.log('vendor : ',library_vendor_name);
        //send response
        res.jsonp({library_attributes:cleaned_attributes_and_values,vendor_library_name:library_vendor_name});

    };


// --- save new profile
app.get('/new_profiles_data', function(req, res){

   // console.log(req.query.new_profiles);
    
    // check if profiles name duplicate
    var duplicate_profile_name_found = false;//track if duplicate name found

   login_in_account_limit_profile_attributes.forEach(function(data){

        //console.log(req.query.new_profiles[0],data[0])


        //if duplicate found
        if(req.query.new_profiles[0].toString().trim().toLowerCase() == data[0].toString().trim().toLowerCase()){

            duplicate_profile_name_found = true;//set duplicate found true  
        }


    });

    if(duplicate_profile_name_found){

        // give name duplicate error response, en end function
        res.jsonp('Name is not unique');
        return;
    }

    // ---- save new profiles -----
    login_in_account_limit_profile_attributes.push(req.query.new_profiles);

    //give success response back
    res.jsonp('data recived');


});

// -- get available profiles
app.get('/get_profiles_data', function(req, res){

    //give response back
    //console.log(login_in_account_limit_profile_attributes);
    res.jsonp(login_in_account_limit_profile_attributes);


});



// -- save recieved profile group
app.get('/profile_group_save', function(req, res){

    //console.log(req.query);

    // check names duplicates
    var is_duplicate_found = false; //tracks if duplicate was found

    login_in_account_limit_profile_groups.forEach(function(stored_profile_group_names){
        
        //test each profile group name
        req.query.new_profile_group_data.forEach(function(new_profile_group_names){
            if(new_profile_group_names.toString().trim().toLowerCase() == stored_profile_group_names[0].toString().trim().toLowerCase()){ //if match found
                is_duplicate_found = true;//select en set to true
            }
        })
    });

    //check if duplicate was found
    if(is_duplicate_found == true){

        res.jsonp('error, profile group name already saved');//send error response message
    }

    //no error
    else{

        // save profile group
        login_in_account_limit_profile_groups.push(req.query.new_profile_group_data);// save sent profile group array
        res.jsonp('profile group saved');// give success response
    }

});

// -- get available profile groups
app.get('/saved_profiles', function(req, res){

    res.jsonp(login_in_account_limit_profile_groups);// give stored profile groups

})

// -- get available users accounts
app.get('/user_accounts', function(req, res){

    var stored_users_accounts = [];//strores prepared user accounts

    users.forEach(function(data){//loop through stored users
            
        stored_users_accounts.push({ //extract and store accounts details
            account_username : data.name,
            account_type : data.type_of_account,
            account_depleted : data.account_depleted,
            account_active : data.active,
            account_batch_group_name : data.batch_group_name,
            account_creation_date : data.creation_date,
        });
    });

    //give accounts details as response
    res.jsonp(stored_users_accounts);

});


// -- create user accounts ---

// -- read names list and save to memory
var names_list = []; //stores names list

function read_names_list (){
    
    //clear name list of old contents if any
    names_list = [];

    //get directory files names
    fs.readdir(__dirname + '/world_list/', function (err, files) {
        
        
        if(err){//give error response back

            console.log('User create :: unable to scan names list directory: ' + err);
            return;
        } 
        

        //read contnets of each of the files
        files.forEach(function(data){

            fs.readFile(__dirname + '/world_list/' + data, function (err, files_data) {
                
                if(err){//give error response back
        
                    console.log('User create :: unable to read contents of file "' + data + '" : ' + err);
                    return;
                }

                //console.log(files_data.toString('utf-8').split(/\s/));
                names_list = files_data.toString('utf-8').split(/\s/);//save files names array globally
            });

        });

    });

}

read_names_list ();//auto start on server run;



app.get('/create_user', function(req, res){// create new users

    //console.log(req.query);

    //var user_details = req.query.user_id;
    var data_ptofile = req.query.data_profile;
    var total_accounts = req.query.total_account;
    var batch_group_name = req.query.account_group_name;
    var voucher_username_suffix = req.query.voucher_username_suffix;

    //get voucher codes and usernames  passowrd + passwords
    var username_voucher_code = '';
    var user_pasword = '';
    
    //holds usernames
    var new_user_usernames = [];

    // ----- check if type of account to produce

    //if normal accont
    if(req.query.account_type == 'normal'){ 

        //check if more than one account to produce
        if(total_accounts == ''){ //if total account not specified
            
            //set unsername + suffix
            username_voucher_code = req.query.user_id['user_name'] + voucher_username_suffix.trim();

            //set password
            user_pasword  = req.query.user_id['get_normal_password'];

            //save usernames to be checked for duplicate
            new_user_usernames.push({'new_account_name' : username_voucher_code, 'new_account_password' : user_pasword});

        }        

    }

    //if voucher account
    if(req.query.account_type == 'voucher'){ 

        //check if more than one account to produce
        if(total_accounts == ''){ //if total account not specified
            
            //set unsername + suffix
            username_voucher_code = req.query.user_id['user_name'] + voucher_username_suffix.trim();

            //set password as username + suffix
            user_pasword  =  req.query.user_id['user_name'] + voucher_username_suffix.trim();

            //save usernames to be checked for duplicate
            new_user_usernames.push({'new_account_name' : username_voucher_code, 'new_account_password' : user_pasword});
        }        

    }
    
    //if batch create unique usernames
    if(parseInt(total_accounts) > 0 ){ //if total account specified

        //check if name list has names
        if(names_list.length < 1000){//if names are less than thousand

            read_names_list ();//attempt names storage lists re-read
       }
       
       // --- find names
       var found_unique_names = 0;//tracks unique names found
       var while_loops = 0; //tracks each lop
       var are_names_fount = 'not yet';//track if names have not been found


       //find names and check 
       while(found_unique_names != parseInt(total_accounts) ){//while names found total is not equal requested names batch total

            //create random
            var random_name = Math.floor(Math.random() * names_list.length);
            var random_password = Math.floor(Math.random() * names_list.length);

            //console.log('name : ',names_list[random_name], ' username : ',names_list[random_password] );

            //check if random username is same as any already registered in the system

            for(var a = 0; a <= users.length - 1; a++){

                //if username and passord
                if(req.query.account_type == 'normal'){
                    
                    //check if username is already used only + batch name
                    if(users[a].name == names_list[random_name].trim().toLowerCase() + voucher_username_suffix.trim().toLowerCase()){//if match found

                        break;//end loop
                    }
                }

                //if voucher
                if(req.query.account_type == 'voucher'){

                    //check for combined user name and password + batch name
                    if(users[a].name == names_list[random_name].trim().toLowerCase() + names_list[random_password].trim().toLowerCase() + voucher_username_suffix.trim().toLowerCase()){//if match found

                        break;//end loop
                    }
                }

                //if loop managed to run till here then the name is unique
                //save username and password
                new_user_usernames.push({ 'new_account_name' : names_list[random_name].trim().toLowerCase(), 'new_account_password' : names_list[random_password].trim().toLowerCase() });

                //increment found names by one
                found_unique_names = found_unique_names + 1;
            }
        
            //loop tracking
            while_loops = while_loops + 1;

            //check if loops number is 3 times total number of name list array length
            if(while_loops == names_list.length * 3){//IF YOUSER BASE GROW BIG, INCREASE THIS, MAXIMUM NUMBER SHOULD BE (names_list.length * names_list.length ), this are possible  username + password combinations
            //if(while_loops == 100){

                console.log('in 1', names_list.length)
                //check if names where not found at last second
                if(found_unique_names != parseInt(total_accounts)){ //if not
                    are_names_fount = false;//set to false
                    console.log('in 2', while_loops)
                }

                //set unique name tracker names equal requested account total batch number
                found_unique_names = parseInt(total_accounts);//cause loop to meet its requirements and end

            }
       }

       //check if names where not found
       if(are_names_fount == false){

            res.jsonp('batch account create, unabled to create unique names, not already taken');//give response

            console.log('batch account create, unabled to create unique names, not already taken');

            return;//end function //
       }


    // -- create batch users accounts
    new_user_usernames.forEach(function(data){

        //console.log(new_user_usernames);

        var username = data.new_account_name + voucher_username_suffix.trim().toLowerCase(); //set username with suffix
        var password = data.new_account_password;//set password

        //if voucher
        if(req.query.account_type == 'voucher'){
            //combine username plus password to one 
            username = data.new_account_name + data.new_account_password + voucher_username_suffix.trim().toLowerCase();//set password same as username

            //set username as password
            password = username ; //set password with suffix
        }

        //call user create function
        user_create_fn (username , password);

       });

    }


    // -- for non batch new accounts ----

    //check for usernames duplicates against existing users
    var duplicates_usernames_exists_single_account = false;//track if duplicates where found

    if(total_accounts == ''){ 
       
        //loop through stored user accounts usernames
   
        new_user_usernames.forEach(function(new_users){ //loop through provided username array

            users.forEach(function(data, index){ //loop through stored user accounts usernames

                if(new_users.new_account_name.toLowerCase() == data.name){ //compare stored user account names with new user account names
                    
                    duplicates_usernames_exists_single_account = true; //if match set true
                        
                }
    
                //if no match and main loop is on last run
                if(index == users.length -1 && duplicates_usernames_exists_single_account == false){
                            
                    // call user create function
                    user_create_fn (new_users.new_account_name, new_users.new_account_password);
                         
                }

            });
            

        });
    }



    //if duplicate found end processing, send message
    if(duplicates_usernames_exists_single_account == true){//if true

        res.jsonp('Error, username or voucher code duplicate'); //send message
        return; //end function
    }

    // ----- create user
     
    function user_create_fn (username, password){

        //time stamp
        var date = new Date();

        var new_user = 
        {
            name : username, 
            password : password, 
            bind_mac : false, //restrict usage of this account to binded mac
            binded_mac : [],//keep track of binded mac, adheres to [ max_users ] limit
            max_users : 1, //number of users who can use this voucher at same time
            user_device_mac : [], //keep track of mac of users using the vouchers, //mac are removed when user log out
            type_of_account : req.query.account_type, //keep record of account being normal or voucher
            batch_group_name : batch_group_name, //used to keep track if account is part of batch // usefull for grouping
            last_contact_date : { 'day_of_week' : '', 'day_of_month' : '', 'month': '', 'year' : '' }, //used to keep track of reset
            last_contact_time : { 'hour' : '', 'minute': '', 'second' : '' }, //used to keep track of reset
            account_depleted : false, //is voucher reached use limits // may remove this //each login voucher should re-calulate limits
            reset : false, // is account reset-able
            reset_date : { 'day_of_week' : '', 'day_of_month' : '', 'month': '', 'year' : '' }, // used to reset account limits//day = weekday mon-sun; month = monthDay 1-30/31/28; 
            reset_time : { 'hour' : '', 'minute': '', 'second' : '' },
            active : false, //is voucher active
            creation_date : { 'day_of_week' : date.getDay(), 'day_of_month' : date.getDay(), 'month': date.getMonth(), 'year' : date.getFullYear() }, //date account created
            creation_time : { 'hour' : date.getHours(), 'minute': date.getMinutes(), 'second' : date.getSeconds() },
            first_used_date : { 'day_of_week' : '', 'day_of_month' : '', 'month': '', 'year' : '' }, //used to allow reset calculation//day = weekday mon-sun; month = monthDay 1-30/31/28; 
            first_used_time : { 'hour' : '', 'minute': '', 'second' : '' },
            expire : true, //is voucher expire
            expire_date : { 'day_of_week' : '', 'day_of_month' : '', 'month': '', 'year' : '' }, //expires after first activation//day = weekday mon-sun; month = monthDay 1-30/31/28; 
            expire_time : { 'hour' : '', 'minute': '', 'second' : '' },
    
            profile_attribute_group : data_ptofile,//keep track of profile attriute, changable
    
            nas_identifier_id : '', // tracks name of device used to contact radius server
            
            profile_default_data : '',//account limit / at account define
            profile_available_data : '', //account left after each update
    
            profile_default_time : '',
            profile_available_time : '',
    
            profile_default_upload : '',
            profile_available_upload : '',
    
            profile_default_download : '',
            profile_available_download : '',
    
        
        }
        
    //save user 
    //console.log(new_user)
    users.push(new_user);
    }

    //console.log(users)
    //send account created message
    res.jsonp('account created.');

});





















// -- ports --

app.set('port', process.env.PPORT_TCP || 3000); // set port for TCP with Express
app.listen(process.env.PPORT_TCP || 3000, function(){
    console.log(`===========================================\nListening for TCP request at port : ${process.env.PPORT_TCP || 3000}\n===========================================`);
}); //listen for tcp requests

socket.bind(process.env.PPORT_UDP || 8082);//bind port for udp requests