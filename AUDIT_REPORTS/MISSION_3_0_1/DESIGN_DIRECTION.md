# Dirección de Diseño iCast: Evolución M3.0 a M3.0.1
## Manifiesto de Arquitectura Visual Cinemática y Serenidad de Salón

**Proyecto:** iCast  
**Fase:** M3.0.1  
**Fecha:** 31 de Octubre de 2026  
**Referencia Metodológica:** Apple Human Interface Guidelines (`design-principles.md`, `materials.md`, `color.md`)  

---

### 1. Cuadro Comparativo: Ruptura Frente a M3.0

| Dimensión de Diseño | Propuesta M3.0 (Anterior) | Propuesta M3.0.1 (Refinada Actual) | Justificación de Ingeniería y UX |
| :--- | :--- | :--- | :--- |
| **Identidad Cromática** | Dependencia crítica de azul saturado (`#3B82F6` / `#60A5FA`). | **Paleta Mineral Neutra:** Obsidian (`#101114`) y Porcelain (`#F3F2EF`) con acentos champagne/titanio (`#C8BFAF` / `#A99476`). | Elimina el aspecto de gadget tecnológico genérico; produce una atmósfera de sala de cine de lujo. |
| **Concepto de Isotipo** | Prisma con gradiente azul saturado y triángulo de play interno. | **Prisma Mineral Facetado** (3 alternativas rigurosas: Minimalista, Monocromático, Refracción Sutil). | Reconocibilidad limpia a cualquier tamaño; el logotipo enmarca el producto sin saturar la vista. |
| **Disciplina de Capas (Glass)** | Liquid Glass aplicado indebidamente a tarjetas de canal y Hero. | **Estricta Separación de Dos Capas (HIG):** Capa de Contenido 100% opaca; Capa Funcional con vidrio óptico calibrado. | Corrección del defecto de diseño HIG; garantiza contraste y texto nítido a 3 m sin recargar la GPU. |
| **Indicador de Foco D-pad** | Borde azul neón eléctrico envolvente. | **Doble Anillo Dual Neutro:** Anillo de separación del color de fondo + anillo exterior platino/grafito + escala `1.03x`. | Visibilidad extrema sin estridencias; funciona sobre imágenes oscuras o fotogramas claros. |
| **Intensidad de Materiales** | Monolítico (un solo estilo de vidrio para todo). | **3 Niveles de Intensidad:** Nivel 1 Base (Sólido), Nivel 2 Translúcido (Nav), Nivel 3 Destacado (OSD y Modales). | Adaptación precisa a los ciclos de reloj de la GPU Mali del SoC Realtek RTD2870. |
| **Rigor de Rendimiento** | Afirmaciones absolutas no demostradas (*«0% CPU», «60 FPS garantizados»*). | **Categorización Forense Estricta:** Distinción clara entre Hecho Medido, Hipótesis y Validación Pendiente. | Integridad técnica y transparencia auditable. |

---

### 2. Principios de Composición para Televisión (10-Foot UI)

1. **La Regla del Salón en Penumbra:** En un salón residencial, la pantalla de televisión suele ser la única fuente de luz activa. Los negros absolutos (`#000000`) provocan fatiga al contrastar bruscamente con las pupilas dilatadas; el negro carbón `#101114` de Obsidian proporciona un fondo cálido, homogéneo y descansado.
2. **Jerarquía por Elevación Superficial:** Para destacar un elemento no se utiliza saturación de color, sino luminosidad de superficie:
   - Nivel -1: Fondo Canvas (`--bg-base`).
   - Nivel 0: Contenedores y rieles (`--bg-surface-secondary`).
   - Nivel 1: Tarjetas y celdas interactivas (`--bg-surface-primary`).
   - Nivel 2: Elemento enfocado con micro-elevación (`--focus-surface-highlight` + `scale(1.03)`).
   - Nivel 3: Controles flotantes y modales (`--bg-surface-elevated`).
3. **Persistencia y Calma:** La interfaz permanece estática cuando el usuario no interactúa. No existen animaciones continuas de fondo, destellos intermitentes ni banners parpadeantes.

---

### 3. Coherencia entre Obsidian y Porcelain

Aunque Obsidian responde a entornos oscuros y Porcelain a salas iluminadas, ambos temas comparten:
- La misma geometría de squircle (radio 12 px para tarjetas, 16 px para modales).
- La misma escala tipográfica de 12 px a 42 px sobre la fuente `LG Smart UI`.
- Las mismas duraciones de transición de foco (140 ms con curva `cubic-bezier(0.16, 1, 0.3, 1)`).
- La misma arquitectura del mando a distancia (D-pad central con atajos por teclas de color).

El usuario experimenta la misma familiaridad estructural sin importar la hora del día en que sintonice iCast.

