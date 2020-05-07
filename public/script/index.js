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
// ---- Select authenticating vendor // get vendor list
var device_vendor_names = ''; //stores array of retrived vendors file names
var dictionary_file_names_collcted = false; //will enforce collcetion of dictionary files once per session from server
function authenticating_device_vendor_names(){

    if(dictionary_file_names_collcted){ //if dictionary_file_names_collcted  true/ this function has been run before in this seesion /end function
        profile_attributes_add();//add first run profile attributes
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

// ---- Select authenticating  attributes // get vendor list  dictioary contenst
// function authenticating_device_vendor_content(){

// }

// ---- adds profile attributes with vendor names
var profile_attributes_added_tracking = 0;//gives div id, for profile attributes and tracks numbers to avoid duplicates
function profile_attributes_add(){

    //start tracking 
    profile_attributes_added_tracking = profile_attributes_added_tracking + 1;
    
    if(typeof device_vendor_names == 'string'){ //if device_vendor_names is a string and not an array, end function
        console.log('Error, vendor device names have not been retrived');
        return;
    }
    
    // creatte option menu from array
    var vendor_device_names_options = '<option default>Select Authenticating device vendor</option><option>wifi-radius-standard</option>';

    device_vendor_names.forEach(function(vendor_names){
        //console.log(vendor_names.replace('dictionary.', ''))
        
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
        <div id='${profile_attributes_added_tracking}_device_vendor_attribute_container' class='height_percent_auto full_width_percent'></div>

        <!-- attribute value -->
        <div id='${profile_attributes_added_tracking}_device_vendor_attribute_value_container' class='height_percent_auto full_width_percent'></div>
        <hr>        
   `
    add_by_append('data_main_choice_button_profile_user_create_div', attributes_content);//show profile attribute with selectable device vendor library

}


// ---- get device vendor library file content
var device_vendor_library_attribute_input_box_type = {};//keep track of vendor library attribute value types

function get_device_vendor_file_data(caller_id=0){

    if(caller_id == 0){//if function called with no id to get device vendor library name, end functon
        return;
    }

    var requested_device_vendor_dictionary_file_name = document.getElementById(caller_id).value; //name of dictionary requested / withouth 'dictionary.' prefix
    var url= window.location.origin + '/dictionary_files_content?library_name=' + requested_device_vendor_dictionary_file_name;

    //console.log(url)

      
    $.get(url, function(data, result){

        if(result != 'success'){
            console.log('recieved error when requesting dictionary file name : ' + requested_device_vendor_dictionary_file_name + ' content' + error);
            return;
        }

        if(data == 'unable to scan vendor dictionary file content'){

            console.log('recieved error : unable to scan vendor dictionary filename : ' + requested_device_vendor_dictionary_file_name + 'content, see server logs for error message');
            return;
        }

        //console.log(data);

        //creates attributes options from retrieved attributes data
        device_vendor_library_attribute_input_box_type = {}; //reset attribute type value container, object array

        var device_vendor_attribute_option = '<option default>select Athentification attribute</option>';
        
        data.library_attributes.forEach(function(attribute){
            device_vendor_attribute_option = device_vendor_attribute_option + '<option>' + attribute.attribute_name + '</option>';

            // save attribute type value, by order options are added to div select element
            //console.log(attribute.attribute_type)
            device_vendor_library_attribute_input_box_type[attribute.attribute_name] = [ attribute.attribute_type, data.vendor_library_name ];
            
        })


        var device_vendor_attribute_div = `
            <select id='${caller_id.trim().charAt(0)}_device_vendor_attribute' class='form-control data_main_choice_button_profile_device_vendor_attribute_select w3-margin-top w3-margin-bottom' onchange='show_device_vendor_library_attribute_input_box(this.id)'>
                ${device_vendor_attribute_option}
            </select>`; 

        add_by_innerhtml(`${caller_id.trim().charAt(0)}_device_vendor_attribute_container`, device_vendor_attribute_div);

        //show device vendor dictionary content attributes select 
        hide_show_div(caller_id.trim().charAt(0) + '_device_vendor_attribute', 'show');
      

    });

}

// ---- get device vendor library attribute string or number input box
function show_device_vendor_library_attribute_input_box(caller_id){

    // alert(device_vendor_library_attribute_input_box_type[document.getElementById(caller_id).value]);

    //create text or number input box
    var device_vendor_attribute_div = `
        <input type="${(device_vendor_library_attribute_input_box_type[document.getElementById(caller_id).value][0] == 'string')?'text':'number'}" placeholder="enter Authenticating attribute value" id='${caller_id.trim().charAt(0)}_device_vendor_attribute_value' class='form-control data_main_choice_button_profile_device_vendor_attribute_value' data-library-attribite='${device_vendor_library_attribute_input_box_type[document.getElementById(caller_id).value][1] }'>`; 

    //add input box to user front
    add_by_innerhtml(`${caller_id.trim().charAt(0)}_device_vendor_attribute_value_container`, device_vendor_attribute_div);

    //show attribute add/cancel/save buttons
    hide_show_div('device_vendor_attribute_buttons', 'show');

    //show device vendor dictionary content attributes select 
    hide_show_div(caller_id.trim().charAt(0) + '_device_vendor_attribute_value', 'show');
}


// ---- prepare profile attribute creation menu and show div
// function show_profile_creation_attributes_menu(){

//     //reset elements to default
//     profile_attributes_added_tracking = 1

// }


// --- save attributes as profile
function attributes_profile_save(){

    //check if attributes where added
    if(profile_attributes_added_tracking == 0){//no attribute is selected, give error
        alert("Please fill all attributes.");
        return;
    }

    

    
    var new_profile_name = ''; //profile name

    var new_authentification_profiles = [];//stores new profiles from attributes

    var err_attribute_missing = false;//keep track of error/ prevent processing

    for(var a=1; a <= profile_attributes_added_tracking; a++){

        //get input/select element values
        var div_library_name = document.getElementById( a + '_device_vendor_name').value //get selected library name
        var div_library_attribute_name = document.getElementById( a + '_device_vendor_attribute').value //get selected vendor attribute name
        var div_library_attribute_value = document.getElementById( a + '_device_vendor_attribute_value') //get entered attribute value

        //check if all attribute have been selected
        if(div_library_name == 'Select Authenticating device vendor' || div_library_attribute_name == 'select Athentification attribute' ){

            alert("Please fill all attributes.");

            err_attribute_missing = true;
            break;
        }

        //console.log(a, div_library_name, div_library_attribute_name, div_library_attribute_value.value, div_library_attribute_value.getAttribute('data-library-attribite') );

        //create profile as array
        new_authentification_profiles.push(['Vendor-Specific', div_library_attribute_value.getAttribute('data-library-attribite'),[ [div_library_attribute_name, div_library_attribute_value.value] ] ]);
        
    }

    //check if error was produced by for loop
    if(err_attribute_missing == true){
        return;//end function
    }

    //get name for profile
    new_profile_name = prompt('Please give profile a name.');//ask for name for the profile

    if(new_profile_name == null || new_profile_name.trim().length == 0){// if no name is given, give error alert en end function
        alert('Profile has no name. Please try again')
        return;
    }

    //console.log(new_authentification_profiles);

    // send profile to server
    var url= window.location.origin + '/new_profiles_data';

      
    $.get(url, { new_profiles : [ new_profile_name ,new_authentification_profiles] }, function(data, result){

        if(result != 'success'){//if error

            console.log('recieved error when sending new profile data to server : ' + error);
            alert('error sending new Profile data to server, please try again later.')
            return;
        }

        if(data == 'unable to save new profile data'){// if error

            console.log('recieved error : unable to save new profile data to server, see server logs for error message');
            alert('error saving new Profile data to server, please try again later or contact system administartor.')
            return;
        }

        if(data == 'Name is not unique'){ //if name duplicate error
            console.log('error, Profile name is not unique');

            //give alert
            alert('Profile with name : "' + new_profile_name + '", is already registered.\nPlease provide a different name');

            //restart profile saving function and ask for a name again
            attributes_profile_save();
            return;

        }

        // console.log(result);

        //give success alert
        alert('Success, Profile with name : ' + new_profile_name + ', created.');

        // request newly updated profiles data from server
        attributes_profile_get();

    });


}



// --- get saved profiles
var attributes_profiles = ''; //saved retreived profile attributes

function attributes_profile_get(){

    var url= window.location.origin + '/get_profiles_data';

      
    $.get(url, function(data, result){//request profile data from server

        if(result != 'success'){ //if failed

            console.log('recieved error when requesting new profile data from server : ' + error);
            return;
        }

        if(data == 'profile data not found'){//if issue

            console.log('recieved error : profile data not found, see server logs for error message');
            return;
        }

        //console.log(data);

        // save retrieved profile attributes
        attributes_profiles = data;

        //cleav div of old contents
        add_by_innerhtml('data_main_choice_button_profile_view', '');

        // show profile div
        var profiles_div = '<ol class="w3-margin-top">';

        data.forEach(function(data, index){
            
            profiles_div = profiles_div + `<li class='w3-margin-bottom'><a href='#'>${data[0]}</a></li>`;

        });

        profiles_div = profiles_div + '</ol>';

       //append list to div
       add_by_append('data_main_choice_button_profile_view', profiles_div);

       //clear and hide profile creation menu 
       add_by_innerhtml('data_main_choice_button_profile_user_create_div', '');
       hide_show_div('device_vendor_attribute_buttons', 'hide');      

    });

}

//auto show profiles on page load
attributes_profile_get();


// --- get saved profiles group
function profiles_group_get(){

    $.get('/saved_profiles', function(data, response){

        //console.log(data,response);

        if(response == 'success'){

            //cleav div of old contents
            add_by_innerhtml('data_main_choice_button_profile_profile_group_view', '');

            // show profile group div
            var profiles_group_div = '<ol class="w3-margin-top">';

            data.forEach(function(data, index){
                
                profiles_group_div = profiles_group_div + `<li class='w3-margin-bottom'><a href='#'>${data[0]}</a></li>`;

            });

            profiles_group_div = profiles_group_div + '</ol>';

        //append list to div
        add_by_append('data_main_choice_button_profile_profile_group_view', profiles_group_div);

        //clear and hide profile group creation menu 
        add_by_innerhtml('data_main_choice_button_profile_profile_group_create_menu_attributes', '');
        hide_show_div('data_main_choice_button_profile_profile_group_create_menu', 'hide'); 

            return;
        }

        alert('Error, getting Profile Group data from server.\nPlease try again later, or contact administrator');
        
    })

}

//auto show profiles groups on page load
profiles_group_get();


// --- create new profiles groups
var create_new_profile_group_tracking = 0;//tracks created profiles

function profile_group_create(){

    var profile_create_name_input = ''; //contains input box 

    // clear old contents
    if(create_new_profile_group_tracking == 0){
        add_by_innerhtml('data_main_choice_button_profile_profile_group_create_menu_attributes', '');

        //define input box
        profile_create_name_input = "<input id='profile_group_name_input' type='text' placeholder='Profile group name' class='form-control w3-margin-top '>";
    }
    
    //increment profile tracking 
    create_new_profile_group_tracking = create_new_profile_group_tracking + 1;

    //define iput + or select box
    var profile_group_select_options = `${profile_create_name_input} <select id='${create_new_profile_group_tracking}_profile_groupt_attribute_select' class='form-control w3-margin-top w3-margin-bottom'><option default >Select profile attribute to group</option>`;

    //get retrived attribute from server
    attributes_profiles.forEach(function(data){
        profile_group_select_options = profile_group_select_options + `<option>${data[0]}</option>`;
    });



    profile_group_select_options = profile_group_select_options + '</select>';

    // add option box
    add_by_append('data_main_choice_button_profile_profile_group_create_menu_attributes', profile_group_select_options);


}


// --- save new profiles groups
function profiles_group_save(){

    var get_profifile_group_name = document.getElementById('profile_group_name_input').value;
    var profile_group_attributes = []; //stores selected attributes names

    //get profile attributes 
    var error_found = false;//keep track of error
    for(a = 1; a <= create_new_profile_group_tracking; a++ ){

        var profile_attribute_select = document.getElementById(a + '_profile_groupt_attribute_select').value;

        //check if value is filled
        if(profile_attribute_select == 'Select profile attribute to group' || get_profifile_group_name.trim().length == 0){
            //give alert
            alert('Please fill all required information.');

            //set error found to true
            error_found = true;

            //end loop
            break;
        }

        //keep found profile attributes names
        profile_group_attributes.push(profile_attribute_select);
        

    }


    //check if error was found on loop
    if(error_found){ //if found
        return; //end function
    }
    
    //console.log(profile_group_attributes);

    //save profile group to server
    $.get('/profile_group_save',{'new_profile_group_data' : [ get_profifile_group_name, profile_group_attributes ]}, function(data, response){

        //console.log(data, response);

        //if response recived form server
        if(response == 'success'){

            //if profile group name provided is a duplicate
            if(data == 'error, profile group name already saved'){
                alert('Error, Profile group with name : "' + get_profifile_group_name + '" ,is already created.\n\nPlease try a different name.',)
            }

            //if profile group name is saved
            if(data == 'profile group saved'){
                alert('Success, Profile group with name : "' + get_profifile_group_name + '", created.');

                //update profiles group views
                profiles_group_get();
            }

            return;
        }


        else{ //if error
            alert('Error Creating profile groups, Please try again later or contact adminstrator');
        }

    });



}



