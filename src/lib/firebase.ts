import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  "projectId": "medialert-e4fb1",
  "appId": "1:283289786918:web:d5a9032303a27c8acde4e7",
  "storageBucket": "medialert-e4fb1.appspot.com",
  "apiKey": "AIzaSyDDaSb0me3e7aERf8DPyKNS3gd0UvQ2NAA",
  "authDomain": "medialert-e4fb1.firebaseapp.com",
  "databaseURL": "https://medialert-e4fb1-default-rtdb.firebaseio.com/",
  "messagingSenderId": "283289786918",
  "measurementId": "G-MEASUREMENT_ID"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export { db, app };
