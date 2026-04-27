# Plan de Ejecución Sugerido

Este plan está organizado en fases para implementar la SPA de Truco completo (Truco + Envido + Flor), usando la API local y persistencia diferenciada.

## Fase 1: Base técnica y utilidades
- Definir constantes de API, claves de storage y estructura de estado global en scripts/index.js
- Implementar utilidades para fetch de cartas, helpers de guardado/carga y mezcla de mazo
- Inicializar estado desde storage

## Fase 2: Modelo de dominio
- Modelar carta, jugador, ronda y mano para soportar Truco, Envido y Flor
- Implementar jerarquía real de cartas y cálculo de puntajes
- Definir eventos de partida (jugada, canto, resultado)

## Fase 3: Motor de juego
- Iniciar partida nueva, mezclar y repartir
- Implementar flujo de rondas y manos, resolución de bazas y cierre de mano
- Gestionar cantos válidos (Truco, Retruco, Vale Cuatro, Envido, Flor)
- Calcular ganador y resultado final

## Fase 4: IA y delays
- Definir estrategia simple de IA para jugadas y cantos
- Agregar delays para simular pensamiento de la máquina
- Bloquear input de usuario durante turno de máquina

## Fase 5: UI SPA y navegación
- Usar #app como punto de montaje único
- Renderizar vistas (inicio, listado, detalle de partida) según estado
- Mostrar partidas en curso y finalizadas; en finalizadas, solo resultado

## Fase 6: Persistencia y recuperación
- Guardar partida activa en sessionStorage y finalizadas en localStorage
- Rehidratar estado al recargar

## Fase 7: Robustez y UX
- Manejar errores de API y validaciones de acciones
- Mensajes claros de turno, cantos y resultados

## Fase 8: Verificación integral
- Probar flujo completo, persistencia y consumo correcto de cartas/imágenes
- Validar recuperación de partida activa y registro de historial

**Sugerencia:** Avanzar por fases, validando cada una antes de pasar a la siguiente. Consultar este plan como checklist durante el desarrollo.
[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/5lO7KglA)
# Ejercicio Frontend

## Descripcion

Este proyecto es la base de trabajo para un ejercicio practico de HTML, Tailwind CSS y JavaScript.

La aplicacion debe consumir datos desde una API local construida con `json-server` y persistir informacion usando `localStorage` y `sessionStorage`.

## Archivos base

- `index.html`
- `styles/index.css`
- `scripts/index.js`
- `db.json`
- `assets/cards/individual/`

## API local

Instalar dependencias:

```bash
npm install
```

Levantar el servidor:

```bash
npm run api
```

URL base:

```text
http://localhost:3000
```

Endpoint del mazo:

```text
http://localhost:3000/cards
```

Cada carta incluye:

- `id`
- `value`
- `suit`
- `image`

Valores posibles de `suit`:

- `ORO`
- `COPA`
- `ESPADA`
- `BASTO`

Ejemplo de consumo con `fetch`:

```js
async function obtenerCartas() {
  const respuesta = await fetch("http://localhost:3000/cards")
  const cartas = await respuesta.json()

  return cartas
}
```

## Consigna general

Desarrollar una aplicacion web del juego con el siguiente flujo general:

1. Una pantalla de presentacion con un boton para jugar.
2. Un listado de partidas en curso y partidas finalizadas.
3. Un boton para crear una nueva partida.
4. En las partidas finalizadas, mostrar unicamente el resultado.
5. Dentro de una partida, permitir jugar contra la maquina.
6. Simular el pensamiento de la maquina mediante delays.
7. Guardar y recuperar el estado de la aplicacion usando `localStorage` y `sessionStorage`.

## Consideraciones

- Consumir el mazo desde la API local.
- Resolver la interfaz con HTML y Tailwind CSS.
- Implementar la logica con JavaScript puro.
- Trabajar con el mazo de Truco de 40 cartas.
- Mantener el codigo ordenado y legible.

## Criterios generales de evaluacion

- Uso correcto de HTML, Tailwind CSS y JavaScript.
- Correcta utilizacion de `fetch` con `async` y `await`.
- Persistencia adecuada del estado.
- Resolucion funcional del flujo pedido.
- Claridad en la organizacion del codigo.
