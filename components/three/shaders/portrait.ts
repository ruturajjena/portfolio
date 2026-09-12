export const portraitVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Chroma key on the CbCr plane (the plate is a flat, saturated red after tone
 * mapping, far from any skin tone), edge despill, bottom feather so the plate
 * never shows a hard edge, and a noise dissolve driven by scroll.
 */
export const portraitFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform vec3 uKey;
  uniform float uSimilarity;
  uniform float uSmooth;
  uniform float uSpill;
  uniform float uOpacity;
  uniform float uDissolve;
  uniform float uSaturation;
  uniform float uBottomFade;
  uniform float uTime;
  varying vec2 vUv;

  vec2 cbcr(vec3 c) {
    float y = dot(c, vec3(0.299, 0.587, 0.114));
    return vec2((c.b - y) * 0.564, (c.r - y) * 0.713);
  }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    vec3 c = tex.rgb;
    float d = distance(cbcr(c), cbcr(uKey));
    float a = smoothstep(uSimilarity, uSimilarity + uSmooth, d);

    // despill only where the pixel is genuinely mixed with the backdrop (soft edge),
    // so skin — which is warm but far from the key — keeps its natural colour
    float edgeMix = 1.0 - a;
    float mx = max(c.g, c.b);
    c.r = mix(c.r, min(c.r, mx * 1.15), edgeMix * uSpill);

    // faithful grade: very light contrast lift, saturation preserved
    float l = dot(c, vec3(0.299, 0.587, 0.114));
    c = mix(vec3(l), c, uSaturation);
    c = clamp((c - 0.5) * 1.04 + 0.5, 0.0, 1.0);

    // feather the cropped bottom so the figure emerges from the page
    a *= smoothstep(0.0, uBottomFade, vUv.y);
    a *= smoothstep(0.0, 0.05, vUv.x) * smoothstep(0.0, 0.05, 1.0 - vUv.x) * smoothstep(0.0, 0.04, 1.0 - vUv.y);

    // dissolve into the particle field
    float n = fbm(vUv * 9.0 + vec2(0.0, uTime * 0.05));
    float threshold = uDissolve * 1.4 - 0.3;
    a *= smoothstep(threshold, threshold + 0.3, n);

    gl_FragColor = vec4(c, a * uOpacity);
  }
`;
