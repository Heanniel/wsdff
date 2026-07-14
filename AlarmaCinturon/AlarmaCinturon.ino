/*
  =====================================================================
  PROTOTIPO #2: ALARMA DE CINTURON DE SEGURIDAD OBLIGATORIO
  (Segun "Catalogo de Prototipos Automotrices" - pagina 2)
  ---------------------------------------------------------------------
  ARQUITECTURA HIBRIDA:
    - La DECISION de seguridad se resuelve por HARDWARE (compuertas
      logicas 74HC04 y 74HC08), no por software. Esto garantiza
      inmediatez y blindaje ante fallos del programa.
    - El ARDUINO solo LEE el resultado final (una unica senal) y se
      encarga de la INTERFAZ: parpadeo del testigo del tablero y
      tono pulsante intermitente del buzzer.

  LOGICA CABLEADA (fuera del Arduino):
     Cinturon (pulsador) --> [74HC04 NOT] --> "Cinturon suelto" (1 si esta suelto)
     Peso (pulsador) ----+
     Marcha (interruptor)+--> [74HC08 AND] --+
     Cinturon suelto ----------------------- +--> SALIDA DE ALARMA --> Arduino

     Truco: el 74HC08 solo tiene AND de 2 entradas, asi que se
     encadenan DOS compuertas para lograr un AND de 3 entradas:
        G1 = Peso   AND Marcha
        G2 = G1     AND CinturonSuelto   -> esta es la senal que lee el Arduino

     La alarma se dispara SOLO si:  hay peso  Y  el auto esta en marcha
     Y  el cinturon esta suelto.

  MATERIALES (del PDF):
     - Arduino Uno R3
     - CI 74HC08 (AND)   - CI 74HC04 (NOT)
     - 2 Pulsadores (peso y cinturon) + 1 Interruptor (marcha)
     - Buzzer ACTIVO de 5V
     - LED rojo de tablero
     - Resistencias de 330 ohm (LED) y 10k ohm (pull-down)
     - Protoboard y puentes

  NOTA SOBRE EL BUZZER:
     Es un buzzer ACTIVO: genera su propio tono al recibir 5V.
     Por eso se controla con digitalWrite() (HIGH/LOW), NO con tone().
  =====================================================================
*/

// ------------------- PINES -------------------
// Unica entrada digital: la SALIDA de la compuerta AND (74HC08).
// Con pull-down externo de 10k: senal activa = HIGH.
const uint8_t PIN_SENAL_ALARMA = 2;   // Viene de la compuerta AND final

// Salidas gestionadas por el Arduino (la interfaz de usuario)
const uint8_t PIN_LED_TABLERO  = 12;  // Testigo rojo del tablero
const uint8_t PIN_BUZZER       = 8;   // Buzzer ACTIVO de 5V

// ------------------- PARAMETROS AJUSTABLES -------------------
const unsigned long PULSO_ON_MS  = 250;  // Tiempo de tono/led ENCENDIDO
const unsigned long PULSO_OFF_MS = 250;  // Tiempo de tono/led APAGADO

// ------------------- ESTADO INTERNO -------------------
bool pulsoEncendido = false;      // Estado actual del parpadeo/tono
unsigned long tUltimoCambio = 0;  // Marca de tiempo del ultimo cambio

// ------------------- SETUP -------------------
void setup() {
  // La senal viene de una compuerta 74HC (salida en push-pull) con
  // pull-down externo de 10k, por eso es una entrada normal.
  pinMode(PIN_SENAL_ALARMA, INPUT);

  pinMode(PIN_LED_TABLERO, OUTPUT);
  pinMode(PIN_BUZZER, OUTPUT);

  digitalWrite(PIN_LED_TABLERO, LOW);
  digitalWrite(PIN_BUZZER, LOW);

  Serial.begin(9600);
  Serial.println(F("== Alarma de cinturon (prototipo #2) lista =="));
}

// Enciende o apaga a la vez el testigo y el buzzer activo.
void aplicarPulso(bool encender) {
  digitalWrite(PIN_LED_TABLERO, encender ? HIGH : LOW);
  digitalWrite(PIN_BUZZER,      encender ? HIGH : LOW);
}

// ------------------- LOOP PRINCIPAL -------------------
void loop() {
  // La compuerta AND ya hizo toda la logica de seguridad.
  // Aqui solo leemos su resultado.
  bool condicionAlarma = (digitalRead(PIN_SENAL_ALARMA) == HIGH);

  if (condicionAlarma) {
    // Rutina de parpadeo + tono pulsante intermitente (sin delay()).
    unsigned long intervalo = pulsoEncendido ? PULSO_ON_MS : PULSO_OFF_MS;
    if (millis() - tUltimoCambio >= intervalo) {
      pulsoEncendido = !pulsoEncendido;
      tUltimoCambio = millis();
      aplicarPulso(pulsoEncendido);
    }
  } else {
    // Condicion despejada: cinturon abrochado, sin peso o sin marcha.
    // Apagamos todo de inmediato.
    if (pulsoEncendido) {
      pulsoEncendido = false;
      aplicarPulso(false);
      Serial.println(F("Condicion despejada: alarma apagada."));
    }
  }
}
