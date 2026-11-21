# ST Virtual World
See [SETUP.md](SETUP.md) for Firebase configuration, admin UID setup, deployment and workflow.

Start with zero player accounts and zero houses. Firebase must be configured before registration, submission or admin features work.


Firebase is preconfigured with the Web App settings supplied for the existing `friendsgame-872f5` project. You must still enable Email/Password Authentication, create Firestore, and set your admin UID in both `firebase-config.js` and `firestore.rules` before launch. See `SETUP.md`.
