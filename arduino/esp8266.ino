#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>

#define WIFI_SSID "net"
#define WIFI_PASSWORD "12345677"
#define FIREBASE_HOST "https://medialert-e4fb1-default-rtdb.firebaseio.com/"
#define FIREBASE_AUTH "5hsYnYcqJSnbEd4uMGxJtJdt9uG66oe3kv3luHT6"

#define PILL_PIN 13  

FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

volatile bool pillDetected = false;
unsigned long pillDetectionTime = 0;
bool waitingPeriod = false;
const unsigned long REMINDER_DELAY = 30000;
unsigned long lastWifiCheck = 0;
const unsigned long WIFI_CHECK_INTERVAL = 5000;
void ICACHE_RAM_ATTR handlePillDetection() {
  pillDetected = true;
}

void sendToFirebase(const char* path, const char* message) {
  FirebaseJson json;
  json.set("message", message);
  char localTime[20];
  snprintf(localTime, sizeof(localTime), "%lu", millis());
  json.set("deviceTimestamp", localTime);
  FirebaseJson timestamp;
  timestamp.set(".sv", "timestamp");
  json.set("serverTimestamp", timestamp);
  Serial.print("Sending to ");
  Serial.print(path);
  Serial.print(": ");
  Serial.println(message); 
  if (Firebase.pushJSON(firebaseData, path, json)) {
    Serial.println("Firebase success");
    Serial.println("Path: " + firebaseData.dataPath());
  } else {
    Serial.println("Firebase FAILED");
    Serial.println("REASON: " + firebaseData.errorReason());
    Serial.println("CODE: " + String(firebaseData.errorCode()));

    Serial.print("Firebase connected: ");
    Serial.println(Firebase.ready() ? "YES" : "NO");
  }
}

void setup() {
  Serial.begin(9600);
  delay(1000);    
  pinMode(PILL_PIN, INPUT_PULLDOWN_16); 
  attachInterrupt(digitalPinToInterrupt(PILL_PIN), handlePillDetection, RISING);
  Serial.println("\nStarting WiFi connection...");
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long wifiStart = millis();
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (millis() - wifiStart > 20000) {
      Serial.println("\nFailed to connect! Restarting...");
      ESP.restart();
    }
  }
  
  Serial.println("\nWiFi connected! IP: " + WiFi.localIP().toString());

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
  Firebase.setReadTimeout(firebaseData, 30 * 1000); 
  Firebase.setwriteSizeLimit(firebaseData, "tiny");
  Firebase.enableClassicRequest(firebaseData, true);
  Serial.println("System ready. Waiting for pill dispense...");
}

void loop() {
  // Maintain WiFi connection
  if (millis() - lastWifiCheck > WIFI_CHECK_INTERVAL) {
    lastWifiCheck = millis();
    
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi disconnected! Reconnecting...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
      delay(2000);
    }
  }

  if (pillDetected) {
    pillDetected = false;
    pillDetectionTime = millis();
    waitingPeriod = true;
    
    Serial.println("PILL DETECTED - SENDING IMMEDIATE NOTIFICATION");
    sendToFirebase("/dispense_events", "Pill dispensed - Please take your medication now");
  }
  if (waitingPeriod && (millis() - pillDetectionTime >= REMINDER_DELAY)) {
    waitingPeriod = false;
    Serial.println("30s PASSED - SENDING REMINDER");
    sendToFirebase("/reminders", "Reminder: Please take your dispensed pill");
  }
}