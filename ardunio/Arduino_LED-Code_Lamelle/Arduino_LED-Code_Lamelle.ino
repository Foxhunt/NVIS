/*
   Information:
   Methodenaufrufe, welche Bezug auf die Konsole nehmen, wurden auskommentiert.
   Zu Debugging-Zwecken sollten diese entkommentiert werden,
   um einzelne Aspekte hilfreiche Informationen der UDP Verwendung zu erhalten.
*/

#define FASTLED_ALLOW_INTERRUPTS 0

#include <FastLED.h>
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <ArtnetWifi.h>


// WLAN und UDP config

//Netzwerkname
const char* ssid = "PUB-Experimental";
//Netzwerkpassword
const char* password = "B1neN5tich";


// IP config

// IP des Microcontrollers
IPAddress staticIP(192, 168, 0, 22);

// Gateway
IPAddress gateway(192, 168, 0, 1);
// Subnetzmaske
IPAddress subnet(255, 255, 255, 0);

// UDP als Wlan Protokoll nutzen
WiFiUDP Udp;
ArtnetWifi artnet;
int length;

// Port, auf den die Pakete eintreffen sollen
unsigned int localUdpPort = 1337;
// Buffer für reinkommende Pakete
char incomingPacket[255];

// Nachschlageregister für Sin und Cos
int sinTab[101];
int cosTab[101];


// Variablen für die LEDs

// Anzahl der LEDs pro Ledstreifen (30 Leds pro Meter)
#define NUM_LEDS_PER_STRIP 27
// Anzahl der LED-Streifen
#define NUM_LED_STRIPS 5
// Helligkeit
#define BRIGHTNESS  100
// LED-Typ
#define LED_TYPE    WS2811
// Reihenfolge der Farben
#define COLOR_ORDER GRB
// Taktrate
#define UPDATES_PER_SECOND 5
// LED-Stripe
CRGB leds[NUM_LED_STRIPS][NUM_LEDS_PER_STRIP];

// Array zum Speichern der LED Farbwerte
int ledColor[10];
// Array zum Speichern der Informationen des UDP Pakets
int udpValues[10];

// Aktueller Modus der LED-Darstellung
int ledMode;
// Paketgröße
int packetSize;
// Packetlänge, welche durchs UDP-Packet übermittelt wird
int packetLength;
// Delay als Beschreibung der "Bewegungsgeschwindigkeit" der LEDs
int ledDelay;

// Counter für die maximale Länge der leuchtenden LED-Fragmente
// (benötigt in modeNetworkTraffic())
int counter;
// Ist die Darstellung pausiert?
boolean isPaused;

void(* resetFunc) (void) = 0;




void setup() {

  //Sinus und Cosinus Tabellen füllen.
  for (int i = 0; i < 101; i++) {

    float rad = ((float) i / 100) * (PI * 2  / 4);

    sinTab[i] = 255 * sin(rad);
    cosTab[i] = 255 * cos(rad);

  }

  // Baud setzen
  Serial.begin(115200);

  // Baue Wifi-Verbindug auf.
  connectWifi();

  // Starte Sicherheits-Delay von 3s
  delay( 3000 );

  // Setup der LED-Stripes
  FastLED.addLeds<NEOPIXEL, 5>(leds[0], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 4>(leds[1], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 0>(leds[2], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 12>(leds[3], NUM_LEDS_PER_STRIP);
  FastLED.addLeds<NEOPIXEL, 15>(leds[4], NUM_LEDS_PER_STRIP);

  // Helligkeit setzen mit BRIGHTNESS (siehe oben)
  FastLED.setBrightness(  BRIGHTNESS );

  // Startwerte der Variablen setzen
  counter = 1;
  ledColor[0] = 0;
  ledColor[1] = 0;
  ledColor[2] = 0;
  udpValues[0] = 5;
  ledDelay = 1;
  ledMode = 5;

  artnet.begin();

}

void loop() {

  // UDP Packet lesen
  udpRead();

  // ArtNet-Daten lesen
  if (artnet.read() == ART_DMX) {
        Serial.printf("ArtNet gelesen");
  }

  // Verbindung prüfen und falls notwendig neu verbinden
  if (!WiFi.isConnected()){
    WiFi.reconnect();
    Serial.print("reconnecting!  ");
    while(WiFi.status() != WL_CONNECTED){
      delay(500);
      Serial.print(".");
    }
  }

  //Debugging: sehen, ob die Farben richtig dargestellt werden
  Serial.printf ("ledColor: %i, %i, %i\n", ledColor[0], ledColor[1], ledColor[2]);
  Serial.printf("|");
  Serial.printf ("udpValues: %i, %i, %i, %i\n", udpValues[0], udpValues[1], udpValues[2], udpValues[3]);
  Serial.printf("|");

  // Ausführen des gesendeten Modus
  switch (udpValues[0]) {
    case 0: // LEDs ausschalten

      // Sicherheitsrestart
      if (ledMode == 3 || ledMode == 2 || ledMode == 1){
        ESP.restart();
      }

      // Modusindikator setzen
      ledMode = 0;
      // Alle LEDs auf schwarz setzen
      modeAllOff();
      // Ist pausiert?
      isPaused = false;

      break;
    case 1: // Netzwerktraffic-Darstellung

      // Sicherheitsrestart
      if (ledMode == 3 || ledMode == 2 || ledMode == 0){
        ESP.restart();
      }

      // Alle LED zu Anfang schwarz färben
      if (ledMode != 1) {
        modeAllOff();
      }

      // Modusindikator setzen
      ledMode = 1;
      // LEDs Farbwerte zuweisen
      modeNetworkTraffic();
      // Ist pausiert?
      isPaused = false;
      // Aktualisierungsgeschwindigkeit
      delay(1500 / ledDelay);

      break;
    case 2: // Lässt alle LEDs in einer Farbe leuchten

      Serial.printf("Static Light ON \n");

      // Sicherheitsrestart
      if (ledMode == 3 || ledMode == 1 || ledMode == 0){
       ESP.restart();
      }

      // Modusindikator setzen
      ledMode = 2;
      //delay(500);
      // Allen LEDs gleiche Farbe zuweisen
      modeAllOneColor(udpValues[1], udpValues[2], udpValues[3]);
      // Ist pausiert?
      isPaused = false;

      break;
    case 3: // ArtNet-Darstellung

    Serial.printf("ArtNet Modus --------");

      // Sicherheitsrestart
      if (ledMode == 2 || ledMode == 1 || ledMode == 0) {
        ESP.restart();
      }

      // Modusindikator setzen
      ledMode = 3;

        length = artnet.getLength() <= NUM_LEDS_PER_STRIP * 3 ? artnet.getLength() : NUM_LEDS_PER_STRIP * 3;

        memcpy(leds[artnet.getUniverse()], artnet.getDmxFrame(), length);


      break;
    case 4: // Pause
      isPaused = true;
      break;
    default:
      modeAllOneColor(255, 0, 0);
      break;
  }
  Serial.print("\nFree Heap:\n");
  Serial.println(ESP.getFreeHeap(), DEC);

  // zeige an
  if (!isPaused)
    FastLED.show();
}



/**
   Liest ein neues UDP Paket und speichert dessen Inhalt in udpValues[].
*/
void udpRead() {

  // UDP Paket auslesen und in einzelne ints umwandeln
  packetSize = Udp.parsePacket();
  Serial.printf("PacketSize: ", packetSize);
  if (packetSize)
  {
    // Erhalte einkommendes UDP Paket

    Serial.printf("Received %d bytes from %s, port %d\n", packetSize, Udp.remoteIP().toString().c_str(), Udp.remotePort());

    // Länge des UDP-Paketes
    int len = Udp.read(incomingPacket, 512);

    // Ende des Paketes im Buffer mit 0 markieren
    if (len > 0)
    {
      incomingPacket[len] = 0;
    }

    Serial.printf("UDP packet contents: %s\n", incomingPacket);

    // Speichert den Inhalt des UDP Packetes ohne die Kommata
    char *pt;
    pt = strtok (incomingPacket, " ,");
    int i = 0;
    while (pt != NULL) {
      udpValues[i] = atoi(pt);
      //Serial.printf ("%s\n",pt);
      pt = strtok (NULL, " ,");
      i++;
    }
  }
}

/**
 * Verbindet sich mit dem Oben angegebenen Netzwerk
 */
void connectWifi() {

  // Information, mit welchem Netzwerk der Mikrocontroller sich verbinden moechte
  Serial.printf("Connecting to %s ", ssid);

  // Netzwerkverbindung herstellen
  WiFi.begin(ssid, password);
  //Netzwerkkonfiguration fuer den Microkontroller
  WiFi.config(staticIP, gateway, subnet);

  // Prüfung und Ausgabe des Wlan-Status
  // Solange alle 0,5s '.' machen bis Wlanverbindung hergestellt wurde.
  // Wenn Wlanverbindung aufgebaut wurde, mit connected mitteilen.
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected");

  // Start des UDP Protokolls
  Udp.begin(localUdpPort);
  // Ausgabe, welche IP der Mikrokontroller hat und welchen Port er abhört
  Serial.printf("Now listening at IP %s, UDP port %d\n", WiFi.localIP().toString().c_str(), localUdpPort);

}


/**
   Visualisiert die Netzwerkauslastung und zeigt sie auf den LEDs an.
   In regelmäßigen Intervallen laufen Streifen aus leuchtenden LEDs über den/die LED-Stripes,
   deren Menge an zusammenhängend leuchtenden LEDs von der Paketgröße abhängt.
   Die Geschwindigkeit, mit welcher die leuchtenden Streifen den/die LED-Stripes traversieren, variiert je nach Paketmenge.
   Die Farbe ist abhängig von der Gesamtnetzwerkauslastung.
*/
void modeNetworkTraffic() {

  // Menge der leuchtenden LEDs, die einen Streifen ergeben
  packetLength = udpValues[3] / 20;
  // Länge mindestens 1
  if (packetLength == 0) packetLength = 1;

  // Setzen der LEDs abhängig von der Paketlänge
  if (counter <= packetLength) {
    //Farbe
    ledColor[0] =  sinTab[udpValues[1]];
    ledColor[1] =  cosTab[udpValues[1]];
    ledColor[2] =  0;
    Serial.printf("farbe\n");
  } else {
    //Schwarz
    ledColor[0] = 0;
    ledColor[1] = 0;
    ledColor[2] = 0;
    Serial.printf("black\n");
  }

  if (counter == 7) {
    counter = 1;
  } else {
    counter++;
  }

  // Neu gesetzte LED setzen und LED-Streifen aktualisieren
  contrLED(ledColor[0], ledColor[1], ledColor[2]);

  // Aktualisierungsdelay setzen
  ledDelay = (udpValues[2] / 15);
  if (ledDelay == 0) ledDelay = 1;
}

/**
   Aktualisiert den LED Streifen so, dass die Werte jeder LED
   auf die nächste übertragen werden und setzt den Farbwert der ersten LED
   auf die durch die Parameter übergebenen Farbe.

   @param ir Rotwert der ersten LED
   @param ig Grünwert der ersten LED
   @param ib Blauwert der ersten LED
*/
void contrLED(uint8_t ir, uint8_t ig, uint8_t ib) {

  for (int strip = 0; strip < NUM_LED_STRIPS; strip++) {

    // Vorherige LED
    CRGB lastLED = CRGB(ir, ig, ib);
    // Temporäre Variable
    CRGB temp;

    // Überträgt die Farbwerte einer LED auf ihren Nachfolger
    // für jede LED des Streifens.
    for (int dot = 0; dot < NUM_LEDS_PER_STRIP; dot++) {
      temp = lastLED;
      lastLED = leds[strip][dot];
      leds[strip][dot] = temp;
    }
  }
}


/**
   Färbt alle LEDs abhängig von der übergebenen Farbe.
   @param ir Rotwert
   @param ig Grünwert
   @param ib Blauwert
*/
void modeAllOneColor(uint8_t ir, uint8_t ig, uint8_t ib) {
  for (int strip = 0; strip < NUM_LED_STRIPS; strip++) {
    for (int dot = 0; dot < NUM_LEDS_PER_STRIP; dot++) {
      leds[strip][dot] = CRGB(ir, ig, ib);
    }
  }
}


/**
   Schaltet alle LEDs aus.
*/
void modeAllOff() {
  for (int strip = 0; strip < NUM_LED_STRIPS; strip++) {
    for (int dot = 0; dot < NUM_LEDS_PER_STRIP; dot++) {
      leds[strip][dot] = CRGB::Black;
    }
  }
}
