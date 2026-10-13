/** Aggressive SVGO preset for header SVG (from carelink-owl-avatar.svg). */
export default {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          cleanupNumericValues: { floatPrecision: 0 },
          convertPathData: { floatPrecision: 0 },
          mergePaths: false,
        },
      },
    },
    'removeDimensions',
    {
      name: 'addAttributesToSVGElement',
      params: {
        attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
      },
    },
  ],
};
