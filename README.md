# Alter Heritage
### A web app to gather expert knowledge on inclusive cultural heritage metadata

[The live demo for EKAW-24](https://alterheritage.project.cwi.nl/#ekaw24demo)

Alter Heritage allows researchers to collect data on how annotators edit cultural heritage metadata containing cultural biases. This data shows what kind of alterations in metadata can make it more inclusive according to annotators. Using the app, it is also possible to study differences of edits between different annotators and different artefacts' metadata.
To annotators, Alter Heritage offers an interactive environment for editing metadata. They can perfrom such actions as adding new content (for example, a new metadata field or a keyword), removing content, hiding parts of metadaata from the view, attaching notes and warning to metadata fields and keywords (for example, to signal about the usage of biased terminology). Try out all the functionality in the live demo.

## Functionality Requirements
To determine which metadata editing functionality the web app should have, we used the domain analysis approach. We collected domain documents, such as guidelines, policies, recommendations from the cultural heritage domain on how to make metadata more inclusive. From these documents, we extracted phrases with concrete actions on making changes in metadata. Based on the actions, we formulated use cases and scenarios. Subsequently, we formulated the functionality requirements. You can find the whole process of elicitation in [this Google Sheet](https://docs.google.com/spreadsheets/d/1HPHaj2z9gV3CidbmkV2lcv-i6N-0ud1Lg_DZXoErEj8/edit?usp=sharing): the tab "documents" contains a list of the domain documents we selected; "requirements_elicitation" shows the process of finding actions, formulating use cases and scenarios; "functionality" groups scenarios and describes the resulting functionality.

## Development

Alter Heritage is built with HTML, CSS, and JavaScript, runnin on a Node.js server. It utilises the Fetch API to parse JSON-files with the metadata of artefacts and POST requests to save annotators' edits. See the source code in [metadata_editor/http_root](metadata_editor/http_root).

## License

 <p xmlns:cc="http://creativecommons.org/ns#" xmlns:dct="http://purl.org/dc/terms/"><a property="dct:title" rel="cc:attributionURL" href="https://github.com/cultural-ai/AlterHeritage">Alter Heritage</a> by <span property="cc:attributionName">Andrei Nesterov (CWI), Laura Hollink (CWI), Jacco van Ossenbruggen (VU)</span> is licensed under <a href="https://creativecommons.org/licenses/by-sa/4.0/?ref=chooser-v1" target="_blank" rel="license noopener noreferrer" style="display:inline-block;">Creative Commons Attribution-ShareAlike 4.0 International<img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/cc.svg?ref=chooser-v1" alt=""><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/by.svg?ref=chooser-v1" alt=""><img style="height:22px!important;margin-left:3px;vertical-align:text-bottom;" src="https://mirrors.creativecommons.org/presskit/icons/sa.svg?ref=chooser-v1" alt=""></a></p>
