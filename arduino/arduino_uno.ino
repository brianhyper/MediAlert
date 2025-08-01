#define TRIG 9
#define ECHO 8
#define RELAY 7

long duration;
int distance;

void setup() {
  Serial.begin(9600);
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);
  pinMode(RELAY, OUTPUT);
  digitalWrite(RELAY, LOW); // Motor OFF by default
}

void loop() {
  // Trigger ultrasonic pulse
  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  // Read echo duration
  duration = pulseIn(ECHO, HIGH, 30000); // Timeout after 30 ms

  if (duration > 0) {
    distance = duration * 0.0343 / 2; // Convert to cm
    Serial.print("Distance: ");
    Serial.print(distance);
    Serial.println(" cm");

    if (distance < 10) {
      Serial.println("Motion detected! Relay ON");
      digitalWrite(RELAY, HIGH);  // Motor ON
      delay(1300);                // Run for 1 second
      digitalWrite(RELAY, LOW);   // Motor OFF
      Serial.println("Relay OFF");
      delay(10000);               // Cooldown before next detection
      return;
    }
  } else {
    Serial.println("No echo");
  }

  delay(1000); // Loop delay
}
