<div align="center">

<img src="docs/images/uvg-logo.png" alt="Universidad del Valle de Guatemala" width="100" />

### Universidad del Valle de Guatemala
**Lógica matemática**  
**Proyecto - parcial 3**

**Integrantes:**  
Angel Chavez &bull; Sarah Estrada &bull; Tiffany Salazar

---

</div>

# Evaluador semántico

Es un proyecto web interactivo diseñado para la verificación y evaluación semántica de fórmulas en lógica de predicados de primer orden. Permite construir interpretaciones, pudiendo definir dominios arbitrarios, constantes, funciones y relaciones de cualquier aridad, así como asignar entornos de evaluación para variables libres. Soporta conectivos lógicos y cuantificadores (∀, ∃), mostrando el paso a paso.

Se pueden definir diferentes notebooks independientes que se guardan localmente, integrando un árbol sintáctico y evaluaciones semánticas que muestran testigos y contraejemplos. Además cuenta con un constructor interactivo de tuplas y fórmulas a partir de un constructor visual.

| Recurso | Enlace |
| :--- | :--- |
| **Repositorio de código** | [https://github.com/angc-labs/semantics-expert](https://github.com/angc-labs/semantics-expert) |
| **Video** | [https://youtu.be/CyhKCbj8Rw0](https://youtu.be/CyhKCbj8Rw0) |
| **Proyecto** | [https://semantics-expert-logic.vercel.app](https://semantics-expert-logic.vercel.app) |

---

## Capturas de pantalla

Las partes visuales del evaluador son las siguientes:

<div align="center">
  <img src="docs/images/evaluador-diagrama.png" alt="Partes visuales del evaluador" width="90%" />
</div>

Se pueden ingresar fórmulas, dominios, predicados, etc. Las entidades se ingresan con ayuda de “/” y los símbolos se pueden consultar por medio de “@”.

<div align="center">
  <img src="docs/images/comandos-editores.png" alt="Comandos que abren editores" width="80%" />
  <br /><br />
  <img src="docs/images/simbolos-cuantificadores.png" alt="Símbolos lógicos y cuantificadores" width="80%" />
</div>

Se permiten agregar fórmulas por medio de voz, por texto, o usando el constructor visual.

<div align="center">
  <img src="docs/images/selector-modo-ingreso.png" alt="Selector de modo de ingreso" width="40%" />
  <br /><br />
  <img src="docs/images/constructor-visual.png" alt="Constructor visual de fórmulas" width="95%" />
</div>

Se pueden agregar diferentes notebooks para evaluar diferentes interpretaciones y formular bajo esas interpretaciones. Si se marca el símbolo de bookmark, ese notebook se convierte en una plantilla que se puede usar desde el selector de plantillas.

<div align="center">
  <img src="docs/images/notebooks.png" alt="Notebooks" width="70%" />
  <br /><br />
  <img src="docs/images/plantillas.png" alt="Selector de plantillas" width="70%" />
</div>
