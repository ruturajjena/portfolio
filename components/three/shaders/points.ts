export const pointsVertex = /* glsl */ `
  attribute float aRand;
  uniform float uTime;
  uniform float uSize;
  uniform float uDpr;
  uniform vec3 uMouse;
  uniform float uMouseRadius;
  uniform float uDrift;
  varying float vAlpha;
  varying float vRand;

  void main() {
    vRand = aRand;
    vec3 p = position;
    // slow organic drift
    float t = uTime * (0.25 + aRand * 0.35);
    p += vec3(sin(t + aRand * 6.2831), cos(t * 0.8 + aRand * 12.0), sin(t * 0.6 + aRand * 3.0)) * uDrift;
    // gentle repulsion from the cursor
    vec2 d = p.xy - uMouse.xy;
    float dist = length(d);
    float push = smoothstep(uMouseRadius, 0.0, dist);
    p.xy += normalize(d + 0.0001) * push * 0.35;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    float depth = -mv.z;
    gl_PointSize = uSize * uDpr * (0.6 + aRand * 0.9) * (9.0 / max(depth, 0.1));
    vAlpha = 0.5 + 0.5 * aRand;
  }
`;

export const pointsFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vRand;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float r = length(c);
    float disc = 1.0 - smoothstep(0.32, 0.5, r);
    if (disc < 0.01) discard;
    vec3 col = mix(uColor, uAccent, step(0.965, vRand));
    gl_FragColor = vec4(col, disc * vAlpha * uOpacity);
  }
`;
