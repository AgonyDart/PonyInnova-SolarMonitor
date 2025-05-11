#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

const char *ssid = "Totalplay-66A2";
const char *password = "secure123";

WebServer server(80);

float simulatedAmps[3] = {0.0, 0.0, 0.0};
bool increasing[3] = {true, true, true};

void enableCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
}

void handleData() {
  enableCORS();  

  for (int i = 0; i < 3; i++) {
    if (increasing[i]) {
      simulatedAmps[i] += 0.1 * (i+1);  
      if (simulatedAmps[i] >= 3.3 * (i+1)) increasing[i] = false;
    } else {
      simulatedAmps[i] -= 0.1 * (i+1);
      if (simulatedAmps[i] <= 0.0) increasing[i] = true;
    }
  }

  StaticJsonDocument<256> doc; 
  JsonArray solarPanels = doc.createNestedArray("solar_panels");
  
  for (int i = 0; i < 3; i++) {
    JsonObject panel = solarPanels.createNestedObject();
    panel["id"] = i;  
    panel["amp"] = simulatedAmps[i];
  }

  String json;
  serializeJson(doc, json);
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Serial.print("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500); Serial.print(".");
  }
  Serial.println("\nConectado a WiFi");
  Serial.println(WiFi.localIP());

  server.on("/data", handleData);
  server.onNotFound([]() {
    enableCORS();
    server.send(404, "text/plain", "Endpoint no encontrado");
  });
  
  server.begin();
}

void loop() {
  server.handleClient();
}