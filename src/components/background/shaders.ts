// Fluid simulation shaders for WebGL background
// Based on GPU-accelerated fluid dynamics with curl noise

export const vertexShader = `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

export const curlNoiseShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  varying vec2 vUv;

  // Simplex noise functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m;
    m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  vec2 curlNoise(vec2 p) {
    float eps = 0.01;
    float n1 = snoise(vec2(p.x, p.y + eps));
    float n2 = snoise(vec2(p.x, p.y - eps));
    float a = (n1 - n2) / (2.0 * eps);

    float n3 = snoise(vec2(p.x + eps, p.y));
    float n4 = snoise(vec2(p.x - eps, p.y));
    float b = (n3 - n4) / (2.0 * eps);

    return vec2(a, -b);
  }

  void main() {
    vec2 uv = vUv;
    vec2 p = uv * 4.0 + uTime * 0.1;

    vec2 curl = curlNoise(p);
    float strength = length(curl);

    gl_FragColor = vec4(curl * 0.5 + 0.5, strength, 1.0);
  }
`;

export const advectionShader = `
  precision highp float;

  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 uResolution;
  uniform float uDeltaTime;
  uniform float uDissipation;
  varying vec2 vUv;

  void main() {
    vec2 coord = vUv - uDeltaTime * texture2D(uVelocity, vUv).xy * uResolution;
    vec4 result = texture2D(uSource, coord);
    float decay = 1.0 + uDissipation * uDeltaTime;
    gl_FragColor = result / decay;
  }
`;

export const splatShader = `
  precision highp float;

  uniform sampler2D uTarget;
  uniform vec2 uResolution;
  uniform vec2 uPoint;
  uniform vec3 uColor;
  uniform float uRadius;
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - uPoint;
    p.x *= uResolution.x / uResolution.y;

    float splat = exp(-dot(p, p) / uRadius);
    vec3 base = texture2D(uTarget, vUv).xyz;

    gl_FragColor = vec4(base + uStrength * uColor * splat, 1.0);
  }
`;

export const displayShader = `
  precision highp float;

  uniform sampler2D uTexture;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec3 velocity = texture2D(uTexture, vUv).xyz;
    float strength = length(velocity.xy);

    // Smooth gradient between two colors based on velocity
    vec3 color = mix(uColorA, uColorB, strength * 2.0);

    // Add soft glow
    float glow = pow(strength, 1.5) * 0.3;
    color += vec3(glow);

    // Subtle film grain
    float grain = fract(sin(dot(vUv * uTime, vec2(12.9898, 78.233))) * 43758.5453) * 0.02;
    color += vec3(grain);

    gl_FragColor = vec4(color, 1.0);
  }
`;
