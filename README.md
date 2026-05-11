# El secreto de la lagartija

Juego web de acertijos numéricos inspirado visualmente en el antiguo Egipto.

El jugador debe resolver un acertijo por nivel usando un teclado numérico. Los niveles superados se guardan en `localStorage`, por lo que se puede continuar la partida más tarde desde el mismo navegador. Al completar el último nivel se muestra una pantalla de premio.

## Funcionalidades

- Juego en HTML, JavaScript y Tailwind CSS.
- Interfaz responsive con estética egipcia.
- Acertijos cargados desde `public/riddles.json`.
- Respuestas siempre numéricas.
- Teclado numérico en pantalla y soporte de teclado físico.
- Progreso persistente con `localStorage`.
- Pantalla final de premio configurable desde JSON.
- Preparado para compilar y desplegar en GitHub Pages.

## Editar niveles

Los acertijos están en `public/riddles.json`:

```json
{
  "id": "camara-1",
  "title": "La puerta de piedra",
  "question": "Tengo 3 monedas y encuentro 4 más. ¿Cuántas monedas tengo ahora?",
  "answer": 7
}
```

Para añadir un nivel nuevo, añade otro objeto dentro de `levels`. La respuesta debe ser numérica.

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

El resultado se genera en `dist/`.

## Vista previa del build

```bash
npm run preview
```

## Estructura principal

```txt
public/
└── riddles.json
src/
├── css/
│   └── main.css
└── js/
    └── app.js
index.html
vite.config.js
```

## Licencia

MIT
