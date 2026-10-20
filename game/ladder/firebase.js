const firebaseConfig = {
    apiKey: "AIzaSyBzLchy5M2fLne4c7Ghw1KNN8wVrlZdd8M",
    authDomain: "friendsgame-872f5.firebaseapp.com",
    databaseURL: "https://friendsgame-872f5-default-rtdb.firebaseio.com",
    projectId: "friendsgame-872f5",
    storageBucket: "friendsgame-872f5.firebasestorage.app",
    messagingSenderId: "522534013233",
    appId: "1:522534013233:web:f5faa6e6795023d0420810",
    measurementId: "G-PW5H3G97QR"
};

let auth = null;
let db = null;

if (typeof firebase !== "undefined") {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    db = firebase.firestore();
}
