export const videoVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Cinematic plate. The footage was rendered on a warm paper background, so the
 * plane is multiply-blended: its ambient white is normalised to 1.0 and becomes
 * invisible, leaving only the graphite forms and the blue light. Edges are
 * feathered so the frame never reads as an embedded rectangle.
 */
export const videoFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform vec3 uWhite;
  uniform float uContrast;
  uniform float uFeather;
  uniform vec2 uUvScale;
  uniform vec2 uUvOffset;
  uniform float uDark;
  uniform vec3 uEnv;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv * uUvScale + uUvOffset;
    vec3 c = texture2D(uMap, uv).rgb;
    float m = smoothstep(0.0, uFeather, vUv.x) * smoothstep(0.0, uFeather, 1.0 - vUv.x)
            * smoothstep(0.0, uFeather * 0.8, vUv.y) * smoothstep(0.0, uFeather * 0.8, 1.0 - vUv.y);

    if (uDark > 0.5) {
      // Dark plate: the footage is lit against black. It is composited opaquely and
      // its edges are feathered into the environment colour rather than into
      // transparency, so the frame never reveals whatever sits behind the plate.
      c = clamp((c - 0.5) * uContrast + 0.5, 0.0, 1.0);
      c = mix(uEnv, c, m);          // feather the frame edges into the environment
      c = mix(uEnv, c, uOpacity);   // fade in/out through the environment, never through alpha
      gl_FragColor = vec4(c, 1.0);  // fully opaque: the plate is the backdrop
    } else {
      // Light plate: the footage was rendered on warm paper, so its ambient white is
      // normalised to 1.0 and multiplied away, leaving only form and colour.
      c = clamp(c / uWhite, 0.0, 1.0);
      c = clamp((c - 0.5) * uContrast + 0.5, 0.0, 1.0);
      c = mix(vec3(1.0), c, m * uOpacity);
      gl_FragColor = vec4(c, 1.0);
    }
  }
`;
