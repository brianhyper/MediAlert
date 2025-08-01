#include <Wire.h>
#include <RTClib.h>
#include <LiquidCrystal_I2C.h>
#include <Servo.h>

// Modules
RTC_DS3231 rtc;
LiquidCrystal_I2C lcd(0x27, 16, 2);
Servo servoMotor;

// Pins
const int irPin = A0;
const int buzzerPin = 8;         // Buzzer connected here
const int servoPin = 9;
const int espTriggerPin = 7;     // D7 on ESP

// Variables
int irValue = 0;
int distance = 0;
unsigned long lastDispenseTime = 0;
unsigned long lastReminderTime = 0;
bool pillDispensed = false;
int reminderCount = 0;
bool waitingForPickup = false;
bool medicinePickedUp = false;

// Display modes
enum DisplayMode { SHOW_TIME, SHOW_DATE, SHOW_STATUS };
DisplayMode currentDisplay = SHOW_TIME;
unsigned long lastDisplayChange = 0;
const int DISPLAY_INTERVAL = 2000; // 2 seconds per screen

// Tone frequencies
#define TONE_WELCOME 523
#define TONE_DISPENSE 659
#define TONE_REMINDER 440
#define TONE_THANKYOU 784

void setup() {
  Serial.begin(9600);           // Debug

  pinMode(irPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(espTriggerPin, OUTPUT);
  digitalWrite(espTriggerPin, LOW);

  servoMotor.attach(servoPin);
  servoMotor.write(0);          // Initial position - closed

  lcd.init();
  lcd.backlight();

  // Initialize RTC
  if (!rtc.begin()) {
    showError("RTC Error!");
  }

  if (rtc.lostPower()) {
    rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
  }

  // Extended welcome sequence
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Pill Dispenser");
  lcd.setCursor(0, 1);
  lcd.print("Smart Medication");
  
  // Play welcome tone
  playWelcomeTone();
  delay(3000);  // Display welcome message longer

  lastDispenseTime = millis();
  lastDisplayChange = millis();
}

void loop() {
  DateTime now = rtc.now();
  unsigned long currentTime = millis();
  
  // Handle medicine pickup state
  if (medicinePickedUp) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Next pill in");
    lcd.setCursor(0, 1);
    lcd.print("a few minutes");
    delay(10000);
    
    // Reset system for next cycle
    pillDispensed = false;
    waitingForPickup = false;
    medicinePickedUp = false;
    reminderCount = 0;
    lastDispenseTime = millis();
  }
  
  // Rotate display only when not waiting for pickup
  if (!waitingForPickup) {
    if (currentTime - lastDisplayChange >= DISPLAY_INTERVAL) {
      currentDisplay = static_cast<DisplayMode>((currentDisplay + 1) % 3);
      lastDisplayChange = currentTime;
      lcd.clear();
    }
    
    // Display current information
    switch(currentDisplay) {
      case SHOW_TIME: displayTime(now); break;
      case SHOW_DATE: displayDate(now); break;
      case SHOW_STATUS: displayStatus(); break;
    }
  }
  
  // Dispensing logic (every 5 seconds for testing)
  if (!pillDispensed && (currentTime - lastDispenseTime >= 5000)) {
    dispensePill();
  }

  // IR Monitoring for pill pickup
  if (waitingForPickup) {
    irValue = analogRead(irPin);
    distance = map(irValue, 0, 1023, 0, 50); // Convert to cm

    // Pill picked up (distance < threshold)
    if (distance < 7) {
      handlePickup();
    } 
    // Reminder logic (every 30 seconds)
    else if (currentTime - lastReminderTime >= 30000) {
      sendReminder();
    }
  }

  delay(100);
}

// ---------- Display Functions ----------
void displayTime(DateTime now) {
  lcd.setCursor(0, 0);
  lcd.print("Current Time:");
  
  lcd.setCursor(0, 1);
  if (now.hour() < 10) lcd.print('0');
  lcd.print(now.hour());
  lcd.print(':');
  if (now.minute() < 10) lcd.print('0');
  lcd.print(now.minute());
  lcd.print(':');
  if (now.second() < 10) lcd.print('0');
  lcd.print(now.second());
}

void displayDate(DateTime now) {
  lcd.setCursor(0, 0);
  lcd.print("Current Date:");
  
  lcd.setCursor(0, 1);
  if (now.day() < 10) lcd.print('0');
  lcd.print(now.day());
  lcd.print('/');
  if (now.month() < 10) lcd.print('0');
  lcd.print(now.month());
  lcd.print('/');
  lcd.print(now.year());
}

void displayStatus() {
  lcd.setCursor(0, 0);
  lcd.print("System Status:");
  
  lcd.setCursor(0, 1);
  if (waitingForPickup) {
    lcd.print("Waiting pickup");
  } else if (pillDispensed) {
    lcd.print("Dispensed");
  } else {
    lcd.print("Ready");
  }
  
  // Add IR distance indicator
  lcd.setCursor(12, 1);
  lcd.print(distance);
  lcd.print("cm");
}

// ---------- Core Functions ----------
void dispensePill() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Time to take your");
  lcd.setCursor(0, 1);
  lcd.print("medication");
  delay(2000);
  
  // Show persistent pickup message
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Please pick up");
  lcd.setCursor(0, 1);
  lcd.print("your medicine");
  
  // Dispense pill by opening and closing servo
  servoMotor.write(90); // Open position
  delay(300); // Allow pill to fall
  servoMotor.write(0); // Close immediately
  
  // Trigger ESP to send WhatsApp message
  digitalWrite(espTriggerPin, HIGH);
  delay(500); // Ensure ESP detects the trigger
  digitalWrite(espTriggerPin, LOW);
  
  // Play dispense sound
  playDispenseTone();
  
  pillDispensed = true;
  waitingForPickup = true;
  lastReminderTime = millis();
  reminderCount = 0;
}

void handlePickup() {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Thank you!");
  lcd.setCursor(0, 1);
  lcd.print("Get well soon!");
  
  playThankYouTone();
  delay(3000);
  
  // Set flag to show "next pill" message
  medicinePickedUp = true;
}

void sendReminder() {
  reminderCount++;
  lastReminderTime = millis();
  
  // Show persistent pickup message again after reminder
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Please pick up");
  lcd.setCursor(0, 1);
  lcd.print("your medicine");
  
  // Show reminder count on right side
  lcd.setCursor(13, 0);
  lcd.print("R:");
  lcd.print(reminderCount);
  
  // Play reminder sound
  playReminderTone(reminderCount);
  
  if (reminderCount >= 3) {
    delay(2000);
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("No pickup detected");
    lcd.setCursor(0, 1);
    lcd.print("Dispensing again");
    delay(3000);
    
    // Dispense another pill
    pillDispensed = false;
    waitingForPickup = false;
    lastDispenseTime = millis();
  } else {
    delay(2000);
  }
}

// ---------- Buzzer Audio Functions ----------
void playWelcomeTone() {
  // Ascending tones for welcome
  tone(buzzerPin, TONE_WELCOME, 300);
  delay(350);
  tone(buzzerPin, TONE_WELCOME + 110, 300);
  delay(350);
  tone(buzzerPin, TONE_WELCOME + 220, 400);
  delay(450);
  noTone(buzzerPin);
}

void playDispenseTone() {
  // Two short beeps for dispensing
  tone(buzzerPin, TONE_DISPENSE, 200);
  delay(250);
  tone(buzzerPin, TONE_DISPENSE + 100, 200);
  delay(250);
  noTone(buzzerPin);
}

void playReminderTone(int count) {
  // Increasing urgency with more beeps
  for (int i = 0; i < count; i++) {
    tone(buzzerPin, TONE_REMINDER, 150);
    delay(200);
    noTone(buzzerPin);
    delay(100);
  }
}

void playThankYouTone() {
  // Pleasant melody for thank you
  tone(buzzerPin, TONE_THANKYOU, 250);
  delay(300);
  tone(buzzerPin, TONE_THANKYOU - 100, 250);
  delay(300);
  tone(buzzerPin, TONE_THANKYOU, 150);
  delay(200);
  tone(buzzerPin, TONE_THANKYOU + 200, 500);
  delay(550);
  noTone(buzzerPin);
}

// ---------- Error Handling ----------
void showError(const char* message) {
  lcd.clear();
  lcd.print(message);
  while(1) {
    // Flash LED to indicate error
    digitalWrite(LED_BUILTIN, HIGH);
    delay(500);
    digitalWrite(LED_BUILTIN, LOW);
    delay(500);
  }
}