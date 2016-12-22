#include <FastLED.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>

//WLAN und UDP config

//Netwerkname
const char* ssid = "Mein Netzwerk";
//Netzwerkpassword
const char* password = "**********************";

//IP config

//IP des Microcontrollers
IPAddress staticIP(192, 168, 43, 22);
//Gateway
IPAddress gateway(192, 168, 43, 1);
//Subnetzmaske
IPAddress subnet(255, 255, 255, 0);

//UDP als Wlan Protokl nutzen
WiFiUDP Udp;

//Port auf den die Pakete eintreffen sollen
unsigned int localUdpPort = 1337;
//Buffer fuer reinkommende Pakete
char incomingPacket[255];

//Variabelen fuer die Leds

//Anzahl der Leds pro Ledstreifen (30 Leds pro Meter)
#define NUM_LEDS_PER_STRIP 20
//Helligkeit
#define BRIGHTNESS  100
//Ledtyp
#define LED_TYPE    WS2811
//Reihenfolge der Farben
#define COLOR_ORDER GRB
//Taktrate
#define UPDATES_PER_SECOND 5
//???
CRGB leds[NUM_LEDS_PER_STRIP];

//???
//nicht nachmachen!
int l[10];
int m[10];

//???
CRGBPalette16 currentPalette;
//???
TBlendType    currentBlending;

//???
extern CRGBPalette16 myRedWhiteBluePalette;
//???
extern const TProgmemPalette16 myRedWhiteBluePalette_p PROGMEM;

//???
String color;
//???
int counter;

void setup() {
  //????
  Serial.begin(115200);

  //Information mit welchem Netzwerk der Mikrocontroller sich verbinden moechte
  Serial.printf("Connecting to %s ", ssid);

  //Netzwerkverbindung herstellen
  WiFi.begin(ssid, password);
  //Netzwerkkonfiguration fuer den Microkontroller
  WiFi.config(staticIP, gateway, subnet);

  //Pruefung und Ausgabe des Wlanstatus
  //Solange alle 0,5s . machen bis Wlanverbindung hergestellt wurde
  //Wenn Wlanverbindung aufgebaut wurde mit connected mitteilen
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected");

  //Start des UDP Protokols
  Udp.begin(localUdpPort);
  //Ausgabe welche IP der Mikrokontroller hat und welchen Port er abhoert
  Serial.printf("Now listening at IP %s, UDP port %d\n", WiFi.localIP().toString().c_str(), localUdpPort);


  // Starte Sicherheits delay von 3s
  delay( 3000 );
  //Nur fuer einen Ledstreifen
  //FastLED.addLeds<LED_TYPE, LED_PIN, COLOR_ORDER>(leds, NUM_LEDS).setCorrection( TypicalLEDStrip );
  //Fuer mehrere Ledstreifen
  //???
  FastLED.addLeds<NEOPIXEL, 12>(leds, NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 13>(leds, NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 14>(leds, NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 15>(leds, NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 16>(leds, NUM_LEDS_PER_STRIP);
  //Helligkeit setzen mit BRIGHTNESS (siehe oben)
  FastLED.setBrightness(  BRIGHTNESS );

  //???
  counter = 1;

  //???
  l[0] = 0;
  l[1] = 0;
  l[2] = 0;


}

void loop() {

  //UDP Paket auslesen und in eizelne ints Umwandeln
  int packetSize = Udp.parsePacket();
  if (packetSize)
  {
    // receive incoming UDP packets
    Serial.printf("Received %d bytes from %s, port %d\n", packetSize, Udp.remoteIP().toString().c_str(), Udp.remotePort());
    int len = Udp.read(incomingPacket, 255);
    if (len > 0)
    {
      incomingPacket[len] = 0;
    }
    Serial.printf("UDP packet contents: %s\n", incomingPacket);

    char *pt;
    pt = strtok (incomingPacket," ,");
    int i = 0;
    while (pt != NULL) {
        m[i] = atoi(pt);
        Serial.printf ("%s\n",pt);
        pt = strtok (NULL, " ,");
        i++;
    }

  }

  contrLED(l[0], l[1], l[2]);
  //Debuging: sehen ob die Farben richtig dargestellt werden welche kommen
  Serial.printf ("l: %i, %i, %i\n",l[0], l[1], l[2]);
  Serial.printf ("m: %i, %i, %i\n",m[0], m[1], m[2]);

  //wie viele leds sind ein die Maximale Auslastung
  int paketlaenge = m[4]/20;
  //mindestens eine Led soll leuchten
  if(paketlaenge == 0) paketlaenge = 1;

  //farben der Ledes
  //um so höher die Auslastung um so mehr Leds sollen leuchten
  //um so niederiger die Auslastung um so weniger Leds sollen leuchten
  if (counter <= paketlaenge) {
      //Farbe
      l[0] = m[0];
      l[1] = m[1];
      l[2] = m[2];
      Serial.printf("farbe\n");
    } else {
      //Schwarz
      l[0] = 0;
      l[1] = 0;
      l[2] = 0;
      Serial.printf("black\n");
    }
  if (counter == 5){
    counter = 1;
  } else {
    counter++;
  }
  //zeig an
  FastLED.show();

  //variablen delay erzeugen
  int delayLed = (m[3] / 10);
  if (delayLed == 0) delayLed = 1;

  //warte und dann mach weiter
  FastLED.delay((5000 / UPDATES_PER_SECOND) / delayLed); // 0% = 2000ms 100%= 200ms



}

/**
 * Prozedur um den Leds die richtige Farbe zu geben
 * @param
 * @return
 */

void ledFearben() {
  //lese aus dem Udp Buffer die Infos aus welche Leds welche Farbe kriegen

  //welche Leds gehoeren zu sammen

  //zusammen gehorige leds faerben





  /*/
  //Faeben der Leds
  int paketlaenge = m[4]/20;

  if(paketlaenge == 0) paketlaenge = 1;

  if (counter <= paketlaenge) {
      l[0] = m[0];
      l[1] = m[1];
      l[2] = m[2];
      Serial.printf("farbe\n");
    } else { //kann weg
      l[0] = 0;
      l[1] = 0;
      l[2] = 0;

      Serial.printf("black\n");
    }
  if (counter == 5){
    counter = 1;
  } else {
    counter++;
  } */
}

/*
 * erzeuge durchlauf
 */

 //komplett ueberflussig hier nur fuer den Ressbery wichtig !!!
void contrLED(uint8_t ir, uint8_t ig, uint8_t ib) {


  CRGB lastLED;

  lastLED = CRGB(ir, ig, ib);

  CRGB temp;

  for (int dot = 0; dot < NUM_LEDS_PER_STRIP; dot++) {

    temp = lastLED;
    lastLED = leds[dot];
    leds[dot] = temp;
  }
}

