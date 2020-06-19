# nodejs_radius_server
nodejs radius server built using nodejs-radius, 


## issues ##
1) node js server need to be started and restart on first run to fully load default acc data from mongodb
2) on mikrotik (tested), each time user logs in account is 1,2 megabytes less, has to do with the base2 convertion rate where im converting data from [Gb, Mb, kb] to bytes 

