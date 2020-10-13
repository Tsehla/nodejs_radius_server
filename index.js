// ======== Modules
//express module
var express = require('express');
// fs/ file system module
var fs = require('fs');


// ====== enviroment variables file
require('dotenv').config();

//mongo db 
var mongo_db = require('mongodb').MongoClient;
//mongo obj identity
var ObjectId = require('mongodb').ObjectId

//mongo db link
var db_url = process.env.MONGODB_URI || process.env.MongoDB_URL || 'mongodb://127.0.0.1/';

// ======= picks udp request from router
var dgram = require('dgram');

// ======= radius module
var radius_module = require('radius');//decode upd authentification requests from router
radius_module.add_dictionary(__dirname + '/vendor_dictionary'); //vendor specific router dictionary folder


// ==== handle tcp requets (get/post/delete/etc)
var app = express();




// ===================== Cross servers variabls =====================


// *** account profile attributes ***

// logged in or logged out users ***
 var  users = [];

 //profiles group / allow grouping of attributes 

 var login_in_account_limit_profile_groups=[];

 /* example data format
 var login_in_account_limit_profile_groups =[ //groups profile atributes

    [ '4.9 gig total data',[ '4.9Gb Max data' ] ]

 ]
 */

// --- vendor specific limits / attributes add-able to profiles

var login_in_account_limit_profile_attributes=[];
/* example format
var login_in_account_limit_profile_attributes = [ //stores defined authorization profiles

    ['4.9Gb Max data',
        [
            ['Vendor-Specific','wifi-radius', [['Max-data-total-limit',4294967295 ]]],
            //['Vendor-Specific','Mikrotik', [['Mikrotik-Rate-Limit','1M/1M']]] 
        ]
    ],

];
*/

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

var time_limit_define=[];
 /* example format
var time_limit_define = [ //for time related limits 
    [ 'Mikrotik','Mikrotik-Total-Limit']
]
*/


var upload_limit_define=[];
/* example format
var upload_limit_define = [ //total upload data limits
    [ 'Mikrotik','Mikrotik-Total-Limit']
]
*/


var upload_speed_limit_define=[];
/* example format
var upload_speed_limit_define = [ //upload speed limit
    [ 'Mikrotik','Mikrotik-Xmit-Limit']
    //Mikrotik-Recv-Limit-Gigawords 
]
*/



var download_speed_limit_define=[];
/* example format
var download_speed_limit_define = [ //download speed limit
    [ 'Mikrotik','Mikrotik-Recv-Limit']
    //Mikrotik-Xmit-Limit-Gigawords 
]
*/


var total_download_upload_limit_define =[];
/* example format
var total_download_upload_limit_define = [ //total uploaded + downloaded data limit
     [ 'Mikrotik','Mikrotik-Total-Limit']

    //Mikrotik-Total-Limit-Gigawords
 ]
 */


//radius requesting device name
var nas_identifier = [];










// ==================== mongo db first run ====================

mongo_db.connect(db_url, function(err, db_data){

    if(err){
        console.log('db connection error : ', err);
        return;
    }

  
    // --- create default users in users collection
      
    
    // radius_db.collection('users').find() 
    // .each(function(err, document){

    //     if(err){
    //         console.log('first run db, user finding error : ',err);
    //         return;
    //     }


        
    //     if( document == null){ //if no users in table

    //         //add default users
    //         radius_db.collection('users').insertMany(radius_users, function(err, response){
    //             if(err){
    //                 console.log('db error adding users : ',err);

    //                 return;
    //             }
    //         console.log('default users added to db : ',response);
    
    //         })

    //     }

    //     console.log(document == null)

        
    // });


    //check if user collection if empty

    db_data.db('wifi_radius_db').collection('users').find().toArray(function(err, data){
      
        if(data && data.length == 0){ //if empty

            let default_users = {
                
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
                account_logged_in : false,//track if account is in use
                creation_date : { 'day_of_week': 2, 'day_of_month': 2, 'month': 4, 'year': 2020 }, //date account created
                first_used_date : { 'day_of_week' : '', 'day_of_month' : '', 'month ': '', 'year' : '' }, //used to allow reset calculation//day = weekday mon-sun; month = monthDay 1-30/31/28; 
                first_used_time : { 'hour' : '', 'minute': '', 'second' : '' },
                expire : true, //is voucher expire
                expire_date : { 'day_of_week' : '', 'day_of_month' : '', 'month ': '', 'year' : '' }, //expires after first activation//day = weekday mon-sun; month = monthDay 1-30/31/28; 
                expire_time : { 'hour' : '', 'minute': '', 'second' : '' },
                  
                //profile_attribute_group : '4.9 gig total data',//keep track of profile attriute, changable
          
                //profile_attribute_group : 'Mikrotik 4.9 gig data, 1meg download speed',//keep track of profile attriute, changable
                  
                profile_attribute_group : '4.9 gig total data',//keep track of profile attriute, changable
                nas_identifier_id : '', // tracks name of device used to contact radius server
          
                multi_share : false, //allow single profile to attributes to be used by diffrent divice, and specific device usage tracking
          
                multi_share_mac : [ //keep track of devices [mac] sharing profile
                    {
                        'device_mac_id' : '',
                        last_contact_date :  { 'day_of_week' : '', 'day_of_month' : '', 'month ': '', 'year' : '' },
                        last_contact_time : { 'hour' : '', 'minute': '', 'second' : '' },
                        reset : false,
                        //reset_date : { 'day_of_week' : '', 'day_of_month' : '', 'month ': '', 'year' : '' },
                        //reset_time : { 'hour' : '', 'minute': '', 'second' : '' }
                        account_logged_in : false,//track if account is in use
          
                        usage : {
                            profile_used_data : 0,
                            profile_used_time : 0,
                            profile_used_upload : 0,
                            profile_used_download : 0,
                        }
                    }
                ],
          
                //account usage track
                profile_used_data : 0, 
          
                profile_used_time : 0,
          
                profile_used_upload : 0,
          
                profile_used_download : 0,
          
                authentications_request_logs : [//keep logs of account authentificaton activity
                    { 
                        'username' : '',
                        'password' : '',
                        'mac_id' : '',
                        'ip' : '',
                        'date' : '',
                        'time' : '',
                        'status' : 'rejected/accepted'
                    }
                ]
              
            };
      

            //add default users
            db_data.db('wifi_radius_db').collection('users').insertOne(default_users, function(err){

                if(err){
                    console.log('db error adding "users" : ',err);

                    return;
                }

                //console.log('default "radius_users" added to db : ',response);
                console.log('default "users" added to db ');
    
            })
        }

        // //update cross server user variable
        // db_data.db('wifi_radius_db').collection('users').find().each(function(err, data){

        //     if(err){

        //         console.log('first run "users" update error : ', err);
        //         return;
        //     }

        //     users.push(data);

        //     console.log('first run "users" updated');
        // });

    });




    // --- limit profiles group default
    //check if profile group collection is empty
    db_data.db('wifi_radius_db').collection('login_in_account_limit_profile_groups').find().toArray(function(err, data){
      
        if(data && data.length == 0){ //if empty

            //profiles group / allow grouping of attributes 
            var default_login_in_account_limit_profile_groups = [

                {
                    data : [ '4.9 gig total data',[ '4.9Gb Max data' ] ],
                    profile_group_attributes_properties : {time_or_data_limit : 'data_limited', when_to_reset : 'once off use'}
                },
                {
                    data : [ "200Mb max data", [ "200mb" ] ],
                    profile_group_attributes_properties : {time_or_data_limit : 'data_limited', when_to_reset : 'once off use'}
                },
                {
                    data : [ "100Mb max data", [ "100mb" ] ],
                    profile_group_attributes_properties : {time_or_data_limit : 'data_limited', when_to_reset : 'once off use'}
                },
                {
                    data : [ "500Mb max data", [ "500mb" ] ],
                    profile_group_attributes_properties : {time_or_data_limit : 'data_limited', when_to_reset : 'once off use'}
                },
                {
                    data : [ "3Gb Total data", [ "3Gb max data" ] ],
                    profile_group_attributes_properties : {time_or_data_limit : 'data_limited', when_to_reset : 'once off use'}
                },
                {
                    data : [ "300mb total data", [ "300mb max data" ] ],
                    profile_group_attributes_properties : {time_or_data_limit : 'data_limited', when_to_reset : 'once off use'}
                },
                {
                    data : [ "unlimited", [ "no limit" ] ],
                    rofile_group_attributes_properties : {time_or_data_limit : null, when_to_reset : '0'}
                },

            ]


            //add default login_in_account_limit_profile_groups
            db_data.db('wifi_radius_db').collection('login_in_account_limit_profile_groups').insertMany(default_login_in_account_limit_profile_groups, function(err){

                if(err){
                    console.log('db error adding " login_in_account_limit_profile_groups " : ',err);

                    return;
                }

                //console.log('default "login_in_account_limit_profile_groups" added to db : ',response);
                console.log('default "login_in_account_limit_profile_groups" added to db');
    
            })
        }

        //update cross server login_in_account_limit_profile_groups variable
        db_data.db('wifi_radius_db').collection('login_in_account_limit_profile_groups').find().each(function(err, data){
            
            if(err){

                console.log('first run "login_in_account_limit_profile_groups" update error : ', err);
                return;
            }

            if(data){//if not null
                login_in_account_limit_profile_groups.push(data);
                console.log('first run "login_in_account_limit_profile_groups" updated');
            }
        
        });

    });



    // --- profiles attributes
    //check if profile attributes collection is empty
    db_data.db('wifi_radius_db').collection('login_in_account_limit_profile_attributes').find().toArray(function(err, data){
      
        if(data && data.length == 0){ //if empty

        //profiles group / allow grouping of attributes 
        var default_login_in_account_limit_profile_attributes = [
        
               {
                   data: ['4.9Gb Max data',
                        [
                            ['Vendor-Specific','wifi-radius', [['Max-data-total-limit',4294967295 ]]],
                            //['Vendor-Specific','Mikrotik', [['Mikrotik-Rate-Limit','1M/1M']]] 
                        ]
                    ],
                    type_of_profile_limit : {time_or_data_limit : 'data_limited', when_to_reset : 'once off use'}
                },
                {
                    data : [ "200mb", [ [ "Vendor-Specific", "wifi-radius", [ [ "Max-data-total-limit", "220000000" ] ] ] ] ],
                    type_of_profile_limit : {time_or_data_limit :' data_limited', when_to_reset : 'once off use'}
                },
                {
                    data : [ "100mb", [ [ "Vendor-Specific", "wifi-radius", [ [ "Max-data-total-limit", "120000000" ] ] ] ] ],
                    type_of_profile_limit : {time_or_data_limit : 'data_limited', when_to_reset : 'once off use'}
                },
                {
                    data : [ "500mb", [ [ "Vendor-Specific", "wifi-radius", [ [ "Max-data-total-limit", "520000000" ] ] ] ] ],
                    type_of_profile_limit : {time_or_data_limit :' data_limited', when_to_reset : 'once off use'}
                },
                {
                    data : [ "3Gb max data", [ [ "Vendor-Specific", "wifi-radius", [ [ "Max-data-total-limit", "3221225472" ] ] ] ] ],
                    type_of_profile_limit : {time_or_data_limit : 'data_limited', when_to_reset : 'once off use'}
                },
                {
                    data : [ "300mb max data", [ [ "Vendor-Specific", "wifi-radius", [ [ "Max-data-total-limit", "320000000" ] ] ] ] ],
                    type_of_profile_limit : {time_or_data_limit : 'data_limited', when_to_reset : 'once off use'}
                },
                {
                    data : [ "no limit", [ [ "Vendor-Specific", "wifi-radius", [ [ "Usage-reset-type-value", "0" ] ] ] ] ],
                    rofile_group_attributes_properties : {time_or_data_limit : null, when_to_reset : '0'}
                }
                

            ];
            //add default login_in_account_limit_profile_attributes
            db_data.db('wifi_radius_db').collection('login_in_account_limit_profile_attributes').insertMany(default_login_in_account_limit_profile_attributes, function(err){

                if(err){
                    console.log('db error adding " login_in_account_limit_profile_attributes " : ',err);

                    return;
                }

                //console.log('default "login_in_account_limit_profile_groups" added to db : ',response);
                console.log('default "login_in_account_limit_profile_attributes" added to db');
    
            })
        }

        //update cross server login_in_account_limit_profile_groups variable
        db_data.db('wifi_radius_db').collection('login_in_account_limit_profile_attributes').find().each(function(err, data){

            if(err){

                console.log('first run "login_in_account_limit_profile_attributes" update error : ', err);
                return;
            }

            if(data){//if not null
                login_in_account_limit_profile_attributes.push(data);
                console.log('first run "login_in_account_limit_profile_attributes" updated');
            }

        });

    });



    // --- defined uploads limits -----

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



    // --- time limits
    //check if time limit collection is empty
    db_data.db('wifi_radius_db').collection('time_limit_define').find().toArray(function(err, data){
      
        if(data && data.length == 0){ //if empty

            var default_time_limit_define =  [ 'Mikrotik','Mikrotik-Total-Limit'];
          

            //add default time_limit_define
            db_data.db('wifi_radius_db').collection('time_limit_define').insertOne({data : default_time_limit_define}, function(err){

                if(err){
                    console.log('db error adding " time_limit_define " : ',err);

                    return;
                }

                //console.log('default " time_limit_define " added to db : ',response);
                console.log('default " time_limit_define " added to db : ');
    
            })
        }

        //update cross server time_limit_define variable
        db_data.db('wifi_radius_db').collection('time_limit_define').find().each(function(err, data){

            if(err){

                console.log('first run "time_limit_define" update error : ', err);
                return;
            }

            if(data){//if not null
                time_limit_define.push(data);
                console.log('first run "time_limit_define" updated');
            }

        });

    });




    // --- total upload data limits
    //check if total upload data limits collection is empty
    db_data.db('wifi_radius_db').collection('upload_limit_define').find().toArray(function(err, data){
      
        if(data && data.length == 0){ //if empty

            var default_upload_limit_define = [ 'Mikrotik','Mikrotik-Total-Limit'];
            
            //add default upload_limit_define
            db_data.db('wifi_radius_db').collection('upload_limit_define').insertOne({data : default_upload_limit_define}, function(err){

                if(err){
                    console.log('db error adding " upload_limit_define " : ',err);

                    return;
                }

                //console.log('default "upload_limit_define" added to db : ',response);
                console.log('default "upload_limit_define" added to db');
    
            })
        }

        //update cross server upload_limit_define variable
        db_data.db('wifi_radius_db').collection('upload_limit_define').find().each(function(err, data){

            if(err){

                console.log('first run "upload_limit_define" update error : ', err);
                return;
            }
            if(data){//if not null
                upload_limit_define.push(data);
                console.log('first run "upload_limit_define" updated');
            }
        });

    });



    // --- create default upload speed limit 
    //check if upload speed limit collection if empty
    db_data.db('wifi_radius_db').collection('upload_speed_limit_define').find().toArray(function(err, data){
      
        if(data && data.length == 0){ //if empty

            
            var default_upload_speed_limit_define = [ 'Mikrotik','Mikrotik-Xmit-Limit'];
                //Mikrotik-Recv-Limit-Gigawords 
            

            //add default upload_speed_limit_define
            db_data.db('wifi_radius_db').collection('upload_speed_limit_define').insertOne({data : default_upload_speed_limit_define}, function(err){

                if(err){
                    console.log('db error adding " upload_speed_limit_define " : ',err);

                    return;
                }

                //console.log('default "upload_speed_limit_define" added to db : ',response);
                console.log('default "upload_speed_limit_define" added to db : ');
    
            })
        }

        //update cross server upload_speed_limit_define variable
        db_data.db('wifi_radius_db').collection('dupload_speed_limit_define').find().each(function(err, data){
            if(err){

                console.log('first run "dupload_speed_limit_define" update error : ', err);
                return;
            }
            if(data){//if not null
                upload_speed_limit_define.push(data);
                console.log('first run "dupload_speed_limit_define" updated');
            }
        });

    });
    

    

    // --- create default download speed limit 
    //check if download speed limit collection if empty
    db_data.db('wifi_radius_db').collection('download_speed_limit_define').find().toArray(function(err, data){
      
        if(data && data.length == 0){ //if empty

            var default_download_speed_limit_define = [ 'Mikrotik','Mikrotik-Recv-Limit'];
                //Mikrotik-Xmit-Limit-Gigawords 

            //add default download speed limit
            db_data.db('wifi_radius_db').collection('download_speed_limit_define').insertOne({data : default_download_speed_limit_define}, function(err){

                if(err){
                    console.log('db error adding " download_speed_limit_define " : ',err);

                    return;
                }

                //console.log('default "download_speed_limit_define" added to db : ',response);
                console.log('default "download_speed_limit_define" added to db');
    
            })
        }

        //update cross server download_speed_limit_define variable
        db_data.db('wifi_radius_db').collection('download_speed_limit_define').find().each(function(err, data){

            if(err){

                console.log('first run "download_speed_limit_define" update error : ', err);
                return;
            }
            if(data){//if not null

                download_speed_limit_define.push(data);
                console.log('first run "download_speed_limit_define" updated');
            }
        });

    });




    // --- create default total uploaded + downloaded data limit
    //check if total uploaded + downloaded data limit collection if empty
    db_data.db('wifi_radius_db').collection('total_download_upload_limit_define').find().toArray(function(err, data){
      
        if(data && data.length == 0){ //if empty

            var default_total_download_upload_limit_define = [ 'Mikrotik','Mikrotik-Total-Limit'];
            
                //Mikrotik-Total-Limit-Gigawords
           

            //add default total uploaded + downloaded data limit
            db_data.db('wifi_radius_db').collection('total_download_upload_limit_define').insertOne({data : default_total_download_upload_limit_define}, function(err){

                if(err){
                    console.log('db error adding " total_download_upload_limit_define " : ',err);

                    return;
                }

                //console.log('default "total_download_upload_limit_define" added to db : ',response);
                console.log('default "total_download_upload_limit_define" added to db');
            })
        }

        //update cross server total_download_upload_limit_define variable
        db_data.db('wifi_radius_db').collection('total_download_upload_limit_define').find().each(function(err, data){

            if(err){

                console.log('first run "total_download_upload_limit_define" update error : ', err);
                return;
            }
            if(data){//if not null

                total_download_upload_limit_define.push(data);
                console.log('first run "total_download_upload_limit_define" updated');
            }

        });

    });



    // --- create default radius requesting device (nas)
    //check if radius requesting device (nas) collection if empty
    db_data.db('wifi_radius_db').collection('nas_identifier').find().toArray(function(err, data){
      
        if(data && data.length == 0){ //if empty

            var default_nas_identifier = 
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
            
                };


            //add default nas_identifier
            db_data.db('wifi_radius_db').collection('nas_identifier').insertOne(default_nas_identifier, function(err){

                if(err){
                    console.log('db error adding " nas_identifier " : ',err);

                    return;
                }

                //console.log('default "nas_identifier" added to db : ',response);
                console.log('default "nas_identifier" added to db');
    
            })
        }

        //update cross server nas_identifier variable
        db_data.db('wifi_radius_db').collection('nas_identifier').find().each(function(err, data){

            if(err){

                console.log('first run "nas_identifier" update error : ', err);
                return;
            }
                
            if(data){//if not null
                nas_identifier.push(data);
                console.log('first run "nas_identifier" updated');
            }

        });
   



    });

 
   
    //close db connection
    db_data.close;
   

});





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
    //console.log(radius_in_message);

  } catch(error){

    console.log('error, attempting to decode udp message. ending conncetion :', error);
    return;

  }

  //console.log(radius_in_message )

  // radius in message types

  //  --------------- access requesting authentification request  ---------------
    if (radius_in_message.code == 'Access-Request'){


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
       // console.log('Authentification Access-Request message : ',radius_in_message);


        var authentication_username = radius_in_message.attributes['User-Name'];
        var authentication_password =radius_in_message.attributes['User-Password'];
        



        // ... check password against the db ...


        //if password match // give accepted response

        var  reply_code; //will contain reply code // defaut set to reject
        var reply_contents = {}; //will contain reply data to be encoded
        var attribute_container = []; //contains atribute data of reply data


        // ----- check if authenticating device is allowed to use system
            /**
             * 
             *      Nas identifir allowed check here
             *          if not
             *      give reject response
             *      end function
             */


        var authenticated_user; //keep track of authenticated user data


        //find user account from db
        mongo_db.connect(db_url, function(err, db_data){ //connect to db

            if(err){

                console.log('db connection error : ', err);

                reply_code = 'Access-Reject';//give reject response reply to router
                return;
            }


            db_data.db('wifi_radius_db').collection('users').findOne({name : authentication_username, password : authentication_password}, function(error, results){

                if(error){

                    console.log('Error finding users account, for router authentification');

                    reply_code = 'Access-Reject';//give reject response reply to router

                     //send reply to device/router
                     reply_encond_and_send();
                }

               if(!results){//if result == null or undefined or falsey

                    console.log('Error user account not found, for router authentification');

                    reply_code = 'Access-Reject';//give reject response reply to router

                    //send reply to device/router
                    reply_encond_and_send();
               };

               if(results){//if user account found
                    
                    authenticated_user = results;//save users data temporarly

                    reply_code = 'Access-Accept';//give accept response;

                    user_account_limits_set();//apply user account limit

               }


            });

            db_data.close; //close db
        
        });

          
        //user account properties check
        function user_account_limits_set(){


            //--------------------- Authenticated user account limits
            if(authenticated_user.profile_attribute_group.length > 0 ){ //if authentification limits specified

                //-- check if profile group exists
                var authentification_profile_group_data = null;

                //var users_account_array_index = undefined; //temp save position of account in 'users' array

                for(var a = 0; a <= login_in_account_limit_profile_groups.length; a++){//loop throught available profiles

                    if( login_in_account_limit_profile_groups && login_in_account_limit_profile_groups[a] && login_in_account_limit_profile_groups[a].data[0].toString().replace(/[\+\-\*]/gi,' ') == authenticated_user.profile_attribute_group.toString().replace(/[\+\-\*]/gi,' ') ){ //if name match found

                        authentification_profile_group_data = login_in_account_limit_profile_groups[a].data;//save profile group data

                        //users_account_array_index = a;//users acount index
                        break; //end loop
                    }




                }

                // -- if profile group was found
                if(authentification_profile_group_data != null){

                    //console.log(authentification_profile_group_data);

                    // -- get profile attributes

                    var authentification_request_rejected = false;//keep track if account didnt meet any requirements when checking

                    // login_in_account_limit_profile_attributes 
                    authentification_profile_group_data[1].forEach(function(data){ //loop through [profiles group], grouped attributes
                        //console.log(data);

                        //loop through profile attributes en find name matching attributes specified in [ profile group]
                        for(var a = 0; a <= login_in_account_limit_profile_attributes.length -1; a++ ){
                            
                            //  console.log(login_in_account_limit_profile_attributes[a]);
                            //  console.log(login_in_account_limit_profile_attributes[a][0]);
                            

                            if(login_in_account_limit_profile_attributes && login_in_account_limit_profile_attributes[a].data[0] == data){//if name match found


                                //loop through grouped attributes and extract attribute contained
                                login_in_account_limit_profile_attributes[a].data[1].forEach(function(data){

                                
                                    //catch [wifi-radius] library attributes
                                    if(data[1].toLowerCase() == 'wifi-radius'){


                                        //console.log('wifi-radius',data[2][0][0]);

                                        // --- check accounts limits details and process

                                        //check if voucher expired
                                        if(authenticated_user.expire && authenticated_user.active == true &&authentification_request_rejected == false){
                                            
                                            // if account expired, reject login

                                            
                                        }


                                        //check if accounts should be reset
                                        // authenticated_user
                                        if(authenticated_user.reset == true && authentification_request_rejected == false ){

                                            //if account expired and due to reset//reset account and accept login

                                        }
                                    
                                        //check max users limit is reached
                                        if(authenticated_user.user_device_mac.length >= parseInt(authenticated_user.max_users) &&authentification_request_rejected == false){

                                            //if user already active, reject new connection if connection quota for account reached

                                            //reply_code = 'Access-Accept';//give accept response
                                            //authentification_request_rejected == true;//set rejected true
                                        }

                                        //check if mac is binded
                                        if(authenticated_user.bind_mac == true && authentification_request_rejected == false){

                                            //check if mack is binded
                                            // -- loop [authenticated_user.binded_mac ]

                                            //if not, bind current device mac
                                        }

                                        if(data[2][0][0] == 'Max-data-total-limit' && authentification_request_rejected == false){

                                            //check if data is still available
                                            

                                            var to_bytes = data[2][0][1] //hold converted data to bytes
                                            //check if value is in gigabytes

                                           
                                            //check if data is in terabytes
                                            /*
                                            if( to_bytes.search('tb') > -1 || to_bytes.search('tib') > -1 || to_bytes.search('terabyte') > -1 ){

                                                //HANDLE TERABYTES
                                                  
                                            }
                                            */

                                            //if to_bytes is a string
                                            if(typeof to_bytes == 'string'){

                                                //check if data is in gigabtes
                                                if( to_bytes.search('gb') > -1 || to_bytes.search('gib') > -1 || to_bytes.search('gigabyte') > -1 ){

                                                    // covert GB to bytes

                                                    //--base 10
                                                    //to_bytes = parseInt(to_bytes) * 1000000000;

                                                    //--base 2 / binary
                                                    to_bytes = parseInt(to_bytes) * 1073741824;
                                                        


                                                }
                                                
                                                //check if value is in megabyte
                                                if(typeof to_bytes == 'string'&& to_bytes.search('mb') > -1  || to_bytes.search('mib') > -1  || to_bytes.search('megabyte') > -1 ){

                                                    //covert MB to bytes

                                                    //--base 10
                                                    //to_bytes = parseInt(to_bytes) * 1000000;

                                                    //--base 2 / binary
                                                    to_bytes = parseInt(to_bytes) * 1048576;


                                                }

                                                //check if value is in kilobyte
                                                if(typeof to_bytes == 'string'&& to_bytes.search('kb') > -1  || to_bytes.search('kib') > -1  || to_bytes.search('kilobyte') > -1 ){

                                                    //covert KB to bytes

                                                    //--base 10
                                                    //to_bytes = parseInt(to_bytes) * 1000;

                                                    //--base 2 / binary
                                                    to_bytes = parseInt(to_bytes) * 1024;

                                                }



                                                //if its a string that has no storage symbol .ie bytes/kb/mb/gb
                                                //if data come in as a plain number (assume is in bytes ) and turn to type number
                                                to_bytes = parseInt(to_bytes);

                                            }
                                            

                                            //check if usage data if less available data //this will allow profile attributes data value changes that affect all accounts data limit changes without havng to update accounts 
                                            if(parseInt(authenticated_user.profile_used_data) < to_bytes){

                                                //create radius reply 
                                                total_download_upload_limit_define.forEach(function(data){//loop  through max-data usade limit definitions

                                                    if(data){//if not null

                                                        //remaining data in megabytes
                                                        var remaining_data = (to_bytes/1048576) - (parseInt(authenticated_user.profile_used_data)/1048576); 

                                                        //convert to bytes
                                                        remaining_data =  Math.round(remaining_data *  1048576);


                                                        //if remaining is creater than + 3GB in bytes, turn to words to gigs
                                                        //nodejs radius cant encode values creater than 32bit limit/3+gig
                                                        if((remaining_data/1048576) > (3294967295/1024)){ //if incoming data in bytes converted to mb is creater than +3gigs converted to megabytes

                                                            // https://forum.mikrotik.com/viewtopic.php?t=9902
                                                            // remaining_data is over 3gigabyte, dictionary property


                                                        }

                                                        //create reply attribute format
                                                        attribute_container.push(['Vendor-Specific',data.data[0], [[data.data[1],remaining_data ]]]);


                                                    }

                                                });

                                            }

                                            //if usage is higher than available limit when trying to login
                                            if(authenticated_user.profile_used_data >= to_bytes ){

                                                //give response reject
                                                authentification_request_rejected == true;
                                                console.log('Error, data used up for account username : ',authenticated_user.name,', connection rejected.')

                                                //deny account authentification request
                                                reply_code = 'Access-Reject';//give accept response

                                                //set account depleted true on db if not yet updated
                                                if(authenticated_user.account_depleted == false ){

                                                    var user_db_account_id = new ObjectId(authenticated_user._id);//set account id

                                                    //connect to db
                                                    mongo_db.connect(db_url, function(err, db_data){

                                                        if(err){

                                                            console.log('db connection error : ', err);
                                                            return;
                                                        }
                                                        
                                                        db_data.db('wifi_radius_db').collection('users').update(
                                                            {
                                                                '_id' : user_db_account_id
                                                            },{

                                                                $set:{   
                                                                    account_depleted : true
                                                                }
                                                            },
                                                        function(err){


                                                            if(err){
                                                                console.log('error updating "account depleted" to true, on user authentication attempt and saving to db: ',err);
                                                                    

                                                                return;
                                                            }


                                                            db_data.close; //close db
                                                        });

                                                    });  
                                                }
                                            }

                                        }

                                        if(data[2][0][0] ==  'Max-time-limit' && authentification_request_rejected == false){


                                        }

                                        if(data[2][0][0] ==  'Max-upload-limit' && authentification_request_rejected == false){


                                        }

                                        if(data[2][0][0] ==  'Max-download-limit' && authentification_request_rejected == false){


                                        }
                                    

                                    }

                                    //for non vendor specific attributes or radius default or attributes of libraries flagged with none
                                    if(data[1].toLowerCase() == 'none'){

                                        //console.log('none', data[1])
                                        //strip [vendor-specific] and library name
                                        attribute_container.push(data[2][0]);

                                    }


                                    //push none [wifi-radius] vendor specific attribute to be sent back to router with no further processing
                                    if(data[1].toLowerCase() != 'wifi-radius' && data[1] != 'none'){

                                        //console.log('other',data[1])
                                        //save attribute
                                        attribute_container.push(data);
                                    }




                                });

                                break;
                            }
                        }

                    // console.log(authentification_profile_attribute);

                    });

                }
                


            }


            // ++++++++ set/save account changes to profile ++++++

            if( reply_code != 'Access-Reject'){//if accont login is accepted

            
                //set in memory user logged in to true
                //users[users_account_array_index].account_logged_in = true;

                //save to db
                var user_db_account_id = new ObjectId(authenticated_user._id);//set account id

                //connect to db
                mongo_db.connect(db_url, function(err, db_data){

                    if(err){

                        console.log('db connection error : ', err);
                        return;
                    }
                    
                    db_data.db('wifi_radius_db').collection('users').update(
                        {
                            '_id' : user_db_account_id
                        },{

                            $set:{   
                                account_logged_in : true
                            }
                        },
                    function(err){


                        if(err){
                            console.log('error updating "account logged in " to true, on user authentication and saving to db: ',err);
                                

                            return;
                        }


                        db_data.close; //close db
                    });

                });        
            
            }

            //send reply to device/router
            reply_encond_and_send();

        }
        
        // ---------------------- radius authentification attributes

        function reply_encond_and_send(){
            
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


            /* --- This give vendor library name if vendor specific Object has content. [ development was done using mikrotik   router for testing : hence vendor is Mikrotik ] ---
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


            /* IF YOU USING NON MIKROTIK ROUTER AND GETTING SOME ISSUSUE DOING AUTHENTIFICATION ENABLE THIS,
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
        
            //console.log(reply_contents.attributes)

            try{ //encode reply to radius formate
                //console.log('reply message not encoded : ',reply_contents);
                var reply = radius_module.encode(reply_contents);
            }
            catch(err){ //if encoding error
                
                console.log('error attempting to encode, reply data : ', err);
                return;
            };


            // ... send reply data

            socket.send(reply, 0, reply.length, reply_info.port, reply_info.address, function(err) {
            // console.log('reply sending')
                
                if (err) {

                console.log('Error sending response to ', reply_info);
                }

            });

            
       
        }

        return;
   
    }


  // --------------- accounting data requesting authentification request  ---------------

if (radius_in_message.code == 'Accounting-Request') {

    if(radius_in_message.attributes['Acct-Status-Type'] == 'Start' ){ // start accounting data for user

       // console.log('Accounting start for user, requested : ', radius_in_message);

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
        socket.send(reply, 0, reply.length, reply_info.port, reply_info.address, function(err) {
            
            if (err) {

              console.log('Error sending response to ', reply_info);

              return;
            }

             //do status update
            //  user_account_usage_updates({ 
            //     update_status_type : radius_in_message.attributes['Acct-Status-Type'],
            //     user_device_mac_id : radius_in_message.attributes['Calling-Station-Id'],
            //     account_username : radius_in_message.attributes['User-Name'],
            //     nas_identifier_name : radius_in_message.attributes['NAS-Identifier']
            // });

        });
        
        
        return;
    }



    if(radius_in_message.attributes['Acct-Status-Type'] == 'Stop' ){ // stop accounting data  for user

           
       // console.log('Accounting stop for user, requested : ', radius_in_message);

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
        socket.send(reply, 0, reply.length, reply_info.port, reply_info.address, function(err) {
            
            if (err) {

            //console.log('Error sending response to ', reply_info);

            return;
            }

            //do status update on user logout
            user_account_usage_updates({ 
                update_status_type : radius_in_message.attributes['Acct-Status-Type'],
                user_device_mac_id : radius_in_message.attributes['Calling-Station-Id'],
                account_username : radius_in_message.attributes['User-Name'],
                account_upload_use : radius_in_message.attributes['Acct-Input-Octets'],
                account_download_use : radius_in_message.attributes['Acct-Output-Octets'],
                account_upload_use_gig_words : radius_in_message.attributes['Acct-Output-Gigawords'],
                account_download_use_gig_words : radius_in_message.attributes['Acct-Input-Gigawords'],
                usage_session_time : radius_in_message.attributes['Acct-Session-Time'],
                nas_identifier_name : radius_in_message.attributes['NAS-Identifier']
            });

        });


        return;
    }

    if(radius_in_message.attributes['Acct-Status-Type'] == 'Interim-Update' ){ // periodic update of accounting data  for user active session

        

        //console.log('Accounting data update for user, requested : ', radius_in_message);

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
        socket.send(reply, 0, reply.length, reply_info.port, reply_info.address, function(err) {
            
            if (err) {

                //console.log('Error sending response to ', reply_info);
                return;
            }

            //do status update
            // user_account_usage_updates({ 
            //     update_status_type : radius_in_message.attributes['Acct-Status-Type'],
            //     user_device_mac_id : radius_in_message.attributes['Calling-Station-Id'],
            //     account_username : radius_in_message.attributes['User-Name'],
            //     account_upload_use : radius_in_message.attributes['Acct-Input-Octets'],
            //     account_download_use : radius_in_message.attributes['Acct-Output-Octets'],
            //     account_upload_use_gig_words : radius_in_message.attributes['Acct-Output-Gigawords'],
            //     account_download_use_gig_words : radius_in_message.attributes['Acct-Input-Gigawords'],
            //     usage_session_time : radius_in_message.attributes['Acct-Session-Time'],
            //     nas_identifier_name : radius_in_message.attributes['NAS-Identifier']
            // });


        });

        return;
    }

    if(radius_in_message.attributes['Acct-Status-Type'] == 'Accounting-On' ){ // set accounting on for user

        
        //console.log('Accounting on for user, requested : ', radius_in_message);

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
        socket.send(reply, 0, reply.length, reply_info.port, reply_info.address, function(err) {
            
            if (err) {

                console.log('Error sending response to ', reply_info);
            }

        });


        return;
    }


    if(radius_in_message.attributes['Acct-Status-Type'] == 'Accounting-Off' ){// set accounting off for user
       // console.log('Accounting off for user, requested : ', radius_in_message)

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
        socket.send(reply, 0, reply.length, reply_info.port, reply_info.address, function(err) {
            
            if (err) {

            console.log('Error sending response to ', reply_info);
            }

        });

        return;
    }

    //acount usage updates

    function user_account_usage_updates(update_data){

        /* update data log :
        {   coolected update data
            update_status_type : '',
            user_device_mac_id : '',
            account_username : '',
            account_download_use : '',
            account_upload_use : '',
            account_upload_use_gig_words : '',
            account_download_use_gig_words : '',
            usage_session_time : '',
            nas_identifier_name : '',

        }
        */


            
            if(update_data){//if not null
                

                    //if update reason [ start ], (account accounting start notification )
                    if(radius_in_message.attributes['Acct-Status-Type'] == 'Start' ){

                        //set account first use attribute to true or etc

                    }

                                        
                    if(radius_in_message.attributes['Acct-Status-Type'] == 'Stop' ){//when account stop, save account usage s



                        // ---- save new profiles -----                        
                        mongo_db.connect(db_url, function(err, db_data){

                            if(err){

                                console.log('db connection error : ', err);
                                return;
                            }


                            //find user from db
                            db_data.db('wifi_radius_db').collection('users').findOne({name : update_data['account_username']}, function(error, results){

                                if(error){//user search error
                                    console.log('Error finding logged out users account, on db ');
                                }
                
                               if(!results){//if result == null or undefined or falsey
                                    console.log('Error logged out user not found on db ');
                               };


                
                               if(results && results.account_logged_in == true){//if user account found and is logged in
                                    console.log('-------------------------------------------------------------');
                                    console.log('acc name : ', results.name);
                                    console.log('upload bytes : ', (parseInt(update_data['account_upload_use_gig_words']) > 0?parseInt(update_data['account_upload_use_gig_words']):parseInt(update_data['account_upload_use'])))
                                    console.log('download bytes : ', (parseInt(update_data['account_download_use_gig_words']) > 0?parseInt(update_data['account_download_use_gig_words']):parseInt(update_data['account_download_use'])));
                                    console.log('total usage : ', (parseInt(update_data['account_upload_use_gig_words']) > 0?parseInt(update_data['account_upload_use_gig_words']):parseInt(update_data['account_upload_use'])) + (parseInt(update_data['account_download_use_gig_words']) > 0?parseInt(update_data['account_download_use_gig_words']):parseInt(update_data['account_download_use'])))
                                    console.log('session time : ',parseInt(update_data['usage_session_time']))


                                    // ------- update profile usage data ------
                                    
                                    //-- calculate time in minutes
                                    var profile_used_time = (parseInt(results.profile_used_time)/60) + (parseInt(update_data['usage_session_time'])/60);

                                    //-- get upload 
                                    //handle uploads / download gigaword / 64bit number / + 4GB 
                                    var profile_used_upload = parseInt(results.profile_used_upload) + ( parseInt(update_data['account_upload_use_gig_words']) > 0? (parseInt(update_data['account_upload_use_gig_words'])*1024): (parseInt(update_data['account_upload_use'])/1048576) );

                                    //-- get downloads 
                                    // ++handle uploads / download gigaword / 64bit number / + 4GB
                                    var profile_used_download = parseInt(results.profile_used_download)+ ( parseInt(update_data['account_download_use_gig_words']) > 0? (parseInt(update_data['account_download_use_gig_words'])*1024): (parseInt(update_data['account_download_use'])/1048576) );


                                    //-- calculate session accumulative total usage
                                    var profile_used_data = (parseInt(results.profile_used_data)/1048576) + ( parseInt(update_data['account_upload_use_gig_words']) > 0?(parseInt(update_data['account_upload_use_gig_words'])*1024):(parseInt(update_data['account_upload_use'])/1048576) )  + ( parseInt(update_data['account_download_use_gig_words']) > 0?(parseInt(update_data['account_download_use_gig_words'])*1024):(parseInt(update_data['account_download_use'])/1048576) );

                                    console.log('prev total data in bytes : ',results.profile_used_data);
                                    


                                    //STILL TO HANDLE CONDITIONALLY OVER 3 GIG TO BYTE CONVERSION FOR BOTH OR ANY UPLOADS OR DOWNLOADS
                                    //PLUS FOR ALL THREE ON TOTAL DATA USAGE


                                    //convert back :
                                    //time to seconds
                                    profile_used_time = profile_used_time * 60;
                                    

                                    //total uploads to bytes
                                    profile_used_upload = profile_used_upload * 1048576;
                                    //handle more than three gig upload data
                                    if( parseInt(update_data['account_upload_use_gig_words']) > 0 ){
                                        profile_used_upload = profile_used_upload / 1073741824;
                                    }
                                

                                    //total downloads to bytes
                                    profile_used_download = profile_used_download * 1048576;
                                    //handle more than three gig download data
                                    if(parseInt(update_data['account_download_use_gig_words']) ){
                                        profile_used_download = profile_used_download / 1073741824;
                                    }


                                    //total data usage to bytes
                                    profile_used_data = profile_used_data * 1048576;

                                    //console.log('current total data in bytes : ',profile_used_data);



                                    



                                    //  ---- save result on db  ---

                                    //set database user account id
                                    var user_db_account_id = new ObjectId(results._id);
                                    
                                    //save new profile attribute to db
                                    db_data.db('wifi_radius_db').collection('users').update(
                                        {
                                        '_id' : user_db_account_id,
                                            'account_logged_in' : true
                                        },{

                                            $set:{   
                                                profile_used_time : profile_used_time,
                                                profile_used_data : profile_used_data,
                                                profile_used_upload : profile_used_upload,
                                                profile_used_download : profile_used_download,

                                                account_logged_in : false,
                                            }
                                        },
                                    function(err){

                                        if(err){
                                            console.log('error updating user account and saving to db: ',err);

                                        }

                                        //console.log('default "login_in_account_limit_profile_groups" added to db : ',response);
                                        //console.log('user account updated and saved to db');

                                    })
                        

                                }
                
                
                            });

            
                            //close db connection
                            db_data.close;

                        });

                    }
                    
                

            }
        

    }

}


if(radius_in_message.code == 'Status-Server'){// return user account data
    //console.log('Accounting + authentification data of user requested : ', radius_in_message)
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










// ===================== ++++++++++++++++ non radius +++++++++++++++++++ =====================


// ----- front page serving -----

//--------------------------------------
//------------ Cors policy -------------
//--------------------------------------
// app.all(function(req, res, next) {
//     res.header("Access-Control-Allow-Origin", "*");
//     res.header("Access-Control-Allow-Headers", "X-Requested-With");
//     next()
//   });

//---------------------------------------
//---- log requests of tcp incoming ----
//---------------------------------------
app.use(function(req, res,next){
    console.log(req.protocol + '://' + req.get('host') + req.originalUrl);//shor url of request
    
    //---------- cors ----------//cross server communication allow policy
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");

    next()
});

//---------------------------
// serve images/scripts/etc
//----------------------------
app.use(express.static('public'));


//---------------------------------
/* ---- radius dictionary ----- */
//--------------------------------

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

//-------------------------------------------
// --- read vendor dictioanary file contents
//-------------------------------------------
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
            res.jsonp({library_attributes:library_file_content_array,vendor_library_name:'wifi-radius'});
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

//---------------------------------------
// --- save new profile attributes ------
//---------------------------------------
app.get('/new_profiles_data', function(req, res){
    
    // check if profiles name duplicate
    var duplicate_profile_name_found = false;//track if duplicate name found

   login_in_account_limit_profile_attributes.forEach(function(data){


        if(data){//if not null

            //if duplicate found
            if(req.query.new_profiles[0].toString().trim().toLowerCase() == data.data[0].toString().trim().toLowerCase()){

                duplicate_profile_name_found = true;//set duplicate found true  
            }
        }

    });

    if(duplicate_profile_name_found){

        // give name duplicate error response, en end function
        res.jsonp('Name is not unique');
        return;
    }

    //new profile data
    var profile_attributes_data_new = {data : req.query.new_profiles };

    if(req.query.new_profile_extra_data ){//if profile attribute extra data specified

        profile_attributes_data_new.profile_extra_data = req.query.new_profile_extra_data;//attach extra data
    }

    // ---- save new profiles -----
    mongo_db.connect(db_url, function(err, db_data){

        if(err){

            console.log('db connection error : ', err);
            return;
        }
    
        //save new profile attribute to db
        db_data.db('wifi_radius_db').collection('login_in_account_limit_profile_attributes').insertOne(profile_attributes_data_new, function(err){

            if(err){
                console.log('db error adding " login_in_account_limit_profile_attributes " : ',err);
                return;
            }

            //console.log('default "login_in_account_limit_profile_groups" added to db : ',response);
            //console.log('new "login_in_account_limit_profile_attributes" added to db');


            //--- update cross server login_in_account_limit_profile_groups variable

            login_in_account_limit_profile_attributes = []; //clear of old data

            db_data.db('wifi_radius_db').collection('login_in_account_limit_profile_attributes').find().each(function(err, data){

                if(err){
                    console.log('in memory "login_in_account_limit_profile_attributes" update error : ', err);
                    return;
                }
                    if(data){//if not null

                        //add updated data
                        login_in_account_limit_profile_attributes.push(data);
                    }
                
                //console.log('in memory "login_in_account_limit_profile_attributes" updated');

            });
    
        })
        
        //close db connection
        db_data.close;
    });
   

    //give success response back
    res.jsonp('data recived');


});

//--------------------------------------
// -- get available profiles attributes
//--------------------------------------
app.get('/get_profiles_data', function(req, res){

    //give response back
    res.jsonp(login_in_account_limit_profile_attributes);


});


//---------------------------------
// -- save recieved profile group
//----------------------------------
app.get('/profile_group_save', function(req, res){

    // check names duplicates
    var is_duplicate_found = false; //tracks if duplicate was found

    login_in_account_limit_profile_groups.forEach(function(stored_profile_group_names){
        
        if(stored_profile_group_names){//if not null
    
            //test each profile group name
            req.query.new_profile_group_data.forEach(function(new_profile_group_names){

                if(new_profile_group_names.toString().trim().toLowerCase() == stored_profile_group_names.data[0].toString().trim().toLowerCase()){ //if match found
                    is_duplicate_found = true;//select en set to true
                }

            })
        }
    });


    //check if duplicate was found
    if(is_duplicate_found == true){
        res.jsonp('error, profile group name already saved');//send error response message
    }

    //no error
    else{

        var profile_group_to_save_data = {data : req.query.new_profile_group_data};//profile data object array

        if(req.query.profile_group_attributes_properties){//if extra data provided

            profile_group_to_save_data.profile_group_attributes_properties = req.query.profile_group_attributes_properties;//add extra data to profile group
        }

        // save profile group
        
        mongo_db.connect(db_url, function(err, db_data){

            if(err){
                console.log('db connection error : ', err);
                return;
            }
        
            //save new profile attribute to db
            db_data.db('wifi_radius_db').collection('login_in_account_limit_profile_groups').insertOne(profile_group_to_save_data, function(err){
    
                if(err){
                    console.log('db error adding " login_in_account_limit_profile_groups " : ',err);
                    return;
                }
    
                //console.log('default "login_in_account_limit_profile_groups" added to db : ',response);
                //console.log('new "login_in_account_limit_profile_groups" added to db');
    
    
                //update cross server login_in_account_limit_profile_groups variable
                login_in_account_limit_profile_groups = [];//clear old data

                db_data.db('wifi_radius_db').collection('login_in_account_limit_profile_groups').find().each(function(err, data){
    
                    if(err){
                        console.log('in memory "login_in_account_limit_profile_groups" update error : ', err);
                        return;
                    }
                    if(data){//if not null

                        login_in_account_limit_profile_groups.push(data);//add updated data
                        //console.log('in memory "login_in_account_limit_profile_groups" updated');
                    }
    
                });
        
            })
            
            //close db connection
            db_data.close;
        });

        // give success response back
        res.jsonp('profile group saved');

    }

});

//----------------------------------
// -- get available profile groups
//-----------------------------------
app.get('/saved_profiles', function(req, res){

    res.jsonp(login_in_account_limit_profile_groups);// give stored profile groups

})

//----------------------------------
// -- get available users accounts
//----------------------------------
app.get('/user_accounts', function(req, res){

    
    new Promise(function(resolve, reject){//do
            
        //connect to db
        mongo_db.connect(db_url, function(err, db_data){

            if(err){

                console.log('db connection error : ', err);

                reject('error'); //give error
                return;
            }


            db_data.db('wifi_radius_db').collection('users').find()
            .toArray(function(error,data){

                if(error){
                    res.jsonp('error');
                    console.log('Error, cant find users on db');
                    return;
                }

                if(data.length == 0){ //if array empty
                    resolve([]);//give empty users array as response 
                }

                if(data.length > 0){ //if array not empty
                    resolve(data);//give users array as response
                }
                
                db_data.close; //close db connection
            });

            

        });


    }).then(function(users_list){//then
        var stored_users_accounts = [];//stored prepared user account to send to front
       
        users_list.forEach(function(data, index){
                    

            if(data){//if not null
                stored_users_accounts.push({ //extract and store accounts details
                    db_account_id : data._id.toString(),
                    account_username : data.name,
                    account_type : data.type_of_account,
                    account_depleted : data.account_depleted,
                    account_active : data.active,
                    account_batch_group_name : data.batch_group_name,
                    account_creation_date : data.creation_date,
                    account_profile : data.profile_attribute_group,
                    account_upload_download_total_usage : data.profile_used_data,
                    account_time_total_usage : data.profile_used_time,
                });
            }
            
            if(index == users_list.length - 1){//if all users are processed by forEach

                //give accounts details as response
                res.jsonp(stored_users_accounts); 

            }

        })


    }).catch(function(data){//if error

        console.log('err : ', data)
        res.jsonp('error'); //give error response

    })
   


    

});


// -- create user accounts ---

// -- read names list and save to memory
//var names_list = []; //stores names list

// function read_names_list (){
    
//     //clear name list of old contents if any
//     names_list = [];

//     //get directory files names
//     fs.readdir(__dirname + '/world_list/', function (err, files) {
        
        
//         if(err){//give error response back

//             console.log('User create :: unable to scan names list directory: ' + err);
//             return;
//         } 
        

//         //read contnets of each of the files
//         files.forEach(function(data){

//             fs.readFile(__dirname + '/world_list/' + data, function (err, files_data) {
                
//                 if(err){//give error response back
        
//                     console.log('User create :: unable to read contents of file "' + data + '" : ' + err);
//                     return;
//                 }

//                 //console.log(files_data.toString('utf-8').split(/\s/));
//                 names_list = files_data.toString('utf-8').split(/\s/);//save files names array globally
//             });

//         });

//     });

// }

//read_names_list ();//auto start on server run;



app.get('/create_user', function(req, res){// create new users

    //console.log(req.query);

    /**
     * 
     *  add voucher expire option here
     *  if voucher should be shared option here
     *  and all other option here and front
     */

    //var user_details = req.query.user_id;
    var data_ptofile = req.query.data_profile;
    var total_accounts = req.query.total_account;
    var batch_group_name = req.query.account_group_name;
    var voucher_username_suffix = req.query.voucher_username_suffix;

    //get voucher codes and usernames  passowrd + passwords
    var username_voucher_code = '';
    var user_pasword = '';
    
    //holds unique produced usernames
    var new_user_usernames = [];

    var new_user_list = [];//temporary stores new users, to be transfered to database

   // var users = [];//containts retrived db users

    //get users from db
    new Promise(function(resolve, reject){

        //connect to db
        mongo_db.connect(db_url, function(err, db_data){

            if(err){
                console.log('db connection error : ', err);
                return;
            }

            //find stored users
            db_data.db('wifi_radius_db').collection('users').find().toArray(function(err, data){

                if(err){//if search error
                    console.log('error, attempting to retrieve users from db, when creating new users account');
                    reject('error');
                }
      

                if(data.length == 0){ //if array empty
                    resolve([]);//give empty users array as response 
                }

                if(data.length > 0){ //if array not empty
                    resolve(data);//give users array as response
                }

                //close db connection
                db_data.close;
            })


        });

    }).then(function(users){


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
        
        //++++++ if batch create unique usernames ++++++
        if(parseInt(total_accounts) > 0 ){ //if total account specified

            //     //check if name list has names
            //     if(names_list.length < 1000){//if names are less than thousand

            //         read_names_list ();//attempt names storage lists re-read
            //    }



            // names_list = [];

            // //get directory files names
            // fs.readdir(__dirname + '/world_list/', function (err, files) {
                
                
            //     if(err){//give error response back

            //         console.log('User create :: unable to scan names list directory: ' + err);
            //         return;
            //     } 
                

            //     //read contnets of each of the files
            //     files.forEach(function(data){

            //         fs.readFile(__dirname + '/world_list/' + data, function (err, files_data) {
                        
            //             if(err){//give error response back
                
            //                 console.log('User create :: unable to read contents of file "' + data + '" : ' + err);
            //                 return;
            //             }

            //             //console.log(files_data.toString('utf-8').split(/\s/));
            //             names_list = files_data.toString('utf-8').split(/\s/);//save files names array globally
            //         });

            //     });

            // });


            new Promise (function(resolve, reject){

                //get directory files names
                fs.readdir(__dirname + '/world_list/', function (err, files){
                    
                    
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
                            resolve(files_data.toString('utf-8').split(/\s/));//save files names array globally
                        });

                    });

                });
                

            })
            .then(function(data){
            
                var names_list = data;

                // --- find names
                var found_unique_names = 0;//tracks unique names found
                var while_loops = 0; //tracks each lop
                var are_names_fount = 'not yet';//track if names have not been found


                    // //find names and check 
                    // while(found_unique_names != parseInt(total_accounts) ){//while names found total is not equal requested names batch total

                    //     //create random
                    //     var random_name = Math.floor(Math.random() * names_list.length);
                    //     var random_password = Math.floor(Math.random() * names_list.length);

                    //     console.log(random_name, random_password )
                    //     //console.log('name : ',names_list[random_name], ' username : ',names_list[random_password] );

                    //     //check if random username is same as any already registered in the system
                    //     for(var a = 0; a <= users.length - 1; a++){

                    //         if(users[a] != null ){// if not null 

                    //             //if username and passord
                    //             if(req.query.account_type == 'normal'){
                                    
                    //                 //check if username is already used only + batch name
                    //                 if(users[a].name == names_list[random_name].trim().toLowerCase() + voucher_username_suffix.trim().toLowerCase()){//if match found

                    //                     break;//end loop
                    //                 }
                    //             }

                    //             //if voucher
                    //             if(req.query.account_type == 'voucher'){

                    //                 //check for combined user name and password + batch name
                    //                 if(users[a].name == names_list[random_name].trim().toLowerCase() + names_list[random_password].trim().toLowerCase() + voucher_username_suffix.trim().toLowerCase()){//if match found

                    //                     break;//end loop
                    //                 }
                    //             }

                    //             //if loop managed to run till here then the name is unique
                    //             //save username and password
                    //             new_user_usernames.push({ 'new_account_name' : names_list[random_name].trim().toLowerCase(), 'new_account_password' : names_list[random_password].trim().toLowerCase() });
                    //             //console.log(new_user_usernames);

                    //             //increment found names by one
                    //             found_unique_names = found_unique_names + 1;

                    //             if(found_unique_names == parseInt(total_accounts)){
                    //                 console.log('Requirements met, names found ');
                    //                 found_unique_names = parseInt(total_accounts);
                    //                 break;


                    //             }

                    //         }
                    //     }
                        
                    //     //loop tracking
                    //     while_loops = while_loops + 1;

                    //     //check if loops number is 3 times total number of name list array length
                    //     if(while_loops == names_list.length * 3){//IF YOUSER BASE GROW BIG, INCREASE THIS, MAXIMUM NUMBER SHOULD BE (names_list.length * names_list.length ), this are possible  username + password combination

                        
                    //         //check if names where not found at last second
                    //         if(found_unique_names != parseInt(total_accounts)){ //if not
                    //             are_names_fount = false;//set to false
                    //             //console.log('in 2', while_loops)
                    //         }

                    //         //set unique name tracker names equal requested account total batch number
                    //         found_unique_names = parseInt(total_accounts);//cause loop to meet its requirements and end

                    //     }
                    // }


                    //find unique names to use as usernames 
                    while(found_unique_names != parseInt(total_accounts) ){//while names found total is not equal requested names batch total

                        //create random
                        var random_name = Math.floor(Math.random() * names_list.length);
                        var random_password = Math.floor(Math.random() * names_list.length);


                        var unique_name_found = false;//track if unique name is found for each while loop


                        users.forEach(function(data){/* innefient, as it search and copares through all the dictionary words array even if a unique name is found. the "for()" loop is best, but im getting bugs */


                            if(data != null ){// if not null 

                                if(unique_name_found == false){

                                    //if username and passord
                                    if(req.query.account_type == 'normal'){
                                        
                                        //check if username is already used only + batch name
                                        if(data.name == names_list[random_name].trim().toLowerCase() + voucher_username_suffix.trim().toLowerCase()){//if match found

                                            return; //end function

                                        }
                                    }

                                    //if voucher
                                    if(req.query.account_type == 'voucher'){

                                        //check for combined user name and password + batch name
                                        if(data.name == names_list[random_name].trim().toLowerCase() + names_list[random_password].trim().toLowerCase() + voucher_username_suffix.trim().toLowerCase()){//if match found

                                            return;
                                        }
                                    }

                                    //save username and password
                                    new_user_usernames.push({ 'new_account_name' : names_list[random_name].trim().toLowerCase(), 'new_account_password' : names_list[random_password].trim().toLowerCase() });

                                    //increment found names by one
                                    found_unique_names = found_unique_names + 1;

                                    //set unique name found true, for this seach 
                                    unique_name_found = true;

                                    if(found_unique_names == parseInt(total_accounts)){
                                        console.log('Requirements met, names found ');
                                        found_unique_names = parseInt(total_accounts);
                                    
                                    }
                                }

                            }
                        });


                        //loop tracking
                        while_loops = while_loops + 1;

                        //check if loops number is 3 times total number of name list array length
                        if(while_loops == names_list.length * 3){//IF YOUSER USER BASE GROW BIG, INCREASE THIS, MAXIMUM NUMBER SHOULD BE (names_list.length * names_list.length ), this are possible  username + password combination

                        
                            //check if names where not found at last second
                            if(found_unique_names != parseInt(total_accounts)){ //if not
                                are_names_fount = false;//set to false
                                //console.log('in 2', while_loops)
                            }

                            //set unique name tracker names equal requested account total batch number
                            found_unique_names = parseInt(total_accounts);//cause loop to meet its requirements and end

                        }


                    };

                    //check if names where not found
                    if(are_names_fount == false){

                        res.jsonp('batch account create, unabled to create unique names, not already taken');//give response

                        console.log('batch account create, unabled to create unique names, not already taken');

                        return;//end function //
                    }


                    // -- create batch users accounts
                    new_user_usernames.forEach(function(data, index){

                    // console.log(new_user_usernames);

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


                        //if loop at end
                        if(index == new_user_usernames.length - 1){

                            //save users to db
                            save_to_db();
                        }

                    });

            });

        }


        // ++++++ for non batch new accounts +++++++

        //check for usernames duplicates against existing users
        var duplicates_usernames_exists_single_account = false;//track if duplicates where found

        if(total_accounts == ''){ 
        
            //loop through stored user accounts usernames
    
            new_user_usernames.forEach(function(new_users){ //loop through provided username array

                users.forEach(function(data, index){ //loop through stored user accounts usernames

                    if(data){//if not null
                        
                        if(new_users.new_account_name.toLowerCase() == data.name){ //compare stored user account names with new user account names
                            
                            duplicates_usernames_exists_single_account = true; //if match set true
                                
                        }
                    }

                    //if no match and main loop is on last run
                    if(index == users.length -1 && duplicates_usernames_exists_single_account == false){
                                
                        // call user create function
                        user_create_fn (new_users.new_account_name, new_users.new_account_password);
                            
                    }


                    //if loop at end
                    if(index == users.length - 1){

                        //save users to db
                        save_to_db();
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

            new_user_list.push( 
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
                account_logged_in : false,//track if account is in use
                creation_date : { 'day_of_week' : date.getDay(), 'day_of_month' : date.getDay(), 'month': date.getMonth(), 'year' : date.getFullYear() }, //date account created
                creation_time : { 'hour' : date.getHours(), 'minute': date.getMinutes(), 'second' : date.getSeconds() },
                first_used_date : { 'day_of_week' : '', 'day_of_month' : '', 'month': '', 'year' : '' }, //used to allow reset calculation//day = weekday mon-sun; month = monthDay 1-30/31/28; 
                first_used_time : { 'hour' : '', 'minute': '', 'second' : '' },
                expire : true, //is voucher expire
                expire_date : { 'day_of_week' : '', 'day_of_month' : '', 'month': '', 'year' : '' }, //expires after first activation//day = weekday mon-sun; month = monthDay 1-30/31/28; 
                expire_time : { 'hour' : '', 'minute': '', 'second' : '' },
        
                profile_attribute_group : data_ptofile,//keep track of profile attriute, changable
        
                nas_identifier_id : '', // tracks name of device used to contact radius server

                multi_share : false, //allow single profile to attributes to be used by diffrent divice, and specific device usage tracking

                multi_share_mac : [ //keep track of devices [mac] sharing profile
                    {
                        'device_mac_id' : '',
                        last_contact_date :  { 'day_of_week' : '', 'day_of_month' : '', 'month ': '', 'year' : '' },
                        last_contact_time : { 'hour' : '', 'minute': '', 'second' : '' },
                        reset : false,
                        //reset_date : { 'day_of_week' : '', 'day_of_month' : '', 'month ': '', 'year' : '' },
                        //reset_time : { 'hour' : '', 'minute': '', 'second' : '' }
                        account_logged_in : false,//track if account is in use
                        usage : {
                            profile_used_data : 0,
                            profile_used_time : 0,
                            profile_used_upload : 0,
                            profile_used_download : 0,
                        }
                    }
                ],
                
                //account usage track
                profile_used_data : 0, 

                profile_used_time : 0,

                profile_used_upload : 0,

                profile_used_download : 0,
        
            
            });
            
        }


     }).catch(function(err){//if error connecting to db

        res.jsonp('Error');
        console.log('Error, connecting to db and retrieving users.')
    });

    //save user to db

    function save_to_db(){
                    
            mongo_db.connect(db_url, function(err, db_data){

                if(err){

                    console.log('db connection error : ', err);
                    return;
                }
            
                //save new users profile/s attribute to db
                db_data.db('wifi_radius_db').collection('users').insertMany(new_user_list, function(err){

                    if(err){
                        console.log('db error adding " users " : ',err);

                        return;
                    }

                    //console.log('default "users" added to db : ',response);
                    console.log('new "users" added to db');

                    // //get users rom db and update
                    // users = [];//clear users variable old data

                    // db_data.db('wifi_radius_db').collection('users').find().each(function(err, data){
        
                    //     if(err){
        
                    //         console.log('in memory "users" update error : ', err);
                    //         return;
                    //     }
        
                    //     users.push(data);//add updated data
                    //     //console.log('in memory "users" updated');


                    //     //send account created message
                    //     //res.jsonp('account created.');
        
                    // });


                    //if account is from api request : //return username and password

                    if(req.query.external_api_request == 'true'){//if call contains [ external_api_request=true ] in get request i.e external site not from whithin wifi radius
                       
                        //return complete user details as reply
                        res.jsonp(new_user_list);
                        return;
                    }

                    res.jsonp('account created.');
            
                })
                
                //close db connection
                db_data.close;
            });
        }

    
    //update cross server users variable

    // mongo_db.connect(db_url, function(err, db_data){

    //     if(err){

    //         console.log('db connection error : ', err);
    //         return;
    //     }
    //         users = [];//clear users variable old data

    //         db_data.db('wifi_radius_db').collection('users').find().each(function(err, data){

    //             if(err){

    //                 console.log('in memory "users" update error : ', err);
    //                 return;
    //             }

    //             users.push(data);//add updated data

    //             //console.log('in memory "users" updated');

    //         });
        
    //     //close db connection
    //     db_data.close;
    // });




});

//handle delete for now: to expand later
app.get('/remove_voucher_or_user', function(req, res){

    //console.log(req.query.user_id);

        var account_id_to_delete = new ObjectId(req.query.user_id);//set id of account to delete


        mongo_db.connect(db_url, function(err, db_data){

        if(err){
            console.log('user delete db connection error : ', err);
            res.jsonp('error');
            return;
        }

        //request db to delete user or voucher account by id
        db_data.db('wifi_radius_db').collection('users').deleteOne({"_id": account_id_to_delete}, function(err){

            if(err){
                console.log('db error deleting account id : "' + req.query.user_id + '" ' ,err);

                //give error response
                res.jsonp('error');

                return;
            }

            //give success response
            //console.log('db success deleting account id : "' + req.query.user_id + '" ');

            res.jsonp('succes');

        });

         //close db connection
        db_data.close;
          
    });

});

//handle unknown tcp request// send message to hackers
app.get('*',function(req, res){

    res.jsonp('Stop messing with my system, do something usefull for everyone and fck you not, you not that interesting.. 凸 hahaha, couldnt help it anyway, O bane le letsatsi le monate.. not that i care..');
});





















// -- ports --

app.set('port', process.env.PORT || process.env.PORT_TCP); // set port for TCP with Express
app.listen(process.env.PORT || process.env.PORT_TCP, function(){
    console.log(`===========================================\nListening for TCP request at port : ${process.env.PORT || process.env.PORT_TCP}\n===========================================`);
}); //listen for tcp requests

socket.bind(process.env.PORT || process.env.PORT_UDP);//bind port for udp requests
