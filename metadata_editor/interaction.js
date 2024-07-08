// const jsonldUrl = 'a link to objects';

const localPath = 'objects/objects_sample.json'

// fetching JSON-LD; for now, locally
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

      const img_url = data.objects[0].img;

      embedObject(objectFields[0],img_url);
    });

function embedObject(singleObjectFields,img_url) {

  const imgContainer = document.getElementById('object-image');
  imgContainer.src = img_url;

  const objectMetadataContainer = document.getElementById('object_matadata_container');

  // clearing previous object's fields
  objectMetadataContainer.innerHTML = '';

  singleObjectFields.forEach(field => {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'row field_group';

    if (field.type === 'editable') {
      fieldDiv.innerHTML = `
      <div class="col-md-1 field_names">
        <label for="${field.property}">${field.name}</label>
      </div>

      <div class="col-md-9 field_value_area">
        <textarea class="form-control" id="${field.property}">${field.value}</textarea>
      </div>
                
      <div class="col-md-2 field_btns">
        <button class="btn btn-outline-secondary btn-sm hide_field_btn" type="button" id="hide_field_btn_${field.property}">
          <i class="bi bi-eye-slash-fill" style="font-size: 1.2rem;"></i>
        </button>
        <button class="btn btn-outline-secondary btn-sm remove_field_btn" type="button" id="remove_field_btn_${field.property}">
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
      keywords.forEach(keyword => {
        const term = addSubjectTerm(keyword);
        keywordsDiv.appendChild(term);});

      // add a keyword button

      addKeywordButton = document.createElement('button');
      addKeywordButton.className = `btn btn-outline-secondary btn-sm add_keyword_btn`

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
function addSubjectTerm(text) {
  const term = document.createElement('span');
  term.className = 'subject-term';
  term.textContent = text;

  // Create icon elements
  const noteIcon = document.createElement('i');
  noteIcon.className = 'st-icon bi bi-pencil';
  noteIcon.style.fontSize = '0.9rem';

  const hideIcon = document.createElement('i');
  hideIcon.className = 'st-icon bi bi-eye-slash';
  hideIcon.style.fontSize = '0.9rem';

  const removeIcon = document.createElement('i');
  removeIcon.className = 'st-icon bi bi-x-lg';
  removeIcon.style.fontSize = '0.9rem';

  //add a note button
  const noteButton = subjectTermButton(noteIcon, 'note-button');
  term.appendChild(noteButton);
  
  //hide button
  const hideButton = subjectTermButton(hideIcon, 'hide-button');
  term.appendChild(hideButton);

  //remove button
  const removeButton = subjectTermButton(removeIcon, 'remove-button');
  term.appendChild(removeButton);

  return term;
}


// toggling edit/save buttons and enable/disable form fields
//document.getElementById('edit_btn_title').addEventListener('click', function() {
 //   document.getElementById('title').removeAttribute('disabled');
 //   });
    //document.getElementById('saveBtn').style.display = 'inline-block';

// document.getElementById('save_btn').addEventListener('click', function(event) {
 //   event.preventDefault(); // Prevent form submission
    // For this prototype, we're just going to prevent the submission
//  });