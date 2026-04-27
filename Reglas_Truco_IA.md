# Reglas del Truco Argentino - Guía para Agentes de IA

## Tabla de Contenidos
1. [Información General](#información-general)
2. [Configuración Inicial](#configuración-inicial)
3. [Estructura del Juego](#estructura-del-juego)
4. [Envido](#envido)
5. [Flor](#flor)
6. [Truco](#truco)
7. [Valores de Cartas](#valores-de-cartas)
8. [Irse al Mazo](#irse-al-mazo)
9. [Puntuación](#puntuación)
10. [Términos y Glosario](#términos-y-glosario)

---

## Información General

### Objetivo Principal
Alcanzar 30 puntos antes que el equipo rival para ganar la partida.

### Baraja
- Se utiliza la baraja española de 40 cartas
- Se excluyen: 8s, 9s y comodines
- Solo se usan cartas del 1 al 7 y figuras (10, 11, 12)

### Divisiones de la Partida
- **Las Malas**: Primeros 15 puntos
- **Las Buenas**: Últimos 15 puntos
- Posibilidad de jugar solo "Las Malas" (15 puntos)

---

## Configuración Inicial

### Modalidades de Juego
1. **Mano a Mano**: 2 jugadores
2. **Equipos de 2 contra 2**: 4 jugadores
3. **Equipos de 3 contra 3**: 6 jugadores

### Determinación del Repartidor Inicial
1. Cada jugador extrae una carta al azar del mazo
2. Quien saca la carta de mayor valor reparte primero
3. El repartidor baraja las cartas
4. El jugador a su izquierda realiza el "corte"
5. Se reparten 3 cartas a cada jugador comenzando por el jugador a la derecha del repartidor

### Posiciones Importantes
- **Mano**: Jugador a la derecha del repartidor (primer jugador en jugar)
- **Pie**: Último jugador del equipo en jugar
- **Pie Total**: El repartidor

---

## Estructura del Juego

### Desarrollo de una Mano
1. Se reparten 3 cartas a cada jugador
2. Se juegan 3 rondas
3. El equipo que gana 2 de 3 rondas gana la mano
4. Se anotan los puntos obtenidos
5. El siguiente repartidor es el jugador a la derecha del repartidor anterior

### Componentes de una Mano
El juego se divide en dos fases:
1. **Envido**: Fase de apuesta sobre puntos de cartas del mismo palo
2. **Truco**: Fase de juego de cartas (valor para ganar rondas)

### Orden de Juego en Rondas
- **Primera Ronda**: Comienza la "mano" (jugador a derecha del repartidor)
- **Segunda Ronda**: Comienza quien ganó la primera ronda
- **Tercera Ronda**: Comienza quien ganó la segunda ronda

---

## Envido

### Concepto
Suma de puntos de cartas del mismo palo. Es la primera parte del juego, solo se juega en la primera ronda.

### Cálculo de Puntos del Envido
- Cartas numéricas: Valor igual al número (3 de copas = 3 puntos)
- Figuras (10, 11, 12): Valen 0 puntos
- Dos cartas del mismo palo: Suma de ambas + 20 puntos
- Rango válido: 0 a 33 puntos

### Ejemplos de Envido
- 3 de copas + 5 de copas = 8 + 20 = 28 puntos
- 2 de bastos + 4 de bastos = 6 + 20 = 26 puntos
- 1 de oros + 1 de copas = 1 + 1 = 2 puntos (distinto palo, sin bonificación)
- Figura + 5 de spades = 0 + 5 = 5 puntos

### Tres Cartas del Mismo Palo
Si un jugador tiene 3 cartas del mismo palo, se suman las dos de mayor valor para el Envido.

### Momentos para Cantar Envido
- Solo en la primera ronda
- Antes de jugar la primera carta (excepto el repartidor que ya jugó)
- Una vez que alguien canta "Truco" o el repartidor juega su primera carta, no se puede jugar Envido
- Se puede cantar envido si alguien canta "Truco" en la primera ronda si al que le han cantado todavia no jugo su carta. Se resuelve el envido y luego se acepta o no el truco. Si se acepta el truco se sigue jugando.

### Restricción absoluta de Envido frente al Truco

El Envido solo puede cantarse en primera ronda. El canto de Truco por sí solo no lo bloquea de inmediato: el bloqueo comienza cuando Truco queda aceptado.

- Si **Truco fue cantado pero aún no aceptado**, se permite cantar Envido en primera ronda bajo las condiciones normales.
- Si **Truco ya fue aceptado**, queda bloqueado el Envido para esa mano.
- **Retruco** y **Vale Cuatro** son estados posteriores a Truco aceptado; por lo tanto, también mantienen Envido bloqueado.
- Se permite la respuesta inmediata de Envido en primera ronda cuando se canta Truco por primera vez y aún no se jugó carta del que responde. Se resuelve primero Envido y luego se responde Quiero/No Quiero al Truco.

Una vez escalado a Retruco o Vale Cuatro, el Envido queda definitivamente cerrado para esa mano.

### Opciones de Respuesta al Envido
Cuando se canta Envido, el equipo contrario puede:
1. **Quiero**: Aceptar la apuesta y continuar
2. **No Quiero**: Rechazar y el equipo que cantó suma 1 punto
3. **Subir la Apuesta**: Cantar "Envido", "Real Envido" o "Falta Envido"

### Valores de Apuestas del Envido
- **Envido**: Vale 2 puntos (si se gana)
- **Real Envido**: Vale 3 puntos (si se gana)
- **No querido (cualquier tipo)**: El que cantó suma 1 punto

### Falta Envido
- Se juega por los puntos que le faltan al equipo ganador para llegar a 30
- Si gana el equipo ganador: Gana la partida
- Si gana el equipo perdedor: Suma tantos puntos como le faltaban al otro equipo para llegar a 30

### Cantando Tantos del Envido
Una vez querido el Envido:
1. El jugador "mano" canta primero cuántos tantos tiene
2. Si un jugador no puede superar el puntaje cantado, puede decir "Son Buenas" (sin revelar su puntuación)
3. Gana quien tenga más puntos
4. El ganador debe mostrar sus cartas después de jugarse el Truco para validar los puntos
5. Si el ganador no muestra cartas: Pierde puntos de Envido y Truco

### Puntajes Válidos para Cantar Envido
- Rango válido: 0-7 y 20-33
- Otros valores no son válidos para el canto

### Reglas de Penalización en Envido
- Si cantaste mal el puntaje durante el juego: Tu equipo pierde Envido + Truco
- Si dejas las cartas en el mazo sin mostrar: Pierdes derechos a los puntos
- Solo el ganador del Envido está obligado a mostrar cartas
- Cualquier jugador del equipo contrario puede responder al canto del Envido

---

## Flor

### Concepto
Cuando un jugador tiene las 3 cartas del mismo palo.

### Requisitos para Jugar con Flor
Se debe establecer antes de iniciar la partida si se juega CON o SIN Flor.

### Canto de Flor
- Debe cantarse en la primera parte del juego, antes de jugar la primera carta
- Si alguien canta "Flor", ya no se juega Envido
- Solo el jugador que tiene la flor puede cantarla (no sus compañeros)

### Puntos por Flor
- Se anotan directamente 3 puntos si el equipo contrario no tiene flor
- No requiere ser "querida" si el contrario no tiene flor
- El jugador debe mostrar sus cartas después del Truco para validar

### Flor Contra Flor
Si el equipo contrario también tiene flor, se puede subir la apuesta:
1. **Flor**: 3 puntos base (si el contrario no tiene flor)
2. **Contra Flor**: Sube la apuesta (el otro equipo responde)
3. **Contra Flor Al Resto**: Sube aún más (se juega por puntos que faltan para llegar a 30)

### Cantando Puntos de Flor
Cuando ambos equipos tienen flor y es aceptada:
1. Se canta cuántos puntos tiene cada uno
2. Comienza el jugador "mano"
3. Se calcula igual que Envido (suma de dos cartas de mayor valor + 20 si tienen mismo palo)

---

## Truco

### Concepto
Segunda parte del juego donde se comparan las cartas jugadas en cada ronda. El objetivo es ganar 2 de 3 rondas.

### Ganador de una Ronda
La carta de mayor valor gana la ronda.

### Orden de Valores en Truco
De mayor a menor: As de Espadas > As de Bastos > 7 de espadas > 7 de oro > 3 > 2 > 1 > 12 > 11 > 10 > 7 de copas y 7 de bastos > 6 > 5 > 4

### Estructura del Truco
- 3 rondas en total
- Necesario ganar 2 de 3 para ganar el Truco
- Si gana el Truco sin apuestas: 1 punto

### Desarrollo de las Rondas
**Primera Ronda:**
- Comienza la "mano" (jugador a derecha del repartidor)
- Los jugadores a su derecha juegan en orden
- El repartidor juega último
- Gana quien tire la carta de mayor valor

**Segunda Ronda:**
- Comienza quien ganó la primera ronda
- Si hay empate (parda): Vuelve a empezar la "mano"
- Gana quien tire la carta de mayor valor

**Tercera Ronda:**
- Comienza quien ganó la segunda ronda
- Si hay empate (parda): Gana la "mano"

### Empate (Parda)
Cuando dos cartas de igual valor ganan en la ronda:
- Primera parda: La segunda ronda decide
- Segunda parda: La tercera ronda decide
- Tercera parda: Gana la "mano" (equipo del jugador a derecha del repartidor)

### Cantando Truco
- Se puede cantar en cualquier momento del juego
- Cualquier jugador puede cantarlo sin necesidad de orden
- La persona que canta un estado de truco no puede cantar la siguiente inmediata.
- Combinaciones: Si jugador A canta truco y jugador B acepta, Jugador A no puede cantar re truco, Jugador B tiene "permitido" retrucar durante esa ronda. Si jugador B decide cantar retruco y jugador A acepta, jugador A pasa a tener "permitido" cantar el estado siguiente -> Vale cuatro.
- Los estados en orden son Truco -> Retruco -> Vale cuatro.

### Respuestas al Truco
Cuando se canta "Truco", el equipo contrario puede:
1. **Quiero**: Aceptar la apuesta de 2 puntos (en lugar de 1)
2. **No Quiero**: Rechazar, se va al mazo, pierde la mano
3. **Retruco**: Subir la apuesta a 3 puntos (requiere decir "Quiero" primero)

### Cadena de Apuestas en Truco
Secuencia obligatoria: Truco → Retruco → Vale Cuatro

- **Truco**: 2 puntos en disputa
- **Retruco**: 3 puntos en disputa
- **Vale Cuatro**: 4 puntos en disputa

### Reglas de Respuesta en Truco
- Siempre se responde con "Quiero"
- Solo quien "quiso" la última apuesta puede retrucar
- El equipo que cantó una apuesta NO puede subir hasta que el contrario suba

### Concepto de "Tener el Quiero"
- Cuando un equipo "quiere" una apuesta, tiene derecho a retrucar
- El equipo que cantó NO puede subir más hasta que el contrario lo haga

### Carta Jugada
Una carta se considera "jugada" cuando:
- El jugador la suelta completamente en la mesa boca arriba
- Si se juega fuera de turno
- Si se tira más de una carta (se consideran en orden de depósito)

**Nota**: Si el jugador sostiene la carta agarrada, puede cambiarla o hacer un canto.

### Reglas sobre Cartas
- Las cartas se dejan boca arriba en la mesa
- No se pueden recoger hasta terminar la mano
- Una carta jugada no puede cambiarse

---

### Valor en Truco (para ganar rondas)
```
As de Espadas (Macho)     - Valor máximo
As de Bastos (Hembra)
7 de espadas
7 de oro
3 todos
2 todos
1 todos
12 todos
11 todos
10 todos
7 basto y copa
6 todos
5 todos
4 todos- Valor mínimo
```

### Valor en Envido
- Número de la carta = Su valor (1 = 1 punto, 5 = 5 puntos)
- Figuras (10, 11, 12) = 0 puntos
- Dos cartas mismo palo = suma + 20 puntos

---

## Repartición

### Proceso de Reparto
1. El repartidor baraja las cartas adecuadamente
2. Ofrece al jugador a su izquierda para que "corte"
3. El corte debe separar en 2 montones con mínimo 3 cartas cada uno
4. Realiza el corte y comienza a repartir desde arriba
5. Reparte una carta a cada jugador hacia su derecha
6. Completa 3 vueltas (3 cartas por jugador)
---

## Irse al Mazo

### Concepto
Abandonar la mano sin permitir que nadie vea las cartas.

### Momento para Irse al Mazo
- En cualquier momento del juego
- En cualquiera de las 3 rondas

### Efectos de Irse al Mazo
- El jugador abandona la mano (sus acciones no tienen validez)
- Su equipo puede continuar jugando
- Las cartas no pueden recuperarse

### Penalización Colectiva
Si TODOS los jugadores de un equipo se van al mazo:
- El equipo pierde todos los puntos restantes de la mano
- Si es antes del Envido: -1 Envido, -1 Truco
- Si es después del Envido: -1 Truco

### Regla Especial de Envido
Si un jugador se fue al mazo habiendo ganado el Envido sin mostrar cartas:
- Pierde los puntos del Envido

---

## Puntuación

### Sistema de Anotación
Los puntos se anotan en papel formando cuadrados con una línea diagonal:
- Cada cuadrado representa 5 puntos
- Cada recta del cuadrado = 1 punto

### Momento de Anotación
Los puntos se anotan al terminar cada mano.

### Jugador Anotador
Siempre el mismo jugador anota durante toda la partida.

### División Malas/Buenas
- Al completar 15 puntos (3 cuadrados), se traza una línea horizontal
- Esta línea separa "Las Malas" de "Las Buenas"

### Puntos por Resultado
- **Truco sin apuestas**: 1 punto
- **Truco aceptado**: 2 puntos
- **Retruco**: 3 puntos
- **Vale Cuatro**: 4 puntos
- **Envido**: 2 puntos
- **Real Envido**: 3 puntos
- **Envido no querido**: 1 punto
- **Flor**: 3 puntos (si gana)

---

## Términos y Glosario

### Términos de Cartas
- **Macho**: As de Espadas (carta más valiosa en Truco)
- **Hembra**: As de Bastos
- **Ancho Falso**: As de Oros o As de Copas
- **Siete Bravo**: Siete de Espadas
- **Siete Falso**: Siete de Bastos o Siete de Copas
- **Figura o Negra**: Cartas 10, 11, 12 de cualquier palo

### Términos de Juego
- **Mano**: Primer jugador a la derecha del repartidor
- **Pie**: Último jugador de cada equipo
- **Pie Total**: El repartidor
- **Matar**: Jugar una carta de mayor valor que otra en el Truco
- **Parda**: Empate en una ronda (dos cartas de igual valor)
- **Pasar**: No cantar el tanto del Envido, dejando la responsabilidad a compañeros
- **Ir al Pie**: Jugar una carta de bajo valor esperando que el pie del equipo gane
- **Poner**: Jugar una carta de mucho valor (la mejor del equipo en esa ronda)
- **Irse al Mazo**: Apoyar las cartas en el mazo, abandonando la ronda

### Términos de Puntuación
- **Malas**: Los primeros 15 puntos
- **Buenas**: Los últimos 15 puntos
- **Tantos**: Puntos para el Envido
- **Viejas**: Cuando se tienen 27 puntos para el Envido
- **Flor**: Tres cartas del mismo palo

### Términos de Apuestas
- **Quiero**: Aceptar una apuesta
- **No Quiero**: Rechazar una apuesta (se va al mazo)
- **Retruco**: Subir una apuesta de Truco
- **Vale Cuatro**: Máxima apuesta en el Truco
- **Son Buenas**: No declarar puntaje del Envido para no revelar información

---

## Resumen de Flujo de Juego

### Inicio de Partida
1. Se baraja y se decide quién reparte
2. Se cortan las cartas
3. Se reparten 3 cartas a cada jugador

### Fase de Envido (Primera Ronda)
1. Antes de jugar cartas, se puede cantar Envido
2. El equipo contrario responde: Quiero, No Quiero, o sube apuesta
3. El ganador del Envido debe mostrar cartas después del Truco

### Fase de Truco (3 Rondas)
1. Ronda 1: Comienza la "mano", gana quien tenga carta más alta
2. Ronda 2: Comienza ganador de Ronda 1
3. Ronda 3: Comienza ganador de Ronda 2
4. Se puede cantar "Truco" en cualquier momento
5. Respuestas: Quiero, No Quiero, Retruco

### Fin de Mano
1. Se anotan los puntos
2. El siguiente repartidor es quien está a la derecha del anterior
3. Se repite hasta alcanzar 30 puntos

### Fin de Partida
Primer equipo en alcanzar 30 puntos gana la partida.

---

## Notas Importantes para Agentes de IA

- **Prioridad de Reglas**: Las reglas oficiales reglamentarias prevalecen siempre
- **Validez de Órdenes**: Las palabras específicas tienen validez legal ("Quiero" vs "dale")
- **Estados Críticos**: El estado del juego cambia significativamente con cada canto
- **Penalizaciones**: Son muy estrictas para proteger la integridad del juego
- **Ambigüedad**: Se resuelve siempre a favor de la interpretación más conservadora de las reglas
