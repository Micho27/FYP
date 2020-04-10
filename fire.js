    function init() {
        //Initialize Firebase.
        var config = {
          databaseURL: "https://FYP-Monaco.firebaseio.com",
          projectId: "FYP-Monaco",
        };
        firebase.initializeApp(config);

        //Get Firebase Database reference.
        var firepadRef = getExampleRef();

        //Create Monaco and firepad.
        require.config({ paths: {'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.20.0/min/vs'}});
        require(['vs/editor/editor.main'], function() {
            editor = monaco.editor.create(
                document.getElementById('firepad'),
                {
                    language: 'java'//change language for editor
                }
            );
            Firepad.fromMonaco(firepadRef, editor);
        });

    }

    //Helper to get hash from end of URL or generate a random one.
    function getExampleRef() {
        var ref = firebase.database().ref();
        var hash = window.location.hash.replace(/#/g, '');
        if (hash) {
            ref = ref.child(hash);
        } else {
            ref = ref.push(); // generate unique location.
            window.location = window.location + '#' + ref.key; // add it as a hash to the URL.
        }
        if (typeof console !== 'undefined') {
            console.log('Firebase data: ', ref.toString());
        }
        return ref;
    }
