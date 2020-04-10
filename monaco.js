// Connect to the domain.
//config.js has settings
//username is rand number
//should be able to change to match student ID or even name
const userID = Math.round(Math.random() * 100);

define("monaco-editor", [
  'vs/editor/editor.main',
  'Convergence',
  'MonacoConvergenceAdapter'], function (_, Convergence, MonacoConvergenceAdapter) {

  // Create the target editor where events will be played into.
  const editor = monaco.editor.create(document.getElementById("codeEditor"), {
    value: editorContents,//variable in default contents file
    language: 'java'//changes language suggestins that monaco gives 
  });

  Convergence.connectAnonymously(CONVERGENCE_URL, userID)
    .then(d => {
      domain = d;
      // Now open the model, creating it using the initial data if it exists.
      //can change defaultEditorContents.js for changing what editor initially starts up with
      //useful for supplying boiler plate code for labs
      return domain.models().openAutoCreate({
        collection: "Final year project",
        id: "Toy",
        data:{
          "text": editorContents
        }
      })
    })
    .then((model) =>{
      const adapter = new MonacoConvergenceAdapter(editor, model.elementAt("text"));
      adapter.bind();
    })
    .catch(error =>{
      console.error("Error opening model: ", error);
    });
});
