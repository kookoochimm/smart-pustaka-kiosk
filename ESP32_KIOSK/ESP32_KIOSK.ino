#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

// =====================================
// RENDER BACKEND URL
// =====================================

const char* USER_CHECK_URL =
  "https://smart-pustaka-kiosk-backend.onrender.com/api/kiosk/scan-user";

const char* BOOK_CHECK_URL =
  "https://smart-pustaka-kiosk-backend.onrender.com/api/books/scan-book";

// =====================================
// RC522 PIN CONFIGURATION
// =====================================

#define SS_PIN   5
#define RST_PIN  22
#define SCK_PIN  18
#define MISO_PIN 19
#define MOSI_PIN 23

MFRC522 rfid(SS_PIN, RST_PIN);

// =====================================
// SCAN CONFIGURATION
// =====================================

String lastUID = "";

unsigned long lastScanTime = 0;

const unsigned long SCAN_COOLDOWN_MS = 2500;

// =====================================
// WIFI CONFIGURATION
// =====================================

// Windows Mobile Hotspot credentials

const char* WIFI_SSID = "www";
const char* WIFI_PASSWORD = "GIYUTOMIOKA";

bool connectWiFi() {

  WiFi.mode(WIFI_STA);

  WiFi.setAutoReconnect(true);
  WiFi.persistent(false);
  WiFi.setSleep(false);

  Serial.println();
  Serial.println("Connecting to Laptop Hotspot...");

  Serial.print("SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long startAttempt = millis();

  // Wait maximum 15 seconds

  while (
    WiFi.status() != WL_CONNECTED &&
    millis() - startAttempt < 15000
  ) {

    delay(500);

    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println();
    Serial.println("==============================");
    Serial.println("Wi-Fi Connected Successfully!");
    Serial.println("==============================");

    Serial.print("SSID: ");
    Serial.println(WiFi.SSID());

    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());

    Serial.print("Signal Strength: ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");

    return true;
  }

  Serial.println();
  Serial.println("Wi-Fi Connection Failed!");

  return false;
}

// =====================================
// GET RFID UID
// =====================================

String getUID() {

  String uid = "";

  for (byte i = 0; i < rfid.uid.size; i++) {

    if (rfid.uid.uidByte[i] < 0x10) {
      uid += "0";
    }

    uid += String(
      rfid.uid.uidByte[i],
      HEX
    );
  }

  uid.toUpperCase();

  return uid;
}

// =====================================
// SEND UID TO RENDER BACKEND
// =====================================

void sendUID(const String& uid, const char* url) {

  // Check Wi-Fi connection

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("Wi-Fi disconnected. Reconnecting...");

    if (!connectWiFi()) {

      Serial.println("ERROR: Wi-Fi unavailable");

      return;
    }
  }

  WiFiClientSecure client;

  // For initial testing only

  client.setInsecure();

  HTTPClient http;

  http.setTimeout(5000);

  if (!http.begin(client, url)) {

    Serial.println("ERROR: HTTPS connection failed");

    return;
  }

  http.addHeader(
    "Content-Type",
    "application/json"
  );

  String payload = "{\"uid\":\"" + uid + "\"}";

  Serial.println("Sending UID to Render...");

  int httpCode = http.POST(payload);

  if (httpCode > 0) {

    Serial.print("HTTP Status: ");
    Serial.println(httpCode);

    String response = http.getString();

    Serial.println("Backend Response:");
    Serial.println(response);

    if (httpCode >= 200 && httpCode < 300) {

      Serial.println("SUCCESS: Backend accepted request");

    } else {

      Serial.println("ERROR: Backend rejected request");
    }

  } else {

    Serial.print("HTTP Request Failed: ");
    Serial.println(http.errorToString(httpCode));
  }

  http.end();

  client.stop();
}

// =====================================
// SETUP
// =====================================

void setup() {

  Serial.begin(115200);

  delay(500);

  Serial.println();
  Serial.println("================================");
  Serial.println("     SMART PUSTAKA KIOSK");
  Serial.println("================================");

  // RC522 initialization

  SPI.begin(
    SCK_PIN,
    MISO_PIN,
    MOSI_PIN,
    SS_PIN
  );

  rfid.PCD_Init();

  delay(100);

  byte version = rfid.PCD_ReadRegister(
    rfid.VersionReg
  );

  Serial.print("RC522 Firmware: 0x");
  Serial.println(version, HEX);

  // Wi-Fi initialization

  if (!connectWiFi()) {

    Serial.println("Wi-Fi unavailable.");
    Serial.println("Kiosk will retry automatically.");

  }

  Serial.println();
  Serial.println("KIOSK READY");

  Serial.println(
    "Tap user card or book RFID tag."
  );
}

// =====================================
// MAIN LOOP
// =====================================

void loop() {

  // Check Wi-Fi connection

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("Wi-Fi connection lost.");

    if (!connectWiFi()) {

      delay(1000);

      return;
    }
  }

  // Detect RFID card

  if (
    !rfid.PICC_IsNewCardPresent() ||
    !rfid.PICC_ReadCardSerial()
  ) {

    delay(30);

    return;
  }

  String uid = getUID();

  unsigned long now = millis();

  // Prevent duplicate scanning

  if (
    uid == lastUID &&
    now - lastScanTime < SCAN_COOLDOWN_MS
  ) {

    rfid.PICC_HaltA();

    rfid.PCD_StopCrypto1();

    delay(30);

    return;
  }

  lastUID = uid;

  lastScanTime = now;

  Serial.println();
  Serial.println("------------------------------");

  Serial.print("RFID UID: ");
  Serial.println(uid);

  Serial.print("UID Length: ");
  Serial.println(uid.length());

  // =================================
  // USER CARD
  // =================================

  if (uid.length() == 8) {

    Serial.println("Type: USER CARD");

    Serial.println("Checking users table...");

    sendUID(
      uid,
      USER_CHECK_URL
    );
  }

  // =================================
  // BOOK RFID TAG
  // =================================

  else if (uid.length() == 14) {

    Serial.println("Type: BOOK RFID TAG");

    Serial.println("Checking books table...");

    sendUID(
      uid,
      BOOK_CHECK_URL
    );
  }

  // =================================
  // INVALID UID
  // =================================

  else {

    Serial.println("ERROR: Unsupported UID length");
  }

  rfid.PICC_HaltA();

  rfid.PCD_StopCrypto1();

  delay(100);
}