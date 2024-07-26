const path = 'server/objects/';

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

// counters for unique ids for user keywords and fields
let keywords_count = 100;
let fields_count = 100;

let objectIndex = 0; // starting with the 1st object
let objectId; // for object ID

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
        <p>Dear participant,<br> Before you begin the task, we would like to inform you that:<br></p>
          <ol class="consent_points">
            <li>we do not collect your personal data during the study;</li>
            <li>all your input remains confidential;</li>
            <li>your input is being stored on our server;</li>
            <li>we will use your input in our study only with your consent;</li>
            <li>due to the nature of the study, you may encounter offensive content during the task.</li>
          </ol>
          <p>By pressing the button "Begin", you confirm that you are informed of the points above and provide us with your consent to use your input in out study.<br>
          For questions, contact email@cwi.nl</p>
          <button title="Begin" class="btn btn-outline-secondary btn-md consent_btn" type="button" id="consent_btn">Begin</button>
      </div>
    </div>
    `
    body.insertBefore(consentDiv,firstDiv);
    
    const consentButton = document.getElementById('consent_btn');
    // consent button listener
    consentButton.addEventListener('click', () => {
      embedObject(userData,0);
      consentDiv.classList.add('removing');
      consentDiv.addEventListener('transitionend', () => {
        consentDiv.remove();
        content.classList.add('making_visible');});

    userConsent[userId] = "True"; //rewrite consent
    submitData(consentFilename,userConsent);
    });
  }
  else {
    embedObject(userData,0);
    content.classList.add('making_visible');
  };

});

function getUserId() {
  return window.location.hash.substring(1); // Get the part after the '#'
}

function getObjectId(object_index) {
  return userData['objects'][object_index]['object_id'];
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

async function submitData(filename,data) {
  fetch(`/save/${filename}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => {
    if (!response.ok && filename.includes('user')) {
      error_message = `${error} \n Please contact us`;
      notificationDataSubmitted(error_message,"red"); // a notification pop-up only if *a user* submits the data
    }
    if (response.ok && filename.includes('user')) {
      notificationDataSubmitted("Submitted successfully","green");
    }
  })
  .catch(error => {
    if (filename.includes('user')){
      error_message = `${error} \n Please contact us`;
      notificationDataSubmitted(error_message,"red");
    }
  });
}

function notificationDataSubmitted(message,outcome) {
  const notificationContainer = document.getElementById('notification_submitted');

  // the notification element dependint on outcome
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

  // Hide the notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('making_visible');
    notification.classList.add('removing');

    // Remove the notification from the DOM after it hides
    notification.addEventListener('transitionend', () => {
      notification.remove();
    });
  }, 4000);
}

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
  restoreButton.textContent = `Restore #${pageNumber}`;

  const submitButton = document.getElementById('submit_btn');
  submitButton.textContent = `Submit #${pageNumber}`;


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
    pageButton.innerHTML = `<a class="page-link" href="#${userId}">${i}</a>`;
    paginationContainer.appendChild(pageButton);
    restoreButton.textContent = "Restore #1";
    submitButton.textContent = "Submit #1";
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

function embedObject(data,objectIndex) {

  const imgContainer = document.getElementById('object-image');
  const img_url = data.objects[objectIndex].img;
  imgContainer.src = img_url;

  const objectMetadataContainer = document.getElementById('object_metadata_container');

  // clearing previous object's fields
  objectMetadataContainer.innerHTML = '';

  // add a new field buton
  const addFieldButtonDiv = document.createElement('div');
  addFieldButtonDiv.className = 'row add_field';
  addFieldButtonDiv.innerHTML = `
  <div class="col-md-12 add_field_col">
    <button title="Add a new field" class="btn btn-outline-secondary btn-sm add_field_btn" type="button" id ="add_field_btn">
      <i class="bi bi-plus-lg"></i> Add a new field
  </div>`
  objectMetadataContainer.appendChild(addFieldButtonDiv);

  // add the field group input
  const fieldInputGroup = document.createElement('div');
  fieldInputGroup.className = 'row field_input_group div_hidden';
  fieldInputGroup.id = 'add_new_field_group';
  fieldInputGroup.innerHTML = `
    <div class="col-md-2 field_names">

      <input type="text" class="form-control field_name_input" placeholder="Field name">
      
    </div>

    <div class="col-md-8 field_value_area">

    <div class="row">
      <textarea class="form-control field_value_input"></textarea>
    </div>

    </div>

    <div class="col-md-2 field_button_input">

      <button title="Add field" class="btn btn-outline-secondary btn-sm check_add_field_btn" type="button" disabled="true">
        <i class="bi bi-check-lg check_add_field_icon"></i>
      </button>

    </div>
      `;

  objectMetadataContainer.appendChild(fieldInputGroup);

  const singleObjectFields = data.objects[objectIndex].fields;

  singleObjectFields.forEach(field => {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'row field_group';
    fieldDiv.id = `field_group_${field.property}`;

    if (field.type === 'editable' && field.removed === 'False') {
      fieldDiv.innerHTML = `
      <div class="col-md-2 field_names">
        <label for="${field.property}">${field.name}</label>
      </div>

      <div class="col-md-8 field_value_area" id="container_${field.property}">
        <div class="row">
          <textarea class="form-control" id="${field.property}">${field.value}</textarea>
        </div>
      </div>
                
      <div class="col-md-2 field_btns">
        <div class="row upper_btns">

          <button title="Hide ${field.name}" class="btn btn-outline-secondary btn-sm hide_field_btn" type="button" id="hide_field_btn_${field.property}" field-id="${field.property}">
            <i class="bi bi-eye-slash-fill" style="font-size: 1.2rem;"></i>
          </button>

          <button title="Remove ${field.name}" class="btn btn-outline-secondary btn-sm remove_field_btn" type="button" field-id="${field.property}">
            <i class="bi bi-x-lg" style="font-size: 1.2rem;"></i>
          </button>

        </div>

        <div class="row down_btns">

          <button title="Add a note to ${field.name}" class="btn btn-secondary btn-sm add_note_btn" type="button" id="add_note_btn_${field.property}" field-id="${field.property}"><i class="bi bi bi-pencil" style="font-size: 1.2rem;"></i></button>

          <button title="Add a warning to ${field.name}" class="btn btn-secondary btn-sm add_warning_btn" type="button" id="add_warning_btn_${field.property}" field-id="${field.property}"><i class="bi bi-exclamation-triangle-fill" style="font-size: 1.2rem;"></i></button>

        </div>

      </div>
      `;
      objectMetadataContainer.appendChild(fieldDiv);

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
      <div class="col-md-2 field_names">
        <label for="${field.property}">${field.name}</label>
      </div>
      <div class="col-md-10 field_value_area">
        <div id="subject-terms-container"></div>
      </div>
      `

      objectMetadataContainer.appendChild(fieldDiv);

      const keywordsDiv = document.getElementById('subject-terms-container');

      Object.keys(field.value).forEach((key,index) => {
        let keyword = field.value[key];
        const kwId = `keyword_${index}`;
        // add a keyword if it's not removed
        if (keyword.removed === 'False') {
          const term = addSubjectTerm(key,index);
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
      <button class="btn btn-outline-secondary btn-sm add_keyword_btn" id="add_keyword_btn" title="Add a keyword"><i class="bi bi-plus-lg" style="font-size: 1rem;"></i></button>
      <div class="input-group mb-3 div_hidden" id="keyword_input">
        <input type="text" class="form-control keyword_input_field" id="user_keyword_area" aria-describedby="tooltip_add_btn">
        <button class="btn btn-outline-secondary" type="button" id="tooltip_add_btn" disabled="true"><i class="bi bi-check-lg check_add_keyword"></i></button>
      </div>
      `
      keywordsDiv.appendChild(addKeywordForm);
    }

    if (field.type === 'non-editable') {
      fieldDiv.innerHTML = `
      <div class="col-md-2 field_names">
        <label for="${field.property}">${field.name}</label>
      </div>
      <div class="col-md-10 field_value_area">
        <p id="non-editable-field-value">${field.value}</p>
      </div>
      `
      objectMetadataContainer.appendChild(fieldDiv);

    }
  });

  setTextareaHeight();
  loadQuestions(userResponses,objectIndex);

}

// getting N objects
function getObjectsN(data) {
  return data.objects.length;
}

// parsing fields of one object
function objectFieldsParse(object) {
  return object.fields.map(field => ({
      name: field.name,
      property: field.property,
      value: field.value,
      type: field.type
  }));
}


// making sure that all text in editable fields is visible when object is loaded
function setTextareaHeight() {
  const textareas = document.querySelectorAll('.form-control');
  textareas.forEach(textarea => {
    const newTextareaHeight = textarea.scrollHeight + 2;
    textarea.style.height = `${newTextareaHeight}px`;
  });
}


// making subject terms button
function subjectTermButton(iconElement, className) {
  const button = document.createElement('button');
  button.className = `btn btn-outline-secondary btn-sm subject-term-button ${className}`;
  button.appendChild(iconElement);
  return button;
}

// adding subject terms
function addSubjectTerm(text,index) {
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
  const noteButton = subjectTermButton(noteIcon, 'note-button');
  noteButton.id = `note_button_keyword_${index}`;
  noteButton.setAttribute('keyword-id', `keyword_${index}`);
  noteButton.title = "Add a note";
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
  const hideButton = subjectTermButton(hideIcon, 'hide-button');
  hideButton.id = `hide_button_keyword_${index}`;
  hideButton.setAttribute('keyword-id', `keyword_${index}`);
  hideButton.title = "Hide keyword";
  term.appendChild(hideButton);

  //remove button
  const removeButton = subjectTermButton(removeIcon, 'remove-button');
  removeButton.id = `remove_button_keyword_${index}`;
  removeButton.setAttribute('keyword-id', `keyword_${index}`);
  removeButton.title = "Remove keyword";
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
  fieldDiv.className = 'row field_group';
  fieldDiv.id = `field_group_${fieldName.replace(' ','').toLowerCase()}${fields_count}`;
  const userFieldID = `${fieldName.replace(' ','').toLowerCase()}${fields_count}`;

  fieldDiv.innerHTML = `
      <div class="col-md-2 field_names">
        <label for="${userFieldID}">${fieldName}</label>
      </div>

      <div class="col-md-8 field_value_area" id="container_${userFieldID}">
        <div class="row">
          <textarea class="form-control" id="${userFieldID}">${fieldValue}</textarea>
        </div>
      </div>
                
      <div class="col-md-2 field_btns">
        <div class="row upper_btns">

          <button title="Hide ${fieldName}" class="btn btn-outline-secondary btn-sm hide_field_btn" type="button" id="hide_field_btn_${userFieldID}" field-id="${userFieldID}">
            <i class="bi bi-eye-slash-fill" style="font-size: 1.2rem;"></i>
          </button>

          <button title="Remove ${fieldName}" class="btn btn-outline-secondary btn-sm remove_field_btn" type="button" field-id="${userFieldID}">
            <i class="bi bi-x-lg" style="font-size: 1.2rem;"></i>
          </button>

        </div>

        <div class="row down_btns">

          <button title="Add a note to ${fieldName}" class="btn btn-secondary btn-sm add_note_btn" type="button" id="add_note_btn_${userFieldID}" field-id="${userFieldID}"><i class="bi bi bi-pencil" style="font-size: 1.2rem;"></i></button>

          <button title="Add a warning to ${fieldName}" class="btn btn-secondary btn-sm add_warning_btn" type="button" id="add_warning_btn_${userFieldID}" field-id="${userFieldID}"><i class="bi bi-exclamation-triangle-fill" style="font-size: 1.2rem;"></i></button>

        </div>

      </div>
      `;

  objectMetadataContainer.insertBefore(fieldDiv,firstField);

  submitFieldButton.disabled = true; // disable submit new field button
  fieldNameInput.value = ''; // clearing the filed input field
  fieldValueInput.value = '';
  fields_count += 1;

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

}

function hideField(fieldId) {
  const button = document.getElementById(`hide_field_btn_${fieldId}`);
  const icon = button.querySelector('i');
  const textarea = document.getElementById(fieldId);

  if (icon.classList.contains('bi-eye-slash-fill')) {
    icon.classList.remove('bi-eye-slash-fill');
    icon.classList.add('bi-eye-fill');
    button.title = button.title.replace('Hide', 'Show'); 
  } else {
    icon.classList.remove('bi-eye-fill');
    icon.classList.add('bi-eye-slash-fill');
    button.title = button.title.replace('Show', 'Hide'); 
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
  const objectFields =  userData.objects[objectIndex].fields;
  // make a new list of fields without the removed field
  const newFieldsList = objectFields.filter(item => item.property !== fieldId);
  userData.objects[objectIndex].fields = newFieldsList;
}

function hideKeyword(kwId) {
  const button = document.getElementById(`hide_button_${kwId}`);
  const icon = button.querySelector('i');

  if (icon.classList.contains('bi-eye-slash-fill')) {
    icon.classList.remove('bi-eye-slash-fill');
    icon.classList.add('bi-eye-fill');
    button.title = button.title.replace('Hide', 'Show'); 
  } else {
    icon.classList.remove('bi-eye-fill');
    icon.classList.add('bi-eye-slash-fill');
    button.title = button.title.replace('Show', 'Hide'); 
  }

  const p_keyword = document.getElementById(kwId);
  p_keyword.classList.toggle('kw_hidden');
}

function addFieldNote(fieldId, noteValue) {
  const noteButton = document.getElementById(`add_note_btn_${fieldId}`);
  const fielGroupdDiv = document.getElementById(`field_group_${fieldId}`);
  const textContainer = fielGroupdDiv.querySelector('.field_value_area'); // select textarea column

  // create note
  const note = document.createElement('div');
  note.className = 'row note_area';
  note.id = `note_to_${fieldId}`;
  note.innerHTML = `
    <div class="col-md-1 note_icon_col"><i class="bi bi-sticky-fill note_icon"></i></div>
    <div class="col-md-10 note_col">
      <textarea class="note-form form-control" placeholder="Note">${noteValue}</textarea>
    </div>
    <div class="col-md-1 remove_note_col">
    </div>
  `
  // create remove note button
  const removeNoteButton = document.createElement('button');
  removeNoteButton.className = 'btn btn-outline-secondary btn-sm remove_note_btn'; 
  removeNoteButton.id = `remove_note_btn_${fieldId}`;
  removeNoteButton.innerHTML = '<i class="bi bi-x-lg"></i>';

  const noteButtonContainer = note.querySelector('.remove_note_col');

  textContainer.appendChild(note);
  noteButtonContainer.appendChild(removeNoteButton);
  noteButton.classList.add('disabled');

}

function removeFieldNote(fieldId) {
  // removing the note container
  const divNoteField = document.getElementById(`note_to_${fieldId}`);
  divNoteField.remove();
  // reactivating the add note button
  const addNoteButton = document.getElementById(`add_note_btn_${fieldId}`);
  addNoteButton.classList.remove('disabled');
}

function addFieldWarning(fieldId, warningValue) {
  const warningButton = document.getElementById(`add_warning_btn_${fieldId}`);
  const fielGroupdDiv = document.getElementById(`field_group_${fieldId}`);
  const textContainer = fielGroupdDiv.querySelector('.field_value_area'); // select textarea column

  // create warning
  const warning =  document.createElement('div');
  warning.className = 'row warning_area';
  warning.id = `warning_to_${fieldId}`;
  warning.innerHTML = `
    <div class="col-md-1 warning_icon_col"><i class="bi bi-exclamation-triangle-fill warning_icon"></i></div>
    <div class="col-md-10 warning_col">
      <textarea class="warning-form form-control" placeholder="Warning">${warningValue}</textarea>
    </div>
    <div class="col-md-1 remove_warning_col">
    </div>
  `
  // create remove warning button
  const removeWarningButton = document.createElement('button');
  removeWarningButton.className = 'btn btn-outline-secondary btn-sm remove_warning_btn'; 
  removeWarningButton.id = `remove_warning_btn_${fieldId}`;
  removeWarningButton.innerHTML = '<i class="bi bi-x-lg"></i>';

  const warningButtonContainer = warning.querySelector('.remove_warning_col');

  textContainer.appendChild(warning);
  warningButtonContainer.appendChild(removeWarningButton);
  warningButton.classList.toggle('disabled');
}

function removeFieldWarning(fieldId) {
    // removing the warning container
    const divWarningField = document.getElementById(`warning_to_${fieldId}`);
    divWarningField.remove();
    // reactivating the add warning button
    const addWarningButton = document.getElementById(`add_warning_btn_${fieldId}`);
    addWarningButton.classList.remove('disabled');
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

  const userTerm = addSubjectTerm(newKeyword,user_keyword_index);
  keywordsDiv.insertBefore(userTerm, lastKeyword);

  inputGroup.querySelector('#user_keyword_area').value = ''; // reset the input
  submitKeywordButton.disabled = true; // disable the check button again
  inputGroup.classList.add('div_hidden');
  addKeywordButton.classList.remove('disabled'); // reactivating the add button

  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
  
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
    if (addedNote !== '') {
      noteIcon.classList.remove('div_hidden');
      p_keyword.setAttribute('data-bs-title',addedNote);
    }
    else {
      noteIcon.classList.add('div_hidden');
      p_keyword.removeAttribute('data-bs-title');
    }
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest(`#note_to_${kwId}`) && !event.target.closest(`#note_button_${kwId}`)) {
      tooltip.classList.add('add_note_tooltip_hidden');
    }
  });
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
        disabledDiv.setAttribute('data-bs-original-title','Answer the mandatory questions below before submitting');
  }
}

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
    const kw_to_remove = document.getElementById(`span_${kwId}`);
    kw_to_remove.classList.add('removing');
    kw_to_remove.addEventListener('transitionend', () => {
      kw_to_remove.remove();}, { once: true });
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
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

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

  // submit object
 const submitButton = document.getElementById('submit_btn');
 const disabledDiv = document.getElementById('disabled_tooltip');
  submitButton.addEventListener('click', () => {
    submitData(userFilename, userData);
    submitData(responsesFilename, userResponses);
    });

    // if the submit button is disabled, show a tooltip
  if (submitButton.disabled) {
    disabledDiv.setAttribute('data-bs-original-title','Answer the mandatory questions below before submitting');
  }

  // restore object
  const restoreButton = document.getElementById('restore_btn');
  restoreButton.addEventListener('click', () => {
  userData.objects[objectIndex].fields = originalData.objects[objectIndex].fields;
  embedObject(userData,objectIndex)
  });

});