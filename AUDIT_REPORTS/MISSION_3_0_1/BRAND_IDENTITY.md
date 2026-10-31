# iCast — Identidad de Marca Refinada (M3.0.1)
## De la Herramienta Utilitaria a la Experiencia Cinemática de Salón

**Proyecto:** iCast (*anteriormente webOS IPTV Player*)  
**ID de Aplicación del Sistema:** `com.lennylxx.iptv` *(preservado intacto)*  
**Fecha:** 31 de Octubre de 2026  
**Fase:** M3.0.1 — Refinamiento de Identidad y Sistema de Diseño  
**Referencia Metodológica:** Apple Human Interface Guidelines (`branding.md`, `design-principles.md`, `color.md`)  

---

### 1. Diagnóstico de la Propuesta M3.0 y Necesidad de Refinamiento

La Misión M3.0 formuló una primera aproximación de marca denominada *Cinematic Prism*. Si bien logró unificar el nombre bajo **iCast** y establecer las bases arquitectónicas, la auditoría posterior reveló una debilidad estética fundamental:

> [!WARNING]
> **Dependencia Excesiva del Azul Saturado:**  
> La interfaz M3.0 abusaba de los tonos `#3B82F6` (Zafiro) y `#60A5FA` en botones primarios, anillos de foco, tarjetas activas, insignias y gradientes de fondo. Esta saturación creaba una apariencia genérica de dispositivo tecnológico o reproductor multimedia de bajo coste, compitiendo visualmente con el contenido de vídeo y provocando fatiga en pantallas OLED/LED de 65 pulgadas en entornos oscuros.

Además, en M3.0 se colocaron materiales translúcidos sobre tarjetas de contenido del catálogo, violando la regla cardinal de Apple HIG:  
*«Don’t use Liquid Glass in the content layer. Putting it there creates unnecessary complexity and a confusing hierarchy.»* (`materials.md › Liquid Glass`).

---

### 2. La Nueva Filosofía de iCast: Arquitectura Mineral y Serenidad Visual

iCast evoluciona hacia una estética **cinemática, mineral y serena**. El reproductor no busca ser el protagonista; busca ser el marco arquitectónico invisible a través del cual la televisión cobra vida.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   FILOSOFÍA DE MARCA iCAST (M3.0.1)                    │
│                                                                        │
│   1. Subordinación al Contenido   2. Neutralidad Mineral              │
│      El vídeo es la estrella.        Superficies de carbón, grafito    │
│      La UI se desvanece.             y porcelana; cero estridencias.   │
│                                                                        │
│   3. Acentos Deliberados          4. Ergonomía de 3 Metros            │
│      Champagne, plata y titanio.     Tipografía legible y foco         │
│      El color sólo informa estado.   inequívoco sin saturación.        │
└────────────────────────────────────────────────────────────────────────┘
```

#### Los Cuatro Pilares Fundamentales
1. **Subordinación Absoluta al Contenido (*Content Primacy*):**  
   Conforme a Apple HIG (`branding.md › Best practices`): *«The best apps express their brand through unique functionality and subtle design details, not by plastering logos and brand colors everywhere.»* En iCast, la marca se percibe en la fluidez de las transiciones, el tacto del D-pad y la precisión tipográfica, no en logos omnipresentes.
2. **Neutralidad Cromática y Materiales Nobles:**  
   Sustitución de los azules eléctricos por una paleta inspirada en piedras minerales, metales cepillados y acabados cerámicos: **Obsidian** (carbón profundo, grafito y titanio cálido) y **Porcelain** (marfil suave, piedra clara y bronce champagne).
3. **Foco Inequívoco sin Neón:**  
   El foco del mando a distancia se comunica mediante elevación física dimensional (`scale(1.03)`), realce de superficie y un anillo dual de alto contraste neutro (blanco puro/grafito), eliminando cualquier dependencia de aros azules brillantes.
4. **Respeto a las Condiciones del Salón (*Living Room Ergonomics*):**  
   Un televisor de 65 pulgadas en una habitación en penumbra no tolera negros absolutos artificiales (`#000000`) que colapsan el detalle de sombras, ni blancos puros cegadores (`#FFFFFF`) en modo oscuro. iCast utiliza tonos calibrados para evitar la fatiga ocular a 3 metros de distancia.

---

### 3. Tono de Voz y Naming

* **Nombre Oficial:** **iCast** (capitalización camelCase estándar con la 'i' inicial minúscula en homenaje a la elegancia intuitiva, y 'Cast' evocando difusión, refracción cinemática y emisión fluida).
* **Tagline de Marca:** *«Televisión en su Estado Más Puro»* (ES) / *«Television, Refined»* (EN).
* **Voz de la Interfaz:** Concisa, profesional, culta y transparente. Evita jerga técnica innecesaria en la superficie; los datos duros (codecs, tasas de bits, URLs de stream) quedan reservados para el panel de diagnóstico bajo demanda.
* **Preservación Técnica:** En el sistema operativo webOS, el App ID permanece estrictamente como `com.lennylxx.iptv` para garantizar la compatibilidad con Luna Bus y no romper las bases de datos locales existentes.

