// The original reference to "vite/client" could not be resolved, causing a type error.
// /// <reference types="vite/client" />

// Provide necessary type definitions for assets used in the project as a workaround.
declare module '*.svg' {
  const src: string;
  export default src;
}
