
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
        new_authentification_profiles.push( ['Vendor-Specific', div_library_attribute_value.getAttribute('data-library-attribite'),[ [div_library_attribute_name, div_library_attribute_value.value] ]] );
        
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

            if(data){//if data not null

                profiles_div = profiles_div + `<li class='w3-margin-bottom'><a href='#'>${data.data[0]}</a></li>`;
            }
            
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


// --- get saved profiles group data 
var retrived_profile_groups = [];// saves retrieved profile group data

function profiles_group_get(){

    $.get('/saved_profiles', function(data, response){

        //console.log(data,response);

        if(response == 'success'){

            //stored retrived profile group data 
            retrived_profile_groups = data;

            //cleav div of old contents
            add_by_innerhtml('data_main_choice_button_profile_profile_group_view', '');

            // show profile group div
            var profiles_group_div = '<ol class="w3-margin-top">';

            data.forEach(function(data, index){
                
                if(data){//if data not null

                    profiles_group_div = profiles_group_div + `<li class='w3-margin-bottom'><a href='#'>${data.data[0]}</a></li>`;
                    
                }
                

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

        if(data){//if data not null

            profile_group_select_options = profile_group_select_options + `<option>${data.data[0]}</option>`;
            
        }

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



// ------ profile

// --------- get vouchers / user accounts ------------
function get_user_accounts(){





    //get accounts data from server
    $.get('/user_accounts', function(data, response){

        //if serer reply
        if(response == 'success'){

            //console.log(data);

            var week_day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sur'];//week days array
            var voucher_element = '';//contain vouchers formatted data
            var users_elements = '';//contain users formatted data

            //create html elements for users and vouchers
            data.forEach(function(data){

                if(data.account_type == 'normal'){//if data belong to normal user account

                    users_elements  = users_elements  + `
                        <tr onclick="alert('Username : ${data.account_username}, View, Edit/Delete menu coming later.')">
                            <th>${data.account_username}</th>
                            <th>${data.account_profile}</th>
                            <th>${data.account_batch_group_name}</th>
                            <th>${week_day[data.account_creation_date.day_of_week] +' '+ data.account_creation_date.day_of_month +'/'+ data.account_creation_date.month +'/'+ data.account_creation_date.year }</th>
                            <th>${data.account_active}</th>
                            <th>${data.account_depleted}</th>
                        </tr>
                    `;
                }

                if(data.account_type == 'voucher'){//if data belong to voucher account
                    voucher_element = voucher_element + `
                    <tr onclick="alert('Username : ${data.account_username}, View, Edit/Delete menu coming later.')">
                        <th>${data.account_username}</th>
                        <th>${data.account_profile}</th>
                        <th>${data.account_batch_group_name}</th>
                        <th>${week_day[data.account_creation_date.day_of_week] +' '+ data.account_creation_date.day_of_month +'/'+ data.account_creation_date.month +'/'+ data.account_creation_date.year }</th>
                        <th>${data.account_active}</th>
                        <th>${data.account_depleted}</th>
                    </tr>
                `;
                }

            });

            //create voucher/users view menu
            var user_vouchers_div = `
                <div id='' class='height_percent_auto full_width_percent resizable_window_min_width w3-margin-top'>

                    <button onclick='hide_show_div("voucher_users_view", "hide");hide_show_div("normal_users_view", "show")' class='w3-button w3-white w3-border w3-border-green w3-margin-top height_percent_auto half_width_percent div_float_left'>Users</button>
                    <button onclick='hide_show_div("normal_users_view", "hide");hide_show_div("voucher_users_view", "show")' class='w3-button w3-white w3-border w3-border-green w3-margin-top height_percent_auto half_width_percent div_float_right'>Vouchers</button>
                
                
                </div>

                <!-- users -->
                <div id='normal_users_view' class='height_percent_auto full_width_percent resizable_window_min_width'> 
                    <hr />
                    <table class="w3-table w3-striped w3-bordered">
                        <tr>
                            <th>User Name</th>
                            <th>Profile</th>
                            <th>Group name</th>
                            <th>Creation date</th>
                            <th>Activated</th>
                            <th>Depleted</th>
                        </tr>
                        ${users_elements}
                    </table>
                </div>

                <!-- voucher -->
                <div id='voucher_users_view' class='height_percent_auto full_width_percent resizable_window_min_width div_display_none '>
                    <table class="w3-table w3-striped w3-bordered ">
                        <tr>
                            <th>User Name</th>
                            <th>Profile</th>
                            <th>Group name</th>
                            <th>Creation date</th>
                            <th>Activated</th>
                            <th>Depleted</th>
                        </tr>
                        ${voucher_element}
                    </table>
                </div>
            `;

            //clean div
            add_by_innerhtml('data_main_choice_button_users_voucher_user_view', '');

            //append users to div
            add_by_append('data_main_choice_button_users_voucher_user_view', user_vouchers_div );
            //console.log(user_vouchers_div)
            return;
        }

        //if server not responded
        alert('Error getting user accounts from server, please try again later or contact administrator');



    })


}
//auto run on system load
get_user_accounts();//get user accounts


// --------- create user ------------

function user_create_menu(usertype){

    if(usertype == 'normal'){ //create normal user [ password + username ]

        //clean normal user create menu
        add_by_innerhtml('data_main_choice_button_users_normal_user_create', '');

        // show normal user create menu
        hide_show_div('data_main_choice_button_users_normal_user_create', 'show'); 

    // contains [ normal ] profiles create elements
        var normal_user_create_div_element = `
            <input id='data_main_choice_button_users_normal_user_create_username' type='text' placeholder='Username' class='form-control w3-margin-top '>
            <input id='data_main_choice_button_users_normal_user_create_password' type='text' placeholder='password' class='form-control w3-margin-top '>
            <select id='data_main_choice_button_users_normal_user_data_group' class='form-control w3-margin-top'>
                <option default>Select data profile</option>
        `
        retrived_profile_groups.forEach(function(data){ //profiles group array contents

            //console.log(data);
            if(data){//data is not null

                normal_user_create_div_element = normal_user_create_div_element + '<option>' + data.data[0] + '</option>'; //add  [ profiles group ] as select options

            }
        });

        // add batch account creation option plus cancel/save buttons
        normal_user_create_div_element = normal_user_create_div_element + `
            </select>

            <div id='' class= 'w3-panel w3-bottomBar w3-center'>
                Batch option
            </div>

            <input id='data_main_choice_button_users_normal_user_batch_total' type='number' placeholder='Total accounts to produce' class='form-control w3-margin-top w3-margin-bottom'>
            <input id='data_main_choice_button_users_normal_user_batch_name' type='text' placeholder='Batch group name' class='form-control w3-margin-top w3-margin-bottom'>
            <input id='data_main_choice_button_users_normal_user_username_suffix' type='text' placeholder='Username suffix' class='form-control w3-margin-top w3-margin-bottom'>

            <div id='' class='height_percent_auto full_width_percent resizable_window_min_width'>

                <button onclick='hide_show_div("data_main_choice_button_users_normal_user_create", "hide")' class='w3-button w3-white w3-border w3-border-red w3-margin-top height_percent_auto half_width_percent div_float_left'>Cancel</button>
                <button onclick='user_create_save("normal")' class='w3-button w3-white w3-border w3-border-blue w3-margin-top height_percent_auto half_width_percent div_float_right'>Create</button>
                
            </div>


        `;

        add_by_append('data_main_choice_button_users_normal_user_create', normal_user_create_div_element);//add menu element to div





        return;
    }

    if(usertype == 'voucher'){ //create voucher type user [ same username + password ]


        //clean normal user create menu
        add_by_innerhtml('data_main_choice_button_users_voucher_user_create', '');

        // show normal user create menu
        hide_show_div('data_main_choice_button_users_voucher_user_create', 'show'); 

    // contains [ normal ] profiles create elements
        var voucher_user_create_div_element = `
            <input id='data_main_choice_button_users_voucher_create_voucher_code' type='text' placeholder='Voucher code' class='form-control w3-margin-top '>
            <select id='data_main_choice_button_users_voucher_create_data_group' class='form-control w3-margin-top'>
                <option default>Select data profile</option>
        `
        retrived_profile_groups.forEach(function(data){ //profiles group array contents

            if(data){//if not null

                voucher_user_create_div_element = voucher_user_create_div_element + '<option>' + data.data[0] + '</option>'; //add  [ profiles group ] as select options
            }

        });

        // add batch account creation option plus cancel/save buttons
        voucher_user_create_div_element = voucher_user_create_div_element + `
            </select>

            <div id='' class= 'w3-panel w3-bottomBar w3-center'>
                Batch option
            </div>

            <input id='data_main_choice_button_users_voucher_create_batch_total' type='number' placeholder='Total vouchers to produce' class='form-control w3-margin-top w3-margin-bottom'>
            <input id='data_main_choice_button_users_voucher_create_batch_name' type='text' placeholder='Batch group name' class='form-control w3-margin-top w3-margin-bottom'>
            <input id='data_main_choice_button_users_voucher_create_batch_suffix' type='text' placeholder='Voucher code suffix' class='form-control w3-margin-top w3-margin-bottom'>

            <div id='' class='height_percent_auto full_width_percent resizable_window_min_width'>

                <button onclick='hide_show_div("data_main_choice_button_users_voucher_user_create", "hide")' class='w3-button w3-white w3-border w3-border-red w3-margin-top height_percent_auto half_width_percent div_float_left'>Cancel</button>
                <button onclick='user_create_save("voucher")' class='w3-button w3-white w3-border w3-border-blue w3-margin-top height_percent_auto half_width_percent div_float_right'>Create</button>
                
            </button>


        `;

        add_by_append('data_main_choice_button_users_voucher_user_create', voucher_user_create_div_element);//add menu element to div


        return;    
    }

}

// --------- save user ------------
function user_create_save(type_of_user){

    var vouchercode_username_password = ''; //stores usernames + pasword or voucher code
    var data_profile_group = ''; //store data profile
    var batch_total = 0; //stores batch total
    var batch_name = '';//stores name of batch
    var vouchercode_username_password_suffix = ''; //stores suffix
   

    if(type_of_user == 'normal'){ 
        
        //get normal account create menu data
        var get_normal_username = document.getElementById('data_main_choice_button_users_normal_user_create_username').value;
        var get_normal_password = document.getElementById('data_main_choice_button_users_normal_user_create_password').value;
        var get_normal_data_group = document.getElementById('data_main_choice_button_users_normal_user_data_group').value;
        var get_normal_batch_total = document.getElementById('data_main_choice_button_users_normal_user_batch_total').value;
        var get_normal_batch_name = document.getElementById('data_main_choice_button_users_normal_user_batch_name').value;
        var get_normal_suffix = document.getElementById('data_main_choice_button_users_normal_user_username_suffix').value;

        //check if basic account creation elements are filled
        if(get_normal_username.length < 3 || get_normal_password.length < 3 || get_normal_data_group == 'Select data profile'){ //if username and password is chars are less than 3 and no data profile selcted

            //check if batch number is more than 0 and or data profile is not selected
            if(Number(get_normal_batch_total.replace(/,/, '.')) < 1 || get_normal_data_group == 'Select data profile'){ //if batch number not specifiy

                alert('Option 1\nPlease fill in username, password and select data profile.\n\nOption 2\nSelect data profile and type total number \nof account to produce under [batch].');//give error
                return;//end function
            }
        }

        //attach username and pasword
        vouchercode_username_password = {user_name : get_normal_username.trim() , get_normal_password: get_normal_password.trim() };

        //if usrename and pasword is filled and batch total number is more than one// give warning
        var batch_produce_username_override_confirm = 'nothing pressed yet';//tracks if confirm alert [cancel] or [ok] was pressed

        if(get_normal_username.trim().length > 0 && Number(get_normal_batch_total.replace(/,/, '.')) > 1 ){

            batch_produce_username_override_confirm = confirm('You have selected "batch" number to be more than 1.\nThis will cause accounts to be produced automatically, and will ignore your added username and password. ')
        }

        if(batch_produce_username_override_confirm == false){ //if cancel pressed
            return;//end function
        }

        if(batch_produce_username_override_confirm == true){ //if ok pressed
            vouchercode_username_password = {user_name : '' , get_normal_password: '' };//set username and password to none;
        }
        
        //pass account creation data // be sent to server 
        data_profile_group = get_normal_data_group;
        batch_total = get_normal_batch_total;
        batch_name = get_normal_batch_name ;
        vouchercode_username_password_suffix = get_normal_suffix;


    }

    if(type_of_user == 'voucher'){

        //get voucher data
        var get_voucher_voucher_code = document.getElementById('data_main_choice_button_users_voucher_create_voucher_code').value;
        var get_voucher_profile_group = document.getElementById('data_main_choice_button_users_voucher_create_data_group').value;
        var get_voucher_batch_total = document.getElementById('data_main_choice_button_users_voucher_create_batch_total').value;
        var get_voucher_batch_name = document.getElementById('data_main_choice_button_users_voucher_create_batch_name').value;
        var get_voucher_suffix = document.getElementById('data_main_choice_button_users_voucher_create_batch_suffix').value;

        //check if basic account creation elements are filled
        if(get_voucher_voucher_code.length < 3 || get_voucher_profile_group == 'Select data profile'){ //if username and password is chars are less than 3 and no data profile selcted

            //check if batch number is more than 0 and or data profile is not selected
            if(Number(get_voucher_batch_total.replace(/,/, '.')) < 1 || get_voucher_profile_group == 'Select data profile'){ //if batch number not specifiy

                alert('Option 1\nPlease fill in voucher code and select data profile.\n\nOption 2\nSelect data profile and type total number \nof voucher to produce under [batch].');//give error
                return;//end function
            }
        }

        //attach voucher code
        vouchercode_username_password = {user_name : get_voucher_voucher_code.trim()};

        //if voucher code is filled and batch total number is more than one// give warning
        var batch_produce_voucher_code_override_confirm = 'nothing pressed yet';//tracks if corfim alert [cancel] or [ok] was pressed

        if(get_voucher_voucher_code.trim().length > 0 && Number(get_voucher_batch_total.replace(/,/, '.')) > 1 ){

            batch_produce_voucher_code_override_confirm = confirm('You have selected "batch" number to be more than 1.\nThis will cause accounts to be produced automatically, and will ignore your added username and password. ')
        }

        if(batch_produce_voucher_code_override_confirm == false){ //if cancel pressed
            return;//end function
        }

        if(batch_produce_voucher_code_override_confirm == true){ //if ok pressed
            vouchercode_username_password = {user_name : ''};//set ouchercode to none;
        }
        
        //pass voucher creation data // be sent to server 
        data_profile_group = get_voucher_profile_group;
        batch_total = get_voucher_batch_total;
        batch_name = get_voucher_batch_name ;
        vouchercode_username_password_suffix = get_voucher_suffix;


    }

 
    //sent data to server and create account
    $.get('/create_user', {'user_id' : vouchercode_username_password, 'data_profile' : data_profile_group, 'total_account' : batch_total, 'account_group_name' : batch_name, 'voucher_username_suffix': vouchercode_username_password_suffix, account_type : type_of_user }, function(data, success){

        //console.log(success, data);
        if(success == 'success'){// if response retrieved from server 
            //console.log(data)

             //if account succesfully created
            if(data == 'account created.'){
                //give alert
                alert('Success : ' + batch_total + ' account/s created. ');

                //reload user view 
                get_user_accounts();

                //close user / voucher create menu
                hide_show_div("data_main_choice_button_users_normal_user_create","hide"); 
                hide_show_div("data_main_choice_button_users_voucher_user_create","hide")

                return;//end function
            }

            //if un-able to create combination of unique names that are not used already using names list
            if(data == 'batch account create, unabled to create unique names, not already taken'){
                alert('Batch error. Not able to create unique names combinations that are not\nalready in the system.\n\nSolution 1\nDelete accounts that are used up or expired.\nSolution 2\nAdd more names list to [Word-list] folder.\nYou may need to contact administrator for that.');//give error
                return;//end function
            }

            if(data = 'Error, username or voucher code duplicate'){//if account voucher code or username is found to be duplicate

                //give alert
                alert('Error : "' + vouchercode_username_password.user_name + '", username or voucher code is already used\nPlease try a different one.');

                return;
            }
            
          
            
        }

        //if no reponse retrived
        alert('Error, the is an issue contacting the server to create new users.\nPlease try again later or contact administrator.');//give error


    });


}
