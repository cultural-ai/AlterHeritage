// making subject terms button
function subjectTermButton(text, className) {
  const button = document.createElement('subject-term-button');
  button.className = `subject-term-button ${className}`;
  button.textContent = text;
  return button;
}

// adding subject terms
function addSubjectTerm(text) {
  const term = document.createElement('span');
  term.className = 'subject-term';
  term.textContent = text;

  //hide button
  const hideButton = subjectTermButton('-', 'hide-button');
  term.appendChild(hideButton);

  //remove button
  const removeButton = subjectTermButton('X', 'remove-button');
  term.appendChild(removeButton);

  return term;
}

const jsonldUrl = 'https://data.collectienederland.nl/data/aggregation/joods-historisch/M013571.json-ld';

// fetching JSON-LD
fetch(jsonldUrl)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return response.json();
    })
    .then(jsonldData => {
        return jsonld.expand(jsonldData);
    })
    .then(expanded => {
        expanded.forEach(item => {
          // ProvidedCHO
            if (item['@type'] && item['@type'].includes('http://www.europeana.eu/schemas/edm/ProvidedCHO')) {
              // title
                const title = item['http://purl.org/dc/elements/1.1/title'][0]['@value'];
                document.getElementById('title').value = title;
              
              // description
              const description = item['http://purl.org/dc/elements/1.1/description'][0]['@value'];
              document.getElementById('description').textContent = description;

              // subject terms
              const subjectTerms = item['http://purl.org/dc/elements/1.1/subject'];
              const subjectTermsContainer = document.getElementById('subject-terms-container')
              subjectTerms.forEach(subject => {
                const term = addSubjectTerm(subject['@value']);
                subjectTermsContainer.appendChild(term);
            });
                
            }
          // Aggregation
          if (item['@type'] && item['@type'].includes('http://www.openarchives.org/ore/terms/Aggregation')) {
            // image
            const imageURL = item['http://www.europeana.eu/schemas/edm/object'][0]['@value'];
            document.getElementById('object-image').src = imageURL;
          }
        });
    })
    .catch(err => {
        console.error("Error fetching or processing JSON-LD:", err);
    });



// toggling edit/save buttons and enable/disable form fields
document.getElementById('edit_btn_title').addEventListener('click', function() {
    document.getElementById('title').removeAttribute('disabled');
    });
    //document.getElementById('saveBtn').style.display = 'inline-block';

  document.getElementById('save_btn').addEventListener('click', function(event) {
    event.preventDefault(); // Prevent form submission
    // For this prototype, we're just going to prevent the submission
  });