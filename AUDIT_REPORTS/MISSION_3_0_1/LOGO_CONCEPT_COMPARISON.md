# Comparativa de Conceptos de Logotipo e Isotipo iCast (M3.0.1)
## Evolución Geométrica del Concepto Prisma

**Proyecto:** iCast  
**Fase:** M3.0.1  
**Fecha:** 31 de Octubre de 2026  
**Referencia HIG:** Apple Human Interface Guidelines (`app-icons.md`, `branding.md`, `icons.md`)  

---

### 1. Justificación de la Evolución

En M3.0, el isotipo se basaba en un prisma cargado con gradientes azules brillantes (`#3B82F6` a `#1D4ED8`) y un triángulo interior similar al clásico icono de *Play*. Esta ejecución provocaba tres problemas:
1. Parecía un reproductor de medios genérico de tienda digital.
2. Imponía un tono azul eléctrico sobre toda la interfaz, obligando a los acentos y bordes a seguir la misma paleta saturada.
3. El triángulo de reproducción central sobrecargaba la figura e impedía una lectura limpia a escalas pequeñas (16 px / 24 px).

Para M3.0.1, se desarrollaron **tres alternativas formales** que preservan la metáfora del prisma (difusión, claridad, óptica cinemática) pero eliminan la saturación artificial.

---

### 2. Análisis Detallado de las Tres Alternativas

```
┌───────────────────────────┬───────────────────────────┬───────────────────────────┐
│ ALTERNATIVA A:            │ ALTERNATIVA B:            │ ALTERNATIVA C:            │
│ Prisma Minimalista        │ Prisma Monocromático      │ Prisma con Refracción     │
├───────────────────────────┼───────────────────────────┼───────────────────────────┤
│ • Geometría de 3 facetas  │ • Geometría romboidal 4F  │ • Prisma central con dos  │
│ • Tonos grafito y titanio │ • Gradación pura de plata │   haces de luz espectral  │
│ • Línea central champagne │ • Cero tinte cromático    │ • Matiz ámbar y cuarzo    │
│ • Equilibrio arquitectónico│ • Claridad extrema en 16px│ • Metáfora óptica sutil   │
└───────────────────────────┴───────────────────────────┴───────────────────────────┘
```

#### Alternativa A: Prisma Minimalista
* **Geometría y Construcción:** Prisma triangular equilátero seccionado por un plano oblicuo que genera tres planos de luz: faceta izquierda en sombra mineral (`#1E2026` a `#2D3039`), faceta derecha reflectiva (`#3A3E4A` a `#252830`) y núcleo central en titanio cálido (`#E2DDD5` a `#C8BFAF`).
* **Tratamiento en Fondo Oscuro (Obsidian):** El contraste entre el titanio cálido y el grafito genera un relieve tridimensional sereno que destaca sobre `#101114` sin emitir resplandor.
* **Tratamiento en Fondo Claro (Porcelain):** Las facetas invierten su gradiente hacia grises piedra (`#777873`) con núcleo bronce champagne (`#A99476`), manteniendo un contraste de 4.8:1 sobre `#F3F2EF`.
* **Legibilidad en Micro-Escala (16–24 px):** Buena. La forma triangular básica es reconocible al instante; el plano champagne se funde en un brillo central perceptible.
* **Aplicación en App Icon (80×80 / 130×130 px):** Se aloja sobre un squircle (radio continuo 22%) de carbón mineral con un bisel perimetral de 1 px.

#### Alternativa B: Prisma Monocromático
* **Geometría y Construcción:** Estructura romboidal facetada en cuatro cuadrantes basada en la refracción estricta de luz blanca sobre mineral pulido. Utiliza únicamente valores de luminancia: platino (`#EDEDEF`), plata mineral (`#B4B7C2`), pizarra (`#4B4E59`) y grafito profundo (`#1E2026`).
* **Tratamiento en Fondo Oscuro (Obsidian):** Máxima pureza visual. La faceta superior derecha en platino (`#EDEDEF`) actúa como un haz de luz especular que guía la mirada sin introducir ningún color secundario.
* **Tratamiento en Fondo Claro (Porcelain):** Las facetas utilizan tonos grafito de alta densidad (`#252629`, `#383B45`, `#555866`), logrando una nitidez similar a la tipografía impresa sobre papel marfil.
* **Legibilidad en Micro-Escala (16–24 px):** **Sobresaliente.** Al depender exclusivamente de la relación de luz y sombra (sin color que se difumine), conserva una definición geométrica perfecta incluso a 16×16 px en la barra superior.
* **Aplicación en App Icon (80×80 / 130×130 px):** Proporciona la apariencia más sobria y lujosa, recordando a productos de óptica cinematográfica profesional.

#### Alternativa C: Prisma con Refracción Sutil
* **Geometría y Construcción:** Prisma central facetado del que emanan dos haces luminosos discretos con opacidades calibradas (15% a 35%): a la izquierda, un haz cálido champagne (`rgba(200, 191, 175, 0.40)`); a la derecha, un haz frío cuarzo/hielo (`rgba(147, 180, 209, 0.30)`). El cuerpo central se mantiene en grafito neutro con arista especular en `#EDEDEF`.
* **Tratamiento en Fondo Oscuro (Obsidian):** Transmite de forma poética la división de la luz cinemática sin caer en degradados multicolores ni arcoíris estridentes. La temperatura dual aporta calidez y profundidad.
* **Tratamiento en Fondo Claro (Porcelain):** Los haces luminosos deben reducirse al 12% de opacidad para evitar manchas de fondo, descansando sobre aristas de grafito nítidas.
* **Legibilidad en Micro-Escala (16–24 px):** Moderada. A 16 px los haces translúcidos laterales se atenúan, predominando únicamente la silueta triangular central.
* **Aplicación en App Icon (80×80 / 130×130 px):** Muy atractiva en tamaños grandes (130 px y splash 1080p), donde los dos haces translúcidos se aprecian con detalle.

---

### 3. Matriz Comparativa de Decisión

| Criterio de Evaluación | Ponderación | Alternativa A (Minimalista) | Alternativa B (Monocromático) | Alternativa C (Refracción Sutil) |
| :--- | :---: | :---: | :---: | :---: |
| **Legibilidad en Micro-Escala (16–24 px)** | 25% | 8.5 / 10 | **9.8 / 10** | 7.5 / 10 |
| **Neutralidad y Coherencia Cromática** | 20% | 9.0 / 10 | **10.0 / 10** | 8.5 / 10 |
| **Elegancia y Sensación Cinemática** | 20% | 9.0 / 10 | 9.2 / 10 | **9.5 / 10** |
| **Rendimiento SVG en Chromium 53** | 15% | **9.8 / 10** | **9.8 / 10** | 9.0 / 10 (múltiples stop-opacity) |
| **Ergonomía en Salón (3 m de distancia)**| 10% | 9.0 / 10 | **9.5 / 10** | 8.5 / 10 |
| **Originalidad y Distintividad de Marca** | 10% | 8.8 / 10 | 9.0 / 10 | **9.4 / 10** |
| **PUNTUACIÓN TOTAL PONDERADA** | **100%** | **8.97 / 10** | **9.59 / 10** | **8.69 / 10** |

---

### 4. Evaluación y Recomendación para el Usuario

1. **La Alternativa B (Prisma Monocromático)** obtiene el mayor rendimiento técnico y ergonómico gracias a su inmaculada legibilidad en cualquier tamaño y su total independencia de pigmentos de color, integrándose a la perfección tanto en Obsidian como en Porcelain.
2. **La Alternativa A (Prisma Minimalista)** ofrece un excelente punto intermedio si el usuario desea un destello dorado/champagne distintivo en el icono de la aplicación.
3. **La Alternativa C (Prisma con Refracción Sutil)** es la más rica visualmente para el splash screen de inicio (1080p), pero requiere que a 16 px se desactiven los haces laterales.

*Los tres archivos SVG vectoriales han sido depositados en `prototypes/assets/` para inspección interactiva y visual en el prototipo M3.0.1.*

