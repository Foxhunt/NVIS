/*
  Example, transmit all received ArtNet messages (DMX) out of the serial port in plain text.

  Stephan Ruloff 2016
  https://github.com/rstephan

*/
#define FASTLED_ALLOW_INTERRUPTS 0
//#define FASTLED_INTERRUPT_RETRY_COUNT 0
//#define INTERRUPT_THRESHOLD 1

#if defined(ARDUINO_ARCH_ESP32)
#include <WiFi.h>
#else
#include <ESP8266WiFi.h>
#endif
#include <WiFiUdp.h>
#include <ArtnetWifi.h>
#include "FastLED.h"

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

//FastLED settings
#define NUM_STRIPS 5
#define NUM_LEDS_PER_STRIP 126
CRGB leds[NUM_STRIPS][NUM_LEDS_PER_STRIP];

WiFiUDP UdpSend;
ArtnetWifi artnet;
int length;

// connect to wifi – returns true if successful or false if not
boolean ConnectWifi(void)
{
  boolean state = true;
  int i = 0;

  WiFi.begin(ssid, password);
  WiFi.config(staticIP, gateway, subnet);
  //Serial.println("");
  //Serial.println("Connecting to WiFi");

  // Wait for connection
  //Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    //Serial.print(".");
    if (i > 20) {
      state = false;
      break;
    }
    i++;
  }
  if (state) {
    //Serial.println("");
    //Serial.print("Connected to ");
    //Serial.println(ssid);
    //Serial.print("IP address: ");
    //Serial.println(WiFi.localIP());
  } else {
    //Serial.println("");
    //Serial.println("Connection failed.");
  }

  return state;
}

/*
  void onDmxFrame(uint16_t universe, uint16_t lenght, uint8_t sequence, uint8_t* data)
  {
  for (int l = 0; l < lenght / 3; l++) {
    leds[universe][l] = CRGB(data[l * 3], data[(l * 3) + 1], data[(l * 3) + 2]);
  }
  }
*/

void setup()
{
  // set-up serial for debug output
  //Serial.begin(115200);

  //setup FastLED
  FastLED.addLeds<NEOPIXEL, 4>(leds[0], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 2>(leds[1], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 0>(leds[2], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 13>(leds[3], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 14>(leds[4], NUM_LEDS_PER_STRIP);

  if (ConnectWifi()) {

    //set all pixels on all Strips to Green
    for (int s = 0; s < NUM_STRIPS; s++) {
      for (int l = 0; l < NUM_LEDS_PER_STRIP; l++) {
        leds[s][l] = CRGB::Green;
      }
    }
    FastLED.show();

  } else {

    //set all pixels on all Strips to Red
    for (int s = 0; s < NUM_STRIPS; s++) {
      for (int l = 0; l < NUM_LEDS_PER_STRIP; l++) {
        leds[s][l] = CRGB::Red;
      }
    }
    FastLED.show();

  }

  delay(250);

  //set all pixels on all Strips to Red
  for (int s = 0; s < NUM_STRIPS; s++) {
    for (int l = 0; l < NUM_LEDS_PER_STRIP; l++) {
      leds[s][l] = CRGB::Black;
    }
  }

  FastLED.show();

  delay(250);

  // this will be called for each packet received
  //artnet.setArtDmxCallback(onDmxFrame);
  artnet.begin();

  WiFi.setSleepMode(WIFI_NONE_SLEEP);

  //Serial.println("Ready.");

}

void loop()
{
  // we call the read function inside the loop
  if (artnet.read() == ART_DMX) {

    length = artnet.getLength() <= NUM_LEDS_PER_STRIP * 3 ? artnet.getLength() : NUM_LEDS_PER_STRIP * 3;

    memcpy(leds[artnet.getUniverse()], artnet.getDmxFrame(), length);

  }

  //Show Leds
  FastLED.show();

  yield();

}
