/*
 * Änderungen/Neuerungen vom 19.12.2016:
 * - Implementierung neuer Modi sowie der Modusevaluierung via Switch/Case in Loop()
 * - neue Methode: modeNetworkTraffic()
 * - neue Methode: modeAllOneColor()
 * - neue Methode: modeAllOff()
 * - neue Methode: readUDP()
 * - neue Variable: int ledMode
 * - Variable verändert: int Packetsize (ist nun global)
 * - Variable verändert: int packetlaenge (ist nun global)
 * - Variable verändert: int delayLed (ist nun global)
 * - Variable gelöscht: String color (erfüllt keinen Nutzen mehr)
 */

#define FASTLED_ALLOW_INTERRUPTS 0

#include <FastLED.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <ArtnetWifi.h>

//WLAN und UDP config

//Netwerkname
const char* ssid = "PUB-Experimental";
//Netzwerkpassword
const char* password = "B1neN5tich";

//IP config

//IP des Microcontrollers
IPAddress staticIP(192, 168, 0, 22);
//Gateway
IPAddress gateway(192, 168, 0, 1);
//Subnetzmaske
IPAddress subnet(255, 255, 255, 0);


//UDP als Wlan Protokl nutzen
WiFiUDP Udp;

//Port auf den die Pakete eintreffen sollen
unsigned int localUdpPort = 1337;
//Buffer fuer reinkommende Pakete
char incomingPacket[255];

// artnet variablen
WiFiUDP UdpSend;
ArtnetWifi artnet;

//Variabelen fuer die Leds

//Anzahl der Leds pro Ledstreifen (30 Leds pro Meter)
#define NUM_LEDS_PER_STRIP 126

//Anzahl der LED-Streifen
#define NUM_LED_STRIPS 5

//Helligkeit
#define BRIGHTNESS  100
//Ledtyp
#define LED_TYPE    WS2811
//Reihenfolge der Farben
#define COLOR_ORDER GRB
//Taktrate
#define UPDATES_PER_SECOND 5
//???
CRGB leds[NUM_LED_STRIPS][NUM_LEDS_PER_STRIP];

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

// Variable, welche den aktuellen Modus der LED-Darstellung beinhaltet
int ledMode;
// Packetgröße
int packetSize;
// Packetlänge, welche durchs UDP-Packet übermittelt wird
int paketlaenge;
// Delay als Indikator für die Geschwindigkeit
int delayLed;

// Counter für die maximale Länge der leuchtenden LED-Fragmente
// (benötigt in modeNetworkTraffic())
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
  FastLED.addLeds<NEOPIXEL, 4>(leds[0], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 2>(leds[1], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 0>(leds[2], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 13>(leds[3], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 14>(leds[4], NUM_LEDS_PER_STRIP);
  //Helligkeit setzen mit BRIGHTNESS (siehe oben)
  FastLED.setBrightness(  BRIGHTNESS );

  //???
  counter = 1;

  //???
  l[0] = 0;
  l[1] = 0;
  l[2] = 0;

  m[0] = 5;

  delayLed = 1;

}

void loop() {

  // UDP Packet lesen
  udpRead();

  //Debuging: sehen ob die Farben richtig dargestellt werden welche kommen
  //Serial.printf ("l: %i, %i, %i\n",l[0], l[1], l[2]);
  //Serial.printf ("m: %i, %i, %i\n",m[0], m[1], m[2]);

  // Anzeigemodus wird evaluiert
  switch(m[0]){
    case 0: // LEDs aus
            modeAllOff();
            break;
    case 1: // Netzwerktraffic
            if(ledMode != 1){  // Alle LED zu Anfang schwarz färben
              modeAllOff();
              ledMode = 1;
            }
            modeNetworkTraffic();
             // warte und dann mach weiter
            FastLED.delay(2000 / delayLed); // 0% = 2000ms 100%= 200ms
            break;
    case 2: // statische Fachschaftsfarben
            if(ledMode != 2){
              delayLed = 1; // auf 1 setzen, da ansonsten der alte Wert aus modeNetworkTraffic() verwendet
              ledMode = 2;
            }
            modeAllOneColor(m[1],m[2], m[3]);
            break;
  	case 3: // Future MODE!!
            if(ledMode != 3){
              delayLed = 1; // auf 1 setzen, da ansonsten der alte Wert aus modeNetworkTraffic() verwendet
              ledMode = 3;
            }
            break;
    default:
            modeAllOneColor(255,0, 0);
            break;
  }



  // zeig an
  FastLED.show();
}



/**
 * udpRead liest ein neues UDP Packet gelesen und desse Inhalt in den jeweiligen
 * Slot des m[] Arrays gespeichert werden.
 */
void udpRead(){

 //UDP Paket auslesen und in eizelne ints Umwandeln
  packetSize = Udp.parsePacket();
  if (packetSize)
  {
    // receive incoming UDP packets
    Serial.printf("Received %d bytes from %s, port %d\n", packetSize, Udp.remoteIP().toString().c_str(), Udp.remotePort());
    int len = Udp.read(incomingPacket, 255);

    // Wenn Packetgröße größer als 0, dann soll an der Stelle im Buffer eine 0 gesetzt werden???
    if (len > 0)
    {
      incomingPacket[len] = 0;
    }
    Serial.printf("UDP packet contents: %s\n", incomingPacket);

    // Speichert den Inhalt des UDP Packetes ohne die Kommata
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
}

/**
 * modeNetworkTraffic() visualisiert die Netzwerkauslastung und zeigt sie auf den LEDs an.
 */
void modeNetworkTraffic(){

  //wie viele leds sind ein die Maximale Auslastung
  paketlaenge = m[4]/20;
  //mindestens eine Led soll leuchten
  if(paketlaenge == 0) paketlaenge = 1;

  //farben der Ledes
  //um so höher die Auslastung um so mehr Leds sollen leuchten
  //um so niederiger die Auslastung um so weniger Leds sollen leuchten
  if (counter <= paketlaenge) {
      //Farbe
      l[0] = m[1];
      l[1] = m[2];
      l[2] = m[3];
      Serial.printf("farbe\n");
    } else {
      //Schwarz
      l[0] = 0;
      l[1] = 0;
      l[2] = 0;
      Serial.printf("black\n");
    }
  if (counter == 7){
    counter = 1;
  } else {
    counter++;
  }

  contrLED(l[0], l[1], l[2]);
  //variablen delay definieren
  delayLed = (m[4] / 10);
  if (delayLed == 0) delayLed = 1;
}

void contrLED(uint8_t ir, uint8_t ig, uint8_t ib) {
  CRGB lastLED;

  lastLED = CRGB(ir, ig, ib);

  CRGB temp;

  for (int i = 0; i < NUM_LED_STRIPS; i++){
    for (int dot = 0; dot < NUM_LEDS_PER_STRIP; dot++) {

		temp = lastLED;
		lastLED = leds[i][dot];
		leds[i][dot] = temp;
	  }
  }
}


/**
 * modeAllOneColor() färbt die LEDs abhängig von der übergebenen Farbe
 * @param ir Rotwert
 * @param ig Gruenwert
 * @param ib Blauwert
 */
void modeAllOneColor(uint8_t ir, uint8_t ig, uint8_t ib){
   for (int i = 0; i < NUM_LED_STRIPS; i++){
      for (int dot = 0; dot < NUM_LEDS_PER_STRIP; dot++) {
    //Serial.println(dot, DEC);

    	leds[i][dot] = CRGB(ir,ig,ib);

		  //Serial.print(i, DEC);
      //Serial.print(" ");

	  }
   //Serial.println();
  }
}


/**
 * modeAllOff() schaltet alle LEDs aus
 */
void modeAllOff(){
  for (int i = 0; i < NUM_LED_STRIPS; i++){
    for (int dot = 0; dot < NUM_LEDS_PER_STRIP; dot++) {
    	leds[i][dot] = CRGB::Black;
	  }
  }
}
