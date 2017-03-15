/*
  This example will receive multiple universes via Artnet and control a strip of ws2811 leds via
  Adafruit's NeoPixel library: https://github.com/adafruit/Adafruit_NeoPixel
  This example may be copied under the terms of the MIT license, see the LICENSE file for details
*/

#if defined(ARDUINO_ARCH_ESP32)
#include <WiFi.h>
#else
#include <ESP8266WiFi.h>
#endif
#include <WiFiUdp.h>
#include <ArtnetWifi.h>
#include <Adafruit_NeoPixel.h>


//Wifi settings
const char* ssid = "PUB-Experimental";
const char* password = "B1neN5tich";


//IP config

//IP des Microcontrollers
IPAddress staticIP(192, 168, 0, 22);
//Gateway
IPAddress gateway(192, 168, 0, 1);
//Subnetzmaske
IPAddress subnet(255, 255, 255, 0);

// Neopixel settings
const int numLeds = 126;
Adafruit_NeoPixel strip0 = Adafruit_NeoPixel(numLeds, 4, NEO_GRB);
Adafruit_NeoPixel strip1 = Adafruit_NeoPixel(numLeds, 2, NEO_GRB);
Adafruit_NeoPixel strip2 = Adafruit_NeoPixel(numLeds, 0, NEO_GRB);
Adafruit_NeoPixel strip3 = Adafruit_NeoPixel(numLeds, 13, NEO_GRB);
Adafruit_NeoPixel strip4 = Adafruit_NeoPixel(numLeds, 14, NEO_GRB);

// Artnet settings
ArtnetWifi artnet;

// connect to wifi – returns true if successful or false if not
boolean ConnectWifi(void)
{
  boolean state = true;
  int i = 0;

  WiFi.begin(ssid, password);
  WiFi.config(staticIP, gateway, subnet);
  Serial.println("");
  Serial.println("Connecting to WiFi");

  // Wait for connection
  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    if (i > 20) {
      state = false;
      break;
    }
    i++;
  }
  if (state) {
    Serial.println("");
    Serial.print("Connected to ");
    Serial.println(ssid);
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("");
    Serial.println("Connection failed.");
  }

  return state;
}

void initTest()
{
  for (int i = 0 ; i < numLeds ; i++) {
    strip0.setPixelColor(i, 127, 0, 0);
    strip1.setPixelColor(i, 127, 0, 0);
    strip2.setPixelColor(i, 127, 0, 0);
    strip3.setPixelColor(i, 127, 0, 0);
    strip4.setPixelColor(i, 127, 0, 0);
  }
  showStrips();

  delay(500);
  for (int i = 0 ; i < numLeds ; i++) {
    strip0.setPixelColor(i, 0, 127, 0);
    strip1.setPixelColor(i, 0, 127, 0);
    strip2.setPixelColor(i, 0, 127, 0);
    strip3.setPixelColor(i, 0, 127, 0);
    strip4.setPixelColor(i, 0, 127, 0);
  }
  showStrips();

  delay(500);
  for (int i = 0 ; i < numLeds ; i++) {
    strip0.setPixelColor(i, 0, 0, 127);
    strip1.setPixelColor(i, 0, 0, 127);
    strip2.setPixelColor(i, 0, 0, 127);
    strip3.setPixelColor(i, 0, 0, 127);
    strip4.setPixelColor(i, 0, 0, 127);
  }
  showStrips();

  delay(500);
  for (int i = 0 ; i < numLeds ; i++) {
    strip0.setPixelColor(i, 0, 0, 0);
    strip1.setPixelColor(i, 0, 0, 0);
    strip2.setPixelColor(i, 0, 0, 0);
    strip3.setPixelColor(i, 0, 0, 0);
    strip4.setPixelColor(i, 0, 0, 0);
  }
  showStrips();
}

void onDmxFrame(uint16_t universe, uint16_t length, uint8_t sequence, uint8_t* data)
{
  for (int i = 0; i < length / 3; i++) {
    switch (universe) {
      case 0:
        strip0.setPixelColor(i, data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
        break;
      case 1:
        strip1.setPixelColor(i, data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
        break;
      case 2:
        strip2.setPixelColor(i, data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
        break;
      case 3:
        strip3.setPixelColor(i, data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
        break;
      case 4:
        strip4.setPixelColor(i, data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
        break;
    }
  }
  /*
    Serial.print(universe, DEC);
    Serial.print(": ");
    Serial.print(length, DEC);
    Serial.println(" Data recieved.");
  */
}

void showStrips() {
  strip0.show();
  strip1.show();
  strip2.show();
  strip3.show();
  strip4.show();
}

void setup()
{
  Serial.begin(115200);
  ConnectWifi();

  artnet.begin();

  strip0.begin();
  strip1.begin();
  strip2.begin();
  strip3.begin();
  strip4.begin();

  initTest();

  // this will be called for each packet received
  artnet.setArtDmxCallback(onDmxFrame);
}

void loop()
{
  // we call the read function inside the loop
  artnet.read();

  showStrips();
}
