// Só as classes do Three.js que a animação do currículo usa. Importar 'three'
// inteiro via import() dinâmico impede o tree-shaking (o chunk subia ~40%).
export {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Color,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
