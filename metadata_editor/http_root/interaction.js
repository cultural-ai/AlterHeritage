const path = './objects/';

// for restoring the original metadata
let originalData;

// 'user_{userID}.json'
let userFilename;
let userData;

// responses to questions 'responses_{userID}.json'
let responsesFilename;
let userResponses; 

// 'consent_{userID}.json'
let consentFilename;
let userConsent;

// 'submitted_{userID}.json'
let submittedFilename;
let userSubmitted;

// counters for unique ids for user keywords and fields
let keywords_count = 100;
let fields_count = 100;

let objectIndex = 0; // starting with the 1st object
let objectId; // for object ID

// - // - // - DOCUMENT LOAD - // - // - //

document.addEventListener('DOMContentLoaded', async() => {

  const userId = getUserId();

  if (!userId) {
    alert('User ID not found');
    return;
  }

  const pathOriginalFile = `${path}original_${userId}.json`;
  originalData = await requestData(pathOriginalFile);

  const pathUserFile = `${path}user_${userId}.json`;
  userFilename = `user_${userId}.json`;
  userData = await requestData(pathUserFile);

  const pathUserResponses = `${path}responses_${userId}.json`;
  responsesFilename = `responses_${userId}.json`;
  userResponses = await requestData(pathUserResponses);

  const pathUserConsent = `${path}consent_${userId}.json`;
  consentFilename = `consent_${userId}.json`;
  userConsent = await requestData(pathUserConsent);

  const pathUserSubmitted = `${path}submitted_${userId}.json`;
  submittedFilename = `submitted_${userId}.json`;
  userSubmitted = await requestData(pathUserSubmitted);

  const numObjects = getObjectsN(userData);
  setPagination(numObjects,userId);

  const content = document.getElementById('task_screen');
  const body = document.body;
  const firstDiv = body.children[0];

  // check if user has a consent (to show the consent screen only once)
  if (userConsent[userId] === "False") {
    // creating the consent screen
    const consentDiv = document.createElement('div');
    consentDiv.className = 'container-fluid before_task';
    consentDiv.id = 'before_task';
    consentDiv.innerHTML = `
     <div class="row consent_screen" id="consent_block">
      <div class="col-md-12 consent_col">
        <p>Beste deelnemer,<br> Voordat je met de taak begint, willen wij je het volgende laten weten:<br></p>
          <ol class="consent_points">
            <li>we verzamelen geen persoonlijke gegevens van je;</li>
            <li>de gegevens die je invoert tijdens het uitvoeren van de taak worden  opgeslagen op onze server;</li>
            <li>we gebruiken je invoer alleen voor ons onderzoek en delen dit niet met anderen;</li>
            <li>vanwege de aard van het onderzoek kun je tijdens het uitvoeren van de taak te maken krijgen met kwetsende of schokkende teksten en beelden.</li>
          </ol>
          <p>Door op de knop "Beginnen" te drukken, bevestig je dat je op de hoogte bent van de bovenstaande punten en geef je ons toestemming om je invoer in ons onderzoek te gebruiken.<br>
          Voor vragen kun je <a class="consent_screen_link" href="mailto:nesterov@cwi.nl">contact met ons opnemen</a>.</p>
          <button title="Beginnen" class="btn btn-outline-secondary btn-md consent_btn" type="button" id="consent_btn">Beginnen</button>
      </div>
    </div>
    `
    body.insertBefore(consentDiv,firstDiv);

    // consent button listener
    const consentButton = document.getElementById('consent_btn');
    consentButton.addEventListener('click', () => {
      embedObject(userData,0);
      consentDiv.classList.add('removing');
      consentDiv.addEventListener('transitionend', () => {
        consentDiv.remove();
        content.classList.add('making_visible');});

    userConsent[userId] = "True"; //rewrite consent
    submitData(consentFilename, userConsent, false);
    });
  }
  else {
    embedObject(userData,0);
    content.classList.add('making_visible');
  };

});

// Left column: listener for buttons inside 'object_metadata_container'

document.getElementById('object_metadata_container').addEventListener('click', function(event) {

  const target = event.target;
  // FIELDS

  // display field input group
  if (target.closest('.add_field_btn')) {
    displayFieldInputGroup();
  };

  // add user field
  if (target.closest('.check_add_field_btn')) {
    addField();
  };

  // hide field
  if (target.closest('.hide_field_btn')) {
    const fieldId = target.closest('.hide_field_btn').getAttribute('field-id');
    hideField(fieldId);
  };

  // remove field
  if (target.closest('.remove_field_btn')) {
    const fieldId = target.closest('.remove_field_btn').getAttribute('field-id');
    removeField(fieldId);
  };

  // add note field
  if (target.closest('.add_note_btn')) {
    const fieldId = target.closest('.add_note_btn').getAttribute('field-id');
    addFieldNote(fieldId,''); // empty note value bc it's a new one
  };

  // remove note + reactivate add note button
  if (target.closest('.remove_note_btn')) {
    const buttonId = target.closest('.remove_note_btn').id;
    const fieldId = buttonId.replace('remove_note_btn_','');
    removeFieldNote(fieldId);
  };

  // add warning
  if (target.closest('.add_warning_btn')) {
    const fieldId = target.closest('.add_warning_btn').getAttribute('field-id');
    addFieldWarning(fieldId,''); // empty warning bc it's a new one
  };

  // remove warning + reactivate add warning button
  if (target.closest('.remove_warning_btn')) {
    const buttonId = target.closest('.remove_warning_btn').id;
    const fieldId = buttonId.replace('remove_warning_btn_','');
    removeFieldWarning(fieldId);
  };

  // KEYWORDS

  // add note keyword
  if(target.closest('.note-button')) {
    const kwId = target.closest('.note-button').getAttribute('keyword-id');
    addNoteKeyword(kwId,'');
  };

  // hide keyword
  if (target.closest('.hide-button')) {
    const kwId = target.closest('.hide-button').getAttribute('keyword-id');
    hideKeyword(kwId);
  };

  // remove keyword
  if (target.closest('.remove-button')) {
    const kwId = target.closest('.remove-button').getAttribute('keyword-id');
    removeKeyword(kwId);
  };

  // add keyword input group
  if (target.closest('.add_keyword_btn')) {
    displayKeywordInput();
  };

  // add user keyword
  if (target.closest('#tooltip_add_btn')) {
    addUserKeyword();
  };

});

// Right column listeners: controls and questions; saving user data

document.addEventListener('DOMContentLoaded', (event) => {

  // defining tooltips
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

  // questions radio listener
  const radioInputs = document.querySelectorAll('.form-check-input');
  radioInputs.forEach(radio => {
    radio.addEventListener('change', () => {
      updateRadioInput(radio.id, radio.value);
      checkSubmitAllowed(); // check if submitting is allowed
    });
  });

  // questions textarea input listener
  const textareaInputs = document.querySelectorAll('.open_question_input');
  textareaInputs.forEach(textarea => {
    textarea.addEventListener('input', () => {
      updateTextareaResponsesInput(textarea.id, textarea.value.trim());
      // check if submit allowed only if the textarea belongs to the 3rd question
      if (textarea.id === `${objectIndex}_q3_text`) {
        checkSubmitAllowed();
      }
    });
  });

  // image zoom
  const imageToZoom = document.getElementById('object-image');
  const panzoom = Panzoom(imageToZoom, {
        maxScale: 4, // max zoom
        minScale: 1,
        contain: 'false'
    });

  // zoom-in button
  document.getElementById('zoomin').addEventListener('click', function() {
    panzoom.zoomIn(); 
    });

  // zoom-out button
  document.getElementById('zoomout').addEventListener('click', function() {
    panzoom.zoomOut();
    });

  // mouse wheel zooming
  imageToZoom.parentElement.addEventListener('wheel', panzoom.zoomWithWheel);

  // submit object
 const submitButton = document.getElementById('submit_btn');
 const disabledDiv = document.getElementById('disabled_tooltip');
 submitButton.addEventListener('click', () => {
  // first, check if the submission is successful
  submitSuccessful = submitData(userFilename, userData, true); // true = notify user
    if (submitSuccessful && userSubmitted[objectId] === "False") {
      markObjectSubmitted(); // display a corresponding checkmark
      submitData(submittedFilename, userSubmitted, false); // set objects as submitted, do not notify user
    }
    submitData(responsesFilename, userResponses, false); // submit responses, do not notify user
    // check if all objects have been submitted
    checkAllSubmitted();
  });

  // if the submit button is disabled, show a tooltip
  if (submitButton.disabled) {
    disabledDiv.setAttribute('data-bs-original-title','Answer the mandatory questions below before submitting');
  }

  // restore object
  const restoreButton = document.getElementById('restore_btn');
  restoreButton.addEventListener('click', () => {
    // ensuring a deep copy of the origianl data
  userData.objects[objectIndex].fields = JSON.parse(JSON.stringify(originalData.objects[objectIndex].fields));
  embedObject(userData,objectIndex)
  });

});

// - // - // - FUNCTIONS - // - // - //

function getUserId() {

  return window.location.hash.substring(1); // Get the part after the '#'
}

function getObjectId(object_index) {

  return userData['objects'][object_index]['object_id'];
}

// getting N objects
function getObjectsN(data) {

  return data.objects.length;
}

function embedObject(data,objectIndex) {

  // embed image
  const imgContainer = document.getElementById('object-image');
  const img_url = data.objects[objectIndex].img;
  imgContainer.src = img_url;

  // the main container for object's metadata
  const objectMetadataContainer = document.getElementById('object_metadata_container');

  // clearing previous object's fields
  objectMetadataContainer.innerHTML = '';

  // embed the button "Add a new field" and an input group
  insertAddField(objectMetadataContainer);

  // check if an object has keywords, this function modifies data: adding an empty keywords field if there were no keywords
  checkObjectHasKeywords(data);

  // embedding object's metadata fields
  singleObjectFields = data.objects[objectIndex].fields;
  embedFields(singleObjectFields,objectMetadataContainer);

  // adding listener for existing editable fields
  const existingEditableFields = objectMetadataContainer.querySelectorAll('.editable_field');
  existingEditableFields.forEach(editableTextarea => {
    editableTextarea.addEventListener('input', () => {
      updateFieldValue(editableTextarea.id, editableTextarea.value.trim()); 
    });
  })

  // setting the height of textareas depending on the amount of text in them
  setTextareaHeight();
  
  // loading questions and user responses
  loadQuestions(userResponses,objectIndex);
  
  // check if all objects have been submitted, notify users if yes
  checkAllSubmitted();
}

async function requestData(path) {

  try {
    const response = await fetch(path);
    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }
    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}

async function submitData(filename, data, notifyUser) {

  let submitSuccess = false;

  fetch(`/save/${filename}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => {
    if (!response.ok && notifyUser) {
      error_message = `${error} \n Neem contact met ons op`;
      notifyDataSubmitted(error_message,"red"); // a notification pop-up only if *a user* submits the data
    }
    if (response.ok && notifyUser) {
      notifyDataSubmitted("Met succes ingediend","green");
    }
    if (response.ok) {
      submitSuccess = true;
    }
  })
  .catch(error => {
    if (notifyUser){
      error_message = `${error} \n Neem contact met ons op`;
      notifyDataSubmitted(error_message,"red");
    }
  });

  return submitSuccess;

}

function notifyDataSubmitted(message,outcome) {

  const notificationContainer = document.getElementById('notification_submitted');

  // the notification element depending on outcome
  const notification = document.createElement('div');

  if (outcome === "green") {
    notification.className = 'notification_green';
  } else {
  notification.className = 'notification_red';
  }
  
  notification.innerText = message;   
  notificationContainer.appendChild(notification);

  // slide-in
  setTimeout(() => {
    notification.classList.add('making_visible');
  }, 10);

  setTimeout(() => {
    notification.classList.remove('making_visible');
    notification.classList.add('removing');
    notification.addEventListener('transitionend', () => {
      notification.remove();
    });
  }, 4000);
}

function checkAllSubmitted() {

  const notificationDiv = document.getElementById('all_submitted');
  const submittedValues = Object.values(userSubmitted);
  // if all are true
  const allTrue = submittedValues.every(value => value === 'True');
  // notify once; null means that there's no notification div on the page
  if (allTrue && notificationDiv === null) {
    notifyAllSubmitted();
  }
}

function notifyAllSubmitted() {

  const notifyAllContainer = document.getElementById('all_submitted_notification');
  const notificationBody = document.createElement('div');

  notificationBody.className = 'notification_green';
  notificationBody.id = 'all_submitted';
  notificationBody.innerText = "Alle objecten zijn ingediend. Je kunt de taak nu afronden door dit venster te sluiten. Of je kunt wijzigingen aanbrengen in je bewerkingen en antwoorden en ze opnieuw indienen. Bedankt voor je deelname!";

  notifyAllContainer.appendChild(notificationBody);

  // slide-in and stay
  setTimeout(() => {
    notificationBody.classList.add('making_visible');
  }, 10);
}

function insertAddField(div) {

  // add a new field buton
  const addFieldButtonDiv = document.createElement('div');
  addFieldButtonDiv.className = 'row add_field';
  addFieldButtonDiv.innerHTML = `
  <div class="col-md-12 add_field_col">
    <button title="Een nieuw veld toevoegen" class="btn btn-outline-secondary btn-sm add_field_btn" type="button" id ="add_field_btn">
      <i class="bi bi-plus-lg"></i> Een nieuw veld toevoegen
  </div>`
  div.appendChild(addFieldButtonDiv);

  // add the field group input
  const fieldInputGroup = document.createElement('div');
  fieldInputGroup.className = 'field_input_group div_hidden';
  fieldInputGroup.id = 'add_new_field_group';
  fieldInputGroup.innerHTML = `
    <div class="row">
      <div class="col-auto field_names">
        <input type="text" class="form-control field_name_input" placeholder="Veldnaam">
      </div>
    </div>

    <div class="row">
      <div class="col-md-10 field_value_area">
        <textarea class="form-control field_value_input"></textarea>
      </div>

      <div class="col-md-2 field_button_input">
        <button title="Een veld toevoegen" class="btn btn-outline-secondary btn-sm check_add_field_btn" type="button" disabled="true">
            <i class="bi bi-check-lg check_add_field_icon"></i>
        </button>
      </div>
    </div>
      `;

  div.appendChild(fieldInputGroup);

}

function checkObjectHasKeywords(data) {

  const objectFields = data.objects[objectIndex].fields;
  let hasKeywords = false;

  objectFields.forEach(field => {
    if (field.type === "keywords") {
      hasKeywords = true;
    }
  })

   // if there's no field with keywords, add an empty one to user data
   if (!hasKeywords) {
    kwDefault = {
      "name": "Onderwerp",
      "property": "empty_keywords",
      "type": "keywords",
      "value": {}
    }

    data.objects[objectIndex].fields.splice(1, 0, kwDefault);
}
}

function embedFields(objectFields,div) {

  objectFields.forEach(field => {
  const fieldDiv = document.createElement('div');
  fieldDiv.className = 'field_group';
  fieldDiv.id = `field_group_${field.property}`;

  if (field.type === 'editable' && field.removed === 'False') {
    fieldDiv.innerHTML = `
    <div class="row">
      <div class="col-auto field_names">
        <label for="${field.property}">${field.name}</label>
      </div>
    </div>

    <div class="row">
      <div class="col-md-10 field_value_area" id="container_${field.property}">
        <textarea class="form-control editable_field" id="${field.property}">${field.value}</textarea>
      </div>
                
      <div class="col-md-2 field_btns">
        <div class="row upper_btns">

          <button title="Verbergen ${field.name}" class="btn btn-outline-secondary btn-sm hide_field_btn" type="button" id="hide_field_btn_${field.property}" field-id="${field.property}">
            <i class="bi bi-eye-slash-fill" style="font-size: 1.2rem;"></i>
          </button>

          <button title="Verwijderen ${field.name}" class="btn btn-outline-secondary btn-sm remove_field_btn" type="button" field-id="${field.property}">
            <i class="bi bi-x-lg" style="font-size: 1.2rem;"></i>
          </button>

        </div>

        <div class="row down_btns">

          <button title="Een notitie toevoegen toe ann ${field.name}" class="btn btn-secondary btn-sm add_note_btn" type="button" id="add_note_btn_${field.property}" field-id="${field.property}"><i class="bi bi bi-pencil" style="font-size: 1.2rem;"></i></button>

          <button title="Een waarschuwing toevoegen toe aan ${field.name}" class="btn btn-secondary btn-sm add_warning_btn" type="button" id="add_warning_btn_${field.property}" field-id="${field.property}"><i class="bi bi-exclamation-triangle-fill" style="font-size: 1.2rem;"></i></button>

        </div>

      </div>

    </div>
    `;
    div.appendChild(fieldDiv);

    if (field.hidden === 'True') {
      hideField(field.property);
    }

    if (field.has_note !== '') {
      addFieldNote(field.property,field.has_note);
    }

    if (field.has_warning !== '') {
      addFieldWarning(field.property,field.has_warning);
    }

  }

  if (field.type === 'keywords') {
    fieldDiv.innerHTML = `
    <div class="row">
      <div class="col-auto field_names">
        <label for="${field.property}">${field.name}</label>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12 field_value_area">
        <div id="subject-terms-container"></div>
      </div>
    </div>
    `

    div.appendChild(fieldDiv);

    const keywordsDiv = document.getElementById('subject-terms-container');

    Object.keys(field.value).forEach((key,index) => {
      let keyword = field.value[key];
      const kwId = `keyword_${index}`;
      // add a keyword if it's not removed
      if (keyword.removed === 'False') {
        const term = addKeyword(key,index);
        keywordsDiv.appendChild(term);
      }
      // check if hidden
      if (keyword.hidden === 'True') {
        hideKeyword(kwId);
      }
      // check if has a note
      if (keyword.has_note !== '') {
        addNoteKeyword(kwId,keyword.has_note);
      }

    });

    // add a keyword button and a tooltip
    const addKeywordForm = document.createElement('span');
    addKeywordForm.className = 'add_keyword_tooltip';
    addKeywordForm.innerHTML = `
    <button class="btn btn-outline-secondary btn-sm add_keyword_btn" id="add_keyword_btn" title="Een trefwoord toevoegen"><i class="bi bi-plus-lg" style="font-size: 1rem;"></i></button>
    <div class="input-group mb-3 div_hidden" id="keyword_input">
      <input type="text" class="form-control keyword_input_field" id="user_keyword_area" aria-describedby="tooltip_add_btn">
      <button class="btn btn-outline-secondary" type="button" id="tooltip_add_btn" disabled="true"><i class="bi bi-check-lg check_add_keyword"></i></button>
    </div>
    `
    keywordsDiv.appendChild(addKeywordForm);
  }

  if (field.type === 'non-editable') {
    fieldDiv.innerHTML = `
    <div class="row">
      <div class="col-auto field_names">
        <label for="${field.property}">${field.name}</label>
      </div>
    </div>

    <div class="row">
      <div class="col-md-12 field_value_area">
        <p id="non-editable-field-value">${field.value}</p>
      </div>
    </div>
    `
    div.appendChild(fieldDiv);
  }
});
}

// Fields modifiers

function displayFieldInputGroup() {

  const fieldGroup = document.getElementById('add_new_field_group');
  fieldGroup.classList.toggle('div_hidden');

  // check if the field name and value are both non-empty to active button
  const fieldName = fieldGroup.querySelector('input');
  const fieldValue = fieldGroup.querySelector('textarea');
  const submitFieldButton = fieldGroup.querySelector('button');

  fieldName.addEventListener('input', () => {
    if (fieldName.value.trim() !== '' && fieldValue.value.trim() !== '') {
      submitFieldButton.disabled = false;
    }
    else {
      submitFieldButton.disabled = true;
    }
  });

  fieldValue.addEventListener('input', () => {
    if (fieldName.value.trim() !== '' && fieldValue.value.trim() !== '') {
      submitFieldButton.disabled = false;
    }
    else {
      submitFieldButton.disabled = true;
    }
  });

  // toggling the input group if there's click outside of it
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.field_input_group') && !event.target.closest('.add_field_col')) {
      fieldGroup.classList.add('div_hidden');
    }
  });
}

function addField() {

  const objectMetadataContainer = document.getElementById('object_metadata_container');
  const firstField = objectMetadataContainer.children[2]; // inserting a new field above the first one and below the input group

  const fieldGroup = document.getElementById('add_new_field_group');

  const submitFieldButton = fieldGroup.querySelector('button');
  const fieldNameInput = fieldGroup.querySelector('input');
  const fieldValueInput = fieldGroup.querySelector('textarea');
  const fieldName = fieldNameInput.value.trim();
  const fieldValue = fieldValueInput.value.trim();

  const fieldDiv = document.createElement('div');
  fieldDiv.className = 'field_group';
  fieldDiv.id = `field_group_${fieldName.replace(' ','').toLowerCase()}${fields_count}`;
  const userFieldID = `${fieldName.replace(' ','').toLowerCase()}${fields_count}`;

  fieldDiv.innerHTML = `
    <div class="row">
      <div class="col-auto field_names">
        <label for="${userFieldID}">${fieldName}</label>
      </div>
    </div>

    <div class="row">

      <div class="col-md-10 field_value_area" id="container_${userFieldID}">
          <textarea class="form-control" id="${userFieldID}">${fieldValue}</textarea>
      </div>
                
      <div class="col-md-2 field_btns">
        <div class="row upper_btns">

          <button title="Verbergen ${fieldName}" class="btn btn-outline-secondary btn-sm hide_field_btn" type="button" id="hide_field_btn_${userFieldID}" field-id="${userFieldID}">
            <i class="bi bi-eye-slash-fill" style="font-size: 1.2rem;"></i>
          </button>

          <button title="Verwijderen ${fieldName}" class="btn btn-outline-secondary btn-sm remove_field_btn" type="button" field-id="${userFieldID}">
            <i class="bi bi-x-lg" style="font-size: 1.2rem;"></i>
          </button>

        </div>

        <div class="row down_btns">

          <button title="Notitie toevoegen toe aan ${fieldName}" class="btn btn-secondary btn-sm add_note_btn" type="button" id="add_note_btn_${userFieldID}" field-id="${userFieldID}"><i class="bi bi bi-pencil" style="font-size: 1.2rem;"></i></button>

          <button title="Waarschuwing toevoegen toe aan ${fieldName}" class="btn btn-secondary btn-sm add_warning_btn" type="button" id="add_warning_btn_${userFieldID}" field-id="${userFieldID}"><i class="bi bi-exclamation-triangle-fill" style="font-size: 1.2rem;"></i></button>

        </div>

      </div>

    </div>
      `;

  objectMetadataContainer.insertBefore(fieldDiv,firstField);

  // set the new textarea height depending on the amount of text
  const addedEditableField = document.getElementById(userFieldID);
  const newTextareaHeight = addedEditableField.scrollHeight + 2;
  addedEditableField.style.height = `${newTextareaHeight}px`;

  submitFieldButton.disabled = true; // disable submit new field button
  fieldNameInput.value = ''; // clearing the filed input field
  fieldValueInput.value = '';
  fields_count += 1;

  fieldGroup.classList.add('div_hidden');

  // modify user data
  const userAddedField = {
    "name": fieldName,
    "property": userFieldID,
    "value": fieldValue,
    "type": "editable",
    "hidden": "False",
    "removed": "False",
    "has_note": "",
    "has_warning": "",
    "by_user": "True"
  };

  userData.objects[objectIndex].fields.unshift(userAddedField);
  
  // add a listener to the newly created field
  addedEditableField.addEventListener('input', () => {
      updateFieldValue(userFieldID, addedEditableField.value.trim()); 
    });
}

function hideField(fieldId) {

  const button = document.getElementById(`hide_field_btn_${fieldId}`);
  const icon = button.querySelector('i');
  const textarea = document.getElementById(fieldId);

  if (icon.classList.contains('bi-eye-slash-fill')) {
    icon.classList.remove('bi-eye-slash-fill');
    icon.classList.add('bi-eye-fill');
    button.title = button.title.replace('Verbergen', 'Tonen'); 
  } else {
    icon.classList.remove('bi-eye-fill');
    icon.classList.add('bi-eye-slash-fill');
    button.title = button.title.replace('Tonen', 'Verbergen'); 
  }

  if (textarea) {
    textarea.disabled = !textarea.disabled;
  }

  // modify user data
  userData.objects[objectIndex].fields.forEach( field => {
    if (field.property === fieldId) {
      strValue = String(textarea.disabled) // converting a boolean into a string
      field.hidden = strValue.charAt(0).toUpperCase() + strValue.slice(1);
    }
  });
  
}

function removeField(fieldId) {

  const div_to_remove = document.getElementById(`field_group_${fieldId}`);
  div_to_remove.classList.add('removing');
  div_to_remove.addEventListener('transitionend', () => {
  div_to_remove.remove();}, { once: true });

  // modify user data
  userData.objects[objectIndex].fields.forEach(field => {
    if (field.property === fieldId) {
      field.removed = "True";
    }
  });
}

function addFieldNote(fieldId, noteValue) {

  const noteButton = document.getElementById(`add_note_btn_${fieldId}`);
  const fieldGroupdDiv = document.getElementById(`field_group_${fieldId}`);
  const textContainer = fieldGroupdDiv.querySelector('.field_value_area'); // select textarea column

  // create note
  const note = document.createElement('div');
  note.className = 'row note_area';
  note.id = `note_to_${fieldId}`;
  const textareaId = `note_text_${fieldId}`;
  note.innerHTML = `
    <div class="col-md-1 note_icon_col"><i class="bi bi-sticky-fill note_icon"></i></div>
    <div class="col-md-10 note_col">
      <textarea id="${textareaId}" class="note-form form-control" placeholder="Notitie">${noteValue}</textarea>
    </div>
    <div class="col-md-1 remove_note_col">
    </div>
  `
  // create remove note button
  const removeNoteButton = document.createElement('button');
  removeNoteButton.className = 'btn btn-outline-secondary btn-sm remove_note_btn'; 
  removeNoteButton.id = `remove_note_btn_${fieldId}`;
  removeNoteButton.title = 'Een notitie verwijderen';
  removeNoteButton.innerHTML = '<i class="bi bi-x-lg"></i>';

  const noteButtonContainer = note.querySelector('.remove_note_col');

  textContainer.appendChild(note);
  noteButtonContainer.appendChild(removeNoteButton);
  noteButton.classList.add('disabled');

  // add a listener to the note
  const noteTextarea = document.getElementById(textareaId);
  noteTextarea.addEventListener('input', () => {
    updateFieldNoteValue(fieldId, noteTextarea.value.trim());
});

}

function removeFieldNote(fieldId) {

  // removing the note container
  const divNoteField = document.getElementById(`note_to_${fieldId}`);
  divNoteField.remove();
  // reactivating the add note button
  const addNoteButton = document.getElementById(`add_note_btn_${fieldId}`);
  addNoteButton.classList.remove('disabled');
  // rewriting the note value
  updateFieldNoteValue(fieldId, '');
}

function addFieldWarning(fieldId, warningValue) {

  const warningButton = document.getElementById(`add_warning_btn_${fieldId}`);
  const fielGroupdDiv = document.getElementById(`field_group_${fieldId}`);
  const textContainer = fielGroupdDiv.querySelector('.field_value_area'); // select textarea column

  // create warning
  const warning =  document.createElement('div');
  warning.className = 'row warning_area';
  warning.id = `warning_to_${fieldId}`;
  const textareaId = `warning_text_${fieldId}`;
  warning.innerHTML = `
    <div class="col-md-1 warning_icon_col"><i class="bi bi-exclamation-triangle-fill warning_icon"></i></div>
    <div class="col-md-10 warning_col">
      <textarea id="${textareaId}" class="warning-form form-control" placeholder="Waarschuwing">${warningValue}</textarea>
    </div>
    <div class="col-md-1 remove_warning_col">
    </div>
  `
  // create remove warning button
  const removeWarningButton = document.createElement('button');
  removeWarningButton.className = 'btn btn-outline-secondary btn-sm remove_warning_btn'; 
  removeWarningButton.id = `remove_warning_btn_${fieldId}`;
  removeWarningButton.title = 'Een waarschuwing verwijderen';
  removeWarningButton.innerHTML = '<i class="bi bi-x-lg"></i>';

  const warningButtonContainer = warning.querySelector('.remove_warning_col');

  textContainer.appendChild(warning);
  warningButtonContainer.appendChild(removeWarningButton);
  warningButton.classList.toggle('disabled');

  // add a listener to the warning
  const warningTextarea = document.getElementById(textareaId);
  warningTextarea.addEventListener('input', () => {
    updateFieldWarningValue(fieldId, warningTextarea.value.trim());
});
}

function removeFieldWarning(fieldId) {

    // removing the warning container
    const divWarningField = document.getElementById(`warning_to_${fieldId}`);
    divWarningField.remove();
    // reactivating the add warning button
    const addWarningButton = document.getElementById(`add_warning_btn_${fieldId}`);
    addWarningButton.classList.remove('disabled');
    // rewrite warning value
    updateFieldWarningValue(fieldId, '');
}

// rewriting editable fields value
function updateFieldValue(textarea_id, textarea_value) {

  userData.objects[objectIndex].fields.forEach( field => {
    if (field.property === textarea_id) {
      field.value = textarea_value;
    }
  });
}

function updateFieldNoteValue(field_id, textarea_value) {

  userData.objects[objectIndex].fields.forEach( field => {
    if (field.property === field_id) {
      field.has_note = textarea_value;
    }
  });
}

function updateFieldWarningValue(field_id, textarea_value) {

  userData.objects[objectIndex].fields.forEach( field => {
    if (field.property === field_id) {
      field.has_warning = textarea_value;
    }
  });
}

// making sure that all text in editable fields is visible when object is loaded
function setTextareaHeight() {

  const textareas = document.querySelectorAll('.form-control');
  textareas.forEach(textarea => {
    const newTextareaHeight = textarea.scrollHeight + 2;
    textarea.style.height = `${newTextareaHeight}px`;
  });
}

// Keywords modifiers

// making keywords buttons
function addKeywordButtons(iconElement, className) {

  const button = document.createElement('button');
  button.className = `btn btn-outline-secondary btn-sm subject-term-button ${className}`;
  button.appendChild(iconElement);
  return button;
}

// adding keywords
function addKeyword(text,index) {

  const term = document.createElement('span');
  term.className = 'subject-term';
  term.id = `span_keyword_${index}`;
 
  // Create icon elements
  const noteIcon = document.createElement('i');
  noteIcon.className = 'st-icon bi bi-pencil';
  noteIcon.style.fontSize = '0.9rem';

  const hideIcon = document.createElement('i');
  hideIcon.className = 'st-icon bi bi-eye-slash-fill';
  hideIcon.style.fontSize = '0.9rem';

  const removeIcon = document.createElement('i');
  removeIcon.className = 'st-icon bi bi-x-lg';
  removeIcon.style.fontSize = '0.9rem';

  //add a note button
  const noteButton = addKeywordButtons(noteIcon, 'note-button');
  noteButton.id = `note_button_keyword_${index}`;
  noteButton.setAttribute('keyword-id', `keyword_${index}`);
  noteButton.title = "Notitie toevoegen";
  term.appendChild(noteButton);

  const noteTooltip = document.createElement('div');
  noteTooltip.className = 'add_note_tooltip add_note_tooltip_hidden';
  noteTooltip.id = `note_to_keyword_${index}`;
  noteTooltip.innerHTML = `
    <textarea class="form-control add_note_text"></textarea>
    <i class="bi bi-caret-down-fill triangle_icon"></i>
  `;
  term.appendChild(noteTooltip);
  
  //hide button
  const hideButton = addKeywordButtons(hideIcon, 'hide-button');
  hideButton.id = `hide_button_keyword_${index}`;
  hideButton.setAttribute('keyword-id', `keyword_${index}`);
  hideButton.title = "Een trefwoord verbergen";
  term.appendChild(hideButton);

  //remove button
  const removeButton = addKeywordButtons(removeIcon, 'remove-button');
  removeButton.id = `remove_button_keyword_${index}`;
  removeButton.setAttribute('keyword-id', `keyword_${index}`);
  removeButton.title = "Een trefwoord verwijderen";
  term.appendChild(removeButton);

  const keyword_text = document.createElement('p');
  keyword_text.className = 'keyword_text';
  keyword_text.id = `keyword_${index}`;
  keyword_text.setAttribute('data-bs-toggle','tooltip');
  keyword_text.setAttribute('data-bs-placement','bottom');
  keyword_text.setAttribute('data-bs-custom-class','added_note_tooltip');
  keyword_text.innerHTML = `<i class="bi bi-sticky-fill kw_note_icon div_hidden"></i>${text}`;
  term.appendChild(keyword_text);

  return term;
}

function removeKeyword(kwId) {

  const kw_to_remove = document.getElementById(`span_${kwId}`);
  kw_to_remove.classList.add('removing');
  kw_to_remove.addEventListener('transitionend', () => {
    kw_to_remove.remove();}, { once: true });

  const p_keyword = document.getElementById(kwId);

  let keywordText = '';

  // text value of a keyword
  p_keyword.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      keywordText = node.textContent.trim();
    }
  });

  // modify user data
  userData.objects[objectIndex].fields.forEach(field => {
    if (field.type === 'keywords') { // keywords field
      for (const key in field.value) {
        if (key === keywordText) {
          field.value[key].removed = "True";
        };
      }
    }
  });
}

function hideKeyword(kwId) {

  const button = document.getElementById(`hide_button_${kwId}`);
  const icon = button.querySelector('i');

  if (icon.classList.contains('bi-eye-slash-fill')) {
    icon.classList.remove('bi-eye-slash-fill');
    icon.classList.add('bi-eye-fill');
    button.title = button.title.replace('verbergen', 'tonen'); 
  } else {
    icon.classList.remove('bi-eye-fill');
    icon.classList.add('bi-eye-slash-fill');
    button.title = button.title.replace('tonen', 'verbergen'); 
  }

  const p_keyword = document.getElementById(kwId);
  p_keyword.classList.toggle('kw_hidden');

  let keywordText = '';

  // text value of a keyword
  p_keyword.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      keywordText = node.textContent.trim();
    }
  });

  // modify user data
  userData.objects[objectIndex].fields.forEach(field => {
    if (field.type === 'keywords') { // keywords field
      for (const key in field.value) {
        if (key === keywordText) {
          if (p_keyword.classList.contains('kw_hidden')) {
            field.value[key].hidden = "True";
          } else {
            field.value[key].hidden = "False";
          }
        }
      }
    }
  });
}

function displayKeywordInput() {

  const addKeywordButton = document.getElementById('add_keyword_btn');
  const inputGroup = document.getElementById('keyword_input');
  const submitKeywordButton = document.getElementById('tooltip_add_btn');
  inputGroup.classList.remove('div_hidden'); //displaying input group
  addKeywordButton.classList.add('disabled'); // adding another keyword is not possible while the input group is displayed

  const userKeywordArea = inputGroup.querySelector('input');

  // toggling disabled for the check button (do not allow adding an empty keyword)
  userKeywordArea.addEventListener('input', () => {
    if (userKeywordArea.value.trim() !== '') {
      submitKeywordButton.disabled = false;
    } else {
      submitKeywordButton.disabled = true;
    }
  });

  // toggling the input group if there's click outside of it
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.add_keyword_tooltip')) {
      inputGroup.classList.add('div_hidden');
      addKeywordButton.classList.remove('disabled');
    }
  });
}

function addUserKeyword() {

  keywords_count += 1; // counter for unique keyword IDs

  // getting the add button to add a new keyword before it
  const keywordsDiv = document.getElementById('subject-terms-container');
  const lastKeyword = keywordsDiv.lastElementChild;

  const addKeywordButton = document.getElementById('add_keyword_btn');
  const submitKeywordButton = document.getElementById('tooltip_add_btn');
  const inputGroup = document.getElementById('keyword_input');
  const userKeywordArea = inputGroup.querySelector('input');

  const user_keyword_index = `user_${keywords_count}`;
  const newKeyword = userKeywordArea.value.trim();

  const userTerm = addKeyword(newKeyword,user_keyword_index);
  keywordsDiv.insertBefore(userTerm, lastKeyword);

  inputGroup.querySelector('#user_keyword_area').value = ''; // reset the input
  submitKeywordButton.disabled = true; // disable the check button again
  inputGroup.classList.add('div_hidden');
  addKeywordButton.classList.remove('disabled'); // reactivating the add button

  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

  // modify user data
  const defaultProperties = {
    "hidden": "False",
    "removed": "False",
    "has_note": "",
    "by_user": "True"
  };

  userData.objects[objectIndex].fields.forEach(field => {
    if (field.type === 'keywords') {
      field.value[newKeyword] = defaultProperties;
    }
  });
  
}

function addNoteKeyword(kwId,noteValue) {

  const tooltip = document.getElementById(`note_to_${kwId}`);
  tooltip.classList.toggle('add_note_tooltip_hidden');

  const noteText = tooltip.querySelector('textarea');
  const p_keyword = document.getElementById(kwId);
  const noteIcon = p_keyword.querySelector('i');

  // checking if there was a note added before
  if (noteValue !== '') {
    noteText.value = noteValue;
    noteIcon.classList.remove('div_hidden');
    p_keyword.setAttribute('data-bs-title',noteValue);
    tooltip.classList.add('add_note_tooltip_hidden');
  }

  noteText.addEventListener('input', () => {
    
    const addedNote = noteText.value.trim();
    updateKeywordNoteValue(kwId,addedNote);

    // showing/hiding an icon and tooltip
    if (addedNote !== '') {
      noteIcon.classList.remove('div_hidden');
      p_keyword.setAttribute('data-bs-title',addedNote);
    }
    else {
      noteIcon.classList.add('div_hidden');
      p_keyword.removeAttribute('data-bs-title');
    }
    // updating tooltips while listening
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
  });

  // updating tooltips after a keyword is added
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

  // hiding the input note keyword if a click is not in the area
  document.addEventListener('click', (event) => {
    if (!event.target.closest(`#note_to_${kwId}`) && !event.target.closest(`#note_button_${kwId}`)) {
      tooltip.classList.add('add_note_tooltip_hidden');
    }
  });
}

function updateKeywordNoteValue(kwId,noteValue) {

  // get the keyword text (which is a key)
  const p_keyword = document.getElementById(kwId);
  let keywordText = '';

  // text value of a keyword
  p_keyword.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      keywordText = node.textContent.trim();
    }
  });

  // access the keyword object in the user data
  userData.objects[objectIndex].fields.forEach(field => {
    if (field.type === 'keywords') { // keywords field
      for (const key in field.value) {
        if (key === keywordText) {
          field.value[key].has_note = noteValue;
        }
      }
    }
  });

}

// Pagination

function setPagination(numObjects,userId) {

  loadPaginationButtons(numObjects,userId);

  const paginationContainer = document.querySelector('.pagination');
  const prevButton = paginationContainer.querySelector('.prev-b');
  const nextButton = paginationContainer.querySelector('.next-b');
  const pageButtons = paginationContainer.querySelectorAll('.page-n');

  pageButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      setActivePage(index + 1);
    });
  });

  prevButton.addEventListener('click', () => {
    const activePage = paginationContainer.querySelector('.page-item.active');
    const activeIndex = Array.from(pageButtons).indexOf(activePage) + 1;
    if (activeIndex > 1) setActivePage(activeIndex - 1);
  });

  nextButton.addEventListener('click', () => {
    const activePage = paginationContainer.querySelector('.page-item.active');
    const activeIndex = Array.from(pageButtons).indexOf(activePage) + 1;
    if (activeIndex < numObjects) setActivePage(activeIndex + 1);
  });

  // setting submitted icons

  Object.entries(userSubmitted).forEach(([key, value], index) => {
    if (value === "True") {
      const submitIcon = document.getElementById(`submit_icon_${index + 1}`);
      submitIcon.style.display = "block";
    }
  });

}

function setActivePage(pageNumber) {

  const paginationContainer = document.querySelector('.pagination');
  const pageButtons = paginationContainer.querySelectorAll('.page-n');

  pageButtons.forEach((button, index) => {
    if (index + 1 === pageNumber) {
      button.classList.add('active');
    } else {
      button.classList.remove('active');
    }
  });

  const prevButton = paginationContainer.querySelector('.prev-b');
  const nextButton = paginationContainer.querySelector('.next-b');

  const restoreButton = document.getElementById('restore_btn');
  restoreButton.textContent = `Herstellen #${pageNumber}`;

  const submitButton = document.getElementById('submit_btn');
  submitButton.textContent = `Indienen #${pageNumber}`;


  if (pageNumber === 1) {
    prevButton.classList.add('disabled');
  } else {
    prevButton.classList.remove('disabled');
  }

  if (pageNumber === pageButtons.length) {
    nextButton.classList.add('disabled');
  } else {
    nextButton.classList.remove('disabled');
  }

  objectIndex = pageNumber - 1;
  embedObject(userData, objectIndex);

}

function loadPaginationButtons(numObjects,userId) {

  const paginationContainer = document.querySelector('.pagination'); // ul class
  paginationContainer.innerHTML = ''; // clearing buttons

  const restoreButton = document.getElementById('restore_btn');
  const submitButton = document.getElementById('submit_btn');

  // previous button
  const prevButton = document.createElement('li');
  prevButton.className = 'page-item prev-b disabled';
  prevButton.innerHTML = `<a class="page-link" href="#${userId}" tabindex="-1"><i class="bi bi-chevron-left" title="Previous"></i></a>`;
  paginationContainer.appendChild(prevButton);

  // navigation buttons
  for (let i = 1; i <= numObjects; i++) {
    const pageButton = document.createElement('li');
    pageButton.className = 'page-item page-n';
    if (i === 1) pageButton.classList.add('active'); // the first object is active
    pageButton.innerHTML = `<a class="page-link" href="#${userId}">${i}</a>
    <i id="submit_icon_${i}" class="bi bi-check-circle-fill submitted_icon" title="Ingediend"></i>`;
    paginationContainer.appendChild(pageButton);
    restoreButton.textContent = "Herstellen #1";
    submitButton.textContent = "Indienen #1";
  }

  // next button
  const nextButton = document.createElement('li');
  nextButton.className = 'page-item next-b';
  nextButton.innerHTML = `<a class="page-link" href="#${userId}"><i class="bi bi-chevron-right" title="Next"></i></a>`;
  paginationContainer.appendChild(nextButton);
}

function loadQuestions(data,objectIndex) {

  objectId = getObjectId(objectIndex);

  const questionsDiv = document.getElementById('questions_col');
  const questions = questionsDiv.querySelectorAll('.q'); // selecting all questions div

  // iterating over all questions to change their IDs
  questions.forEach((question, index) => {
    const qID = `${objectIndex}_q${index + 1}`
    question.id = qID;

    const qInputs = question.querySelectorAll('input');
    qInputs.forEach((input, inputIndex) => {
      input.id = `${qID}_${inputIndex + 1}`;
      input.name = `question_${qID}_${index + 1}`;
    });

    const qLabels = question.querySelectorAll('label');
    qLabels.forEach((label, labelIndex) => {
      label.setAttribute('for',`${qID}_${labelIndex + 1}`);
    });

    const qTextareas = question.querySelectorAll('textarea');
    qTextareas.forEach((textarea) => {
      textarea.id = `${qID}_text`;
    });
  });

  // Filling in previous responses OR empty if no responses

  Object.keys(data[objectId]).forEach(qKey => {
    const response = data[objectId][qKey];

    // select radio if there are responses to q1 or q2
    if (response !== '' && (qKey === 'q1' | qKey === 'q2')){
      inputSelected = document.getElementById(`${objectIndex}_${qKey}_${response}`);
      inputSelected.checked = true;
    };

    // set empty if there are no responses to q1 or q2
    if (response === '' && (qKey === 'q1' | qKey === 'q2')){
      const allRadios = questionsDiv.querySelectorAll('input[type="radio"]'); 
      allRadios.forEach(radio => {
        if (radio.id.includes(qKey)) { // !NB setting empty all radios of one question (q1 or q2)
          radio.checked = false;
        }
      });
    };

    // fill in / empty textareas with responses to q3–q5
    if (qKey === 'q3' | qKey === 'q4' | qKey === 'q5') {
      const textareaToFill = document.getElementById(`${objectIndex}_${qKey}_text`);
      textareaToFill.value = response;
    };

  });

  // check if questions are answered
  checkSubmitAllowed();

}

function markObjectSubmitted() {

  const activePageIcon = document.getElementById(`submit_icon_${objectIndex + 1}`);
  activePageIcon.style.display = "block";
  // modify submitted data
  userSubmitted[objectId] = "True";
}

// rewriting responses for question 1 and 2 in browser data
function updateRadioInput(radio_id, radio_value) {

  const qN = radio_id.match(/_(\w+)_/)[1]; // question number
  userResponses[objectId][qN] = radio_value;
}

// rewriting responses for question 3–5 in browser data
function updateTextareaResponsesInput(textarea_id, textarea_value) {

  const qN = textarea_id.match(/_(\w+)_/)[1]; // question number
  userResponses[objectId][qN] = textarea_value;
}

function checkSubmitAllowed() {

  const submitButton = document.getElementById('submit_btn');
  const disabledDiv = document.getElementById('disabled_tooltip');

  // question 1
  const q1Div = document.getElementById(`${objectIndex}_q1`);
  const q1Radios = q1Div.querySelectorAll('input[type="radio"]');

  let q1HasResponse = false;
  for (let radio of q1Radios) {
    if (radio.checked) {
      q1HasResponse = true;
      break;
    }
  }

  // question 2
  const q2Div = document.getElementById(`${objectIndex}_q2`);
  const q2Radios = q2Div.querySelectorAll('input[type="radio"]');

  let q2HasResponse = false;
  for (let radio of q2Radios) {
    if (radio.checked) {
      q2HasResponse = true;
      break;
    }
  }

  // question 3
  const q3Input = document.getElementById(`${objectIndex}_q3_text`);
  const q3HasResponse = q3Input.value.trim() !== '';

  // check responses and change the submit button state
  if (q1HasResponse && q2HasResponse && q3HasResponse) {
        submitButton.removeAttribute('disabled');
        disabledDiv.removeAttribute('data-bs-original-title');
      }
  else {
        submitButton.setAttribute('disabled','true');
        disabledDiv.setAttribute('data-bs-original-title','Beantwoord de verplichte vragen hieronder voordat u dit object  indient');
  }
}