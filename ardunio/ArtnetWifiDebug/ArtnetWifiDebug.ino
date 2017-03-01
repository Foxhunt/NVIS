/*
  Example, transmit all received ArtNet messages (DMX) out of the serial port in plain text.

  Stephan Ruloff 2016
  https://github.com/rstephan

*/

/*
#define FASTLED_INTERRUPT_RETRY_COUNT 0
#define FASTLED_ALLOW_INTERRUPTS 0
#define INTERRUPT_THRESHOLD 1
/**/

#if defined(ARDUINO_ARCH_ESP32)
#include <WiFi.h>
#else
#include <ESP8266WiFi.h>
#endif
#include <WiFiUdp.h>
#include <ArtnetWifi.h>
#include <FastLED.h>

//Anzahl der Leds pro Ledstreifen
#define NUM_LEDS_PER_STRIP 19
//Anzahl der Streifen
#define NUM_STRIPS 5
//Ledtyp
#define LED_TYPE    NEOPIXEL
//Reihenfolge der Farben
#define COLOR_ORDER GRB
//Helligkeit
#define BRIGHTNESS  100

CRGB leds[NUM_STRIPS][NUM_LEDS_PER_STRIP];

//Netwerkname
const char* ssid = "Foxhunt-Net";
//Netzwerkpassword
const char* password = "";

//IP config

//IP des Microcontrollers
IPAddress staticIP(192, 168, 0, 22);
//Gateway
IPAddress gateway(192, 168, 0, 1);
//Subnetzmaske
IPAddress subnet(255, 255, 255, 0);

WiFiUDP UdpSend;
ArtnetWifi artnet;

// connect to wifi returns true if successful or false if not
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

void onDmxFrame(uint16_t universe, uint16_t length, uint8_t sequence, uint8_t* data)
{

  /*
  boolean tail = false;
  uint16_t outLength;

  Serial.print("DMX: Univ: ");
  Serial.print(universe, DEC);
  Serial.print(", Seq: ");
  Serial.print(sequence, DEC);
  Serial.print(", Data (");
  Serial.print(length, DEC);
  Serial.print("): ");

  if (length > 16) {
    outLength = 16;
    tail = true;
  }
  // send out the buffer
  for (int i = 0; i < outLength; i++)
  {
    Serial.print(data[i], DEC);
    Serial.print(" ");
  }
  if (tail) {
    Serial.print("...");
  }

  Serial.println();
  */

  for (int i = 0; i < length / 3; i++) {
    leds[universe][i] = CRGB(data[i * 3], data[i * 3 + 1], data[i * 3 + 2]);
  }

}

void setup()
{
  // set-up serial for debug output
  Serial.begin(115200);
  ConnectWifi();

  // this will be called for each packet received
  artnet.setArtDmxCallback(onDmxFrame);
  artnet.begin();

  FastLED.addLeds<LED_TYPE, 4>(leds[0], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<LED_TYPE, 2>(leds[1], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<LED_TYPE, 0>(leds[2], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<LED_TYPE, 13>(leds[3], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<LED_TYPE, 14>(leds[4], NUM_LEDS_PER_STRIP);

  FastLED.setBrightness(  BRIGHTNESS );

}

void loop()
{
  // we call the read function inside the loop
  artnet.read();

  FastLED.show();
}

