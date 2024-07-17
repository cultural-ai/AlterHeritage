// const jsonldUrl = 'a link to objects';

// const localPath = 'objects/objects_sample.json';

const path = 'objects/';

let userData;
let originalData;

// fetching JSON-LD; for now, locally

let objectIndex = 0;

document.addEventListener('DOMContentLoaded', async() => {
  const userId = getUserId();

  if (!userId) {
    alert('User ID not found');
    return;
  }

  pathUserFile = `${path}user_${userId}.json`;
  userData = await loadObjects(pathUserFile);

  pathOriginalFile = `${path}original_${userId}.json`;
  originalData = await loadObjects(pathOriginalFile);

  numObjects = getObjectsN(userData);
  setPagination(numObjects,userId);

  embedObject(userData,0); // initially, displaying the first object of user data

});

function getUserId() {
  return window.location.hash.substring(1); // Get the part after the '#'
}

async function loadObjects(path) {
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
  restoreButton.textContent = `Restore object ${pageNumber}`;

  const submitButton = document.getElementById('submit_btn');
  submitButton.textContent = `Submit object ${pageNumber}`;


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
    restoreButton.textContent = "Restore object 1";
    submitButton.textContent = "Submit object 1";
  }

  // next button
  const nextButton = document.createElement('li');
  nextButton.className = 'page-item next-b';
  nextButton.innerHTML = `<a class="page-link" href="#${userId}"><i class="bi bi-chevron-right" title="Next"></i></a>`;
  paginationContainer.appendChild(nextButton);
}

function embedObject(data,objectIndex) {

  const imgContainer = document.getElementById('object-image');
  img_url = data.objects[objectIndex].img;
  imgContainer.src = img_url;

  const objectMetadataContainer = document.getElementById('object_matadata_container');

  // clearing previous object's fields
  objectMetadataContainer.innerHTML = '';

  const addFieldButtonDiv = document.createElement('div');
  addFieldButtonDiv.className = 'row add_field';
  addFieldButtonDiv.innerHTML = `
  <div class="col-md-12 add_field_col">
    <button title="Add a new field" class="btn btn-outline-secondary btn-sm add_field_btn" type="button" id ="add_field_btn">
      <i class="bi bi-plus-lg"></i> Add a new field
  </div>`
  objectMetadataContainer.appendChild(addFieldButtonDiv);

  singleObjectFields = data.objects[objectIndex].fields;

  singleObjectFields.forEach(field => {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'row field_group';
    fieldDiv.id = `field_group_${field.property}`;

    if (field.type === 'editable') {
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

      if(field.hidden === 'True') {
        hideField(field.property);
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

      const keywords = field.value;
      const keywordsDiv = document.getElementById('subject-terms-container');
      keywords.forEach((keyword, index) => {
        const term = addSubjectTerm(keyword,index);
        keywordsDiv.appendChild(term);});

      // add a keyword button

      addKeywordButton = document.createElement('button');
      addKeywordButton.className = `btn btn-outline-secondary btn-sm add_keyword_btn`;
      addKeywordButton.title = 'Add a keyword';

      const plusIcon = document.createElement('i');
      plusIcon.className = 'bi bi-plus-lg';
      plusIcon.style.fontSize = '1rem';

      addKeywordButton.appendChild(plusIcon);

      keywordsDiv.appendChild(addKeywordButton)

    
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

    setTextareaHeight();
    
  });

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
  keyword_text.textContent = text;
  term.appendChild(keyword_text);

  return term;
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
}

function hideKeyword(kwId) {
  const p_keyword = document.getElementById(kwId);
  p_keyword.classList.toggle('kw_hidden');
}

function addFieldNote(fieldId) {
  const noteButton = document.getElementById(`add_note_btn_${fieldId}`);
  const fielGroupdDiv = document.getElementById(`field_group_${fieldId}`);
  const textContainer = fielGroupdDiv.querySelector('.field_value_area'); // select textarea column

  // create note
  const note = document.createElement('div');
  note.className = 'row note_area';
  note.id = `note_to_${fieldId}`;
  note.innerHTML = `
    <div class="col-md-1 note_icon_col"><i class="bi bi-sticky note_icon"></i></div>
    <div class="col-md-10 note_col">
      <textarea class="note-form form-control"></textarea>
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
  noteButton.classList.toggle('disabled');
}

function removeFieldNote(fieldId) {
  // removing the note container
  const divNoteField = document.getElementById(`note_to_${fieldId}`);
  divNoteField.remove();
  // reactivating the add note button
  const addNoteButton = document.getElementById(`add_note_btn_${fieldId}`);
  addNoteButton.classList.remove('disabled');
}

function addFieldWarning(fieldId) {
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
      <textarea class="warning-form form-control"></textarea>
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

// Listener for buttons inside object_matadata_container

document.getElementById('object_matadata_container').addEventListener('click', function(event) {
  const target = event.target;
  // FIELDS
  // hide field
  if (target.closest('.hide_field_btn')) {

    const fieldId = target.closest('.hide_field_btn').getAttribute('field-id');
    hideField(fieldId);
  }
  // removing field
  if (target.closest('.remove_field_btn')) {
    const fieldId = target.closest('.remove_field_btn').getAttribute('field-id');
    const div_to_remove = document.getElementById(`field_group_${fieldId}`);
    div_to_remove.classList.add('hidden');
    div_to_remove.addEventListener('transitionend', () => {
      div_to_remove.remove();
    }, { once: true });
  }

  // add note field
  if (target.closest('.add_note_btn')) {
    const fieldId = target.closest('.add_note_btn').getAttribute('field-id');
    addFieldNote(fieldId);
  }

  // remove note + reactivate add note button
  if (target.closest('.remove_note_btn')) {
    const buttonId = target.closest('.remove_note_btn').id;
    const fieldId = buttonId.replace('remove_note_btn_','');
    removeFieldNote(fieldId);
  }

  // add warning
  if (target.closest('.add_warning_btn')) {
    const fieldId = target.closest('.add_warning_btn').getAttribute('field-id');
    addFieldWarning(fieldId);
  }

  // remove warning + reactivate add warning button
  if (target.closest('.remove_warning_btn')) {
    const buttonId = target.closest('.remove_warning_btn').id;
    const fieldId = buttonId.replace('remove_warning_btn_','');
    removeFieldWarning(fieldId);
  }

  // KEYWORDS
  // add note keyword

  // hide keyword
  if (target.closest('.hide-button')) {
    const kwId = target.closest('.hide-button').getAttribute('keyword-id');
    // Select the button by its ID
    const button = document.getElementById(`hide_button_${kwId}`);
    // Select the icon element inside the button
    const icon = button.querySelector('i');
    // Toggle the class of the icon
    if (icon.classList.contains('bi-eye-slash-fill')) {
      icon.classList.remove('bi-eye-slash-fill');
      icon.classList.add('bi-eye-fill');
      button.title = button.title.replace('Hide', 'Show'); 
    } else {
      icon.classList.remove('bi-eye-fill');
      icon.classList.add('bi-eye-slash-fill');
      button.title = button.title.replace('Show', 'Hide'); 
    }

    hideKeyword(kwId);
  }
  // remove keyword
  if (target.closest('.remove-button')) {
    const kwId = target.closest('.remove-button').getAttribute('keyword-id');
    const kw_to_remove = document.getElementById(`span_${kwId}`);
    kw_to_remove.classList.add('hidden');
    kw_to_remove.addEventListener('transitionend', () => {
      kw_to_remove.remove();
    }, { once: true });
  }

  // add keyword

});

document.addEventListener('DOMContentLoaded', (event) => {
  const restoreButton = document.getElementById('restore_btn');
  restoreButton.addEventListener('click', () => {
  userData.objects[objectIndex].fields = originalData.objects[objectIndex].fields;
  embedObject(userData,objectIndex)
  });
  
});


// toggling edit/save buttons and enable/disable form fields
//document.getElementById('edit_btn_title').addEventListener('click', function() {
 //   document.getElementById('title').removeAttribute('disabled');
 //   });
    //document.getElementById('saveBtn').style.display = 'inline-block';

// document.getElementById('save_btn').addEventListener('click', function(event) {
 //   event.preventDefault(); // Prevent form submission
    // For this prototype, we're just going to prevent the submission
//  });