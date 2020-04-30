//alert()

/* ====== repeatables ======= */

// ---- hide or show div ----
function hide_show_div(div_id, div_action = 'hide'){

    if(div_action == 'hide'){ // if hide or no value provided, hide div
        document.getElementById(div_id).style.display = 'none';
    }

    if(div_action != 'hide'){//if div is anything other than hide
        document.getElementById(div_id).style.display = 'block';
    }

}


// ---- append new line html ----
function add_by_append(div_id, content_to_append){//jquery append will add new contents below available contnets
    $('#' + div_id).append(content_to_append);
    return 0;
}
 
// ----- add new line html by innerHTML -----
function add_by_innerhtml(div_id, content_to_append){//innerHTML will overide old contents on that div
    document.getElementById(div_id).innerHTML = content_to_append;
    return 0;
}


// ============================== body ================================


// ---------------------- Main -----------------------




// ---------------------- Connect -----------------------





// ---------------------- Data -----------------------

// ------ profile
//Select authenticating vendor // get vendor list
var device_vendor_names = ''; //stores array of retrived vendors file names
var dictionary_file_names_collcted = false; //will enforce collcetion of dictionary files once per session from server
function authenticating_device_vendor_names(){

    if(dictionary_file_names_collcted){ //if dictionary_file_names_collcted  true/ this function has been run before in this seesion /end function
        return;
    }

    var url= window.location.origin + '/dictionary_files';

    //console.log(url)

    $.get(url, function(data, result){

        if(result != 'success'){
            console.log('recieved error when requesting dictionary files' + error);
            return;
        }

        if(data == 'unable to scan vendor dictionary directory'){

            console.log('recieved error : unable to scan vendor dictionary directory, see server logs for error message');
            return;
        }

        device_vendor_names = data;// stores vendor device names
         //console.log(data);


        if(data.length > 1){ //if response has contents
            dictionary_file_names_collcted = true; // set to true/ function has been run and names collected
        }
        
        profile_attributes_add();//add first run profile attributes
       

    });


}

//Select authenticating  attributes // get vendor list  dictioary contenst
function authenticating_device_vendor_content(){

}

//adds profile attributes with vendor names
var profile_attributes_added_tracking = 1;//gives div id, for profile attributes and tracks numbers to avoid duplicates
function profile_attributes_add(){
    
    if(typeof device_vendor_names == 'string'){ //if device_vendor_names is a string and not an array, end function
        console.log('Error, vendor device names have not been retrived');
        return;
    }
    
    // creatte option menu from array
    var vendor_device_names_options = '<option default>Select Authenticating device vendor</option><option>wifi-radius-standard</option>';

    device_vendor_names.forEach(function(vendor_names){
        console.log(vendor_names.replace('dictionary.', ''))
        
        if(vendor_names != 'dictionary.wifi-radius-standard'){//skip adding default library/already added at the top
            vendor_device_names_options = vendor_device_names_options +`<option>${vendor_names.replace('dictionary.', '')}</option>`;//create vendo names with no dictionary
        }
    });


   var attributes_content = `    
        <!-- select limit attribute ${profile_attributes_added_tracking} -->
        <!-- device vendor -->
        <select id='${profile_attributes_added_tracking}_device_vendor_name' class='form-control w3-margin-top' onchange='get_device_vendor_file_data(this.id)'>
            ${vendor_device_names_options}
        </select>

        <!-- limit attribute -->
        <select id='${profile_attributes_added_tracking}_device_vendor_attribute' class='form-control data_main_choice_button_profile_device_vendor_attribute_select'>
            <option default>select Athentification attribute</option>
        </select>

        <!-- attribute value -->
        <input type="text" placeholder="enter Authenticating attribute value" id='${profile_attributes_added_tracking}_device_vendor_attribute_value' class='form-control data_main_choice_button_profile_device_vendor_attribute_value'>
        <hr>
        
   `
    add_by_append('data_main_choice_button_profile_user_create_div', attributes_content);//show profile attribute with selectable device vendor library

}


// get device vendor library file contenst

function get_device_vendor_file_data(caller_id=0){

    if(caller_id == 0){//if function called with no id to get device vendor library name, end functon
        return;
    }

    var requested_device_vendor_dictionary_file_name = document.getElementById(caller_id).value; //name of dictionary requested / withouth 'dictionary.' prefix
    var url= window.location.origin + '/dictionary_files_content?library_name=' + requested_device_vendor_dictionary_file_name;

    console.log(url)

    //show device vendor dictionary content attributes select 
    hide_show_div(caller_id.trim().charAt(0) + '_device_vendor_attribute', 'show');

    
    $.get(url, function(data, result){

        if(result != 'success'){
            console.log('recieved error when requesting dictionary file name : ' + requested_device_vendor_dictionary_file_name + ' content' + error);
            return;
        }

        if(data == 'unable to scan vendor dictionary file content'){

            console.log('recieved error : unable to scan vendor dictionary filename : ' + requested_device_vendor_dictionary_file_name + 'content, see server logs for error message');
            return;
        }

        // device_vendor_names = data;// stores vendor device names
        console.log(data);


        // if(data.length > 1){ //if response has contents
        //     dictionary_file_names_collcted = true; // set to true/ function has been run and names collected
        // }
        
        // profile_attributes_add();//add first run profile attributes
       

    });


}


