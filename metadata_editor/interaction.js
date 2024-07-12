// const jsonldUrl = 'a link to objects';

const localPath = 'objects/objects_sample.json';

// fetching JSON-LD; for now, locally

const object_index = 0;

load_object(localPath,object_index);

function load_object(localPath,index){
  fetch(localPath)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(jsonData => {
      const data = jsonData;

      const objectsN = getObjectsN(data);
      console.log(`Number of objects: ${objectsN}`);

      const objectFields = data.objects.map(object => objectFieldsParse(object));

      const img_url = data.objects[index].img;

      embedObject(objectFields[index],img_url);
    });
}

function embedObject(singleObjectFields,img_url) {

  const imgContainer = document.getElementById('object-image');
  imgContainer.src = img_url;

  const objectMetadataContainer = document.getElementById('object_matadata_container');

  // clearing previous object's fields
  objectMetadataContainer.innerHTML = '';

  singleObjectFields.forEach(field => {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'row field_group';
    fieldDiv.id = `field_group_${field.property}`;

    if (field.type === 'editable') {
      fieldDiv.innerHTML = `
      <div class="col-md-1 field_names">
        <label for="${field.property}">${field.name}</label>
      </div>

      <div class="col-md-9 field_value_area" id="container_${field.property}">
        <textarea class="form-control" id="${field.property}">${field.value}</textarea>

        <div class="row under_field_buttons">
          <div class="col add_note">
          <button type="button" class="btn btn-secondary btn-sm add_note_btn"><i class="bi bi bi-pencil" style="font-size: 0.9rem;"></i> add a note</button>
          </div>

          <div class="col add_warning">
          <button type="button" class="btn btn-secondary btn-sm add_warning_btn"><i class="bi bi-exclamation-triangle-fill" style="font-size: 0.9rem;"></i> add a warning</button>
          </div>
        </div>
      </div>
                
      <div class="col-md-2 field_btns">
        <button title="Hide ${field.name}" class="btn btn-outline-secondary btn-sm hide_field_btn" type="button" id ="hide_field_btn_${field.property}" field-id="${field.property}">
          <i class="bi bi-eye-slash-fill" style="font-size: 1.2rem;"></i>
        </button>
        <button class="btn btn-outline-secondary btn-sm remove_field_btn" type="button" field-id="${field.property}">
          <i class="bi bi-x-lg" style="font-size: 1.2rem;"></i>
        </button>
      </div>
      `;
      objectMetadataContainer.appendChild(fieldDiv);
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
  const textarea = document.getElementById(fieldId);
  if (textarea) {
    textarea.disabled = !textarea.disabled;
  }
}

function hideKeyword(kwId) {
  const p_keyword = document.getElementById(kwId);
  p_keyword.classList.toggle('kw_hidden');
}

// Listener for buttons inside object_matadata_container

document.getElementById('object_matadata_container').addEventListener('click', function(event) {
  const target = event.target;
  // FIELDS
  // hide field
  if (target.closest('.hide_field_btn')) {

    const fieldId = target.closest('.hide_field_btn').getAttribute('field-id');
    const button = document.getElementById(`hide_field_btn_${fieldId}`);
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
  // add warning

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

});

document.addEventListener('DOMContentLoaded', (event) => {
  const restoreButton = document.getElementById('restore_btn');
  restoreButton.addEventListener('click', () => {
  load_object(localPath,object_index);
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