import"../chunks/DsnmJJEf.js";import"../chunks/CffOCyqk.js";import{t as g,a as m,e as xe,s as r,f,c as t,$ as je,r as e,n as y,g as i,b as n,u as he,d as _e}from"../chunks/0ovxSyTQ.js";import{h as be,e as x,i as j,s as we,a as Ce}from"../chunks/xDCGSXC7.js";import{b as ke}from"../chunks/lGclbjA3.js";import{C as u}from"../chunks/DkhOFzcn.js";var Se=f('<meta name="description" content="Configure eslint-plugin-typed-jsdoc rules and presets for your project."/>'),Pe=f('<li class="flex items-center gap-2 text-sm"><code class="text-xs"> </code> <span> </span></li>'),Te=f('<div class="card p-6"><h3 class="text-lg font-semibold text-gray-900 mb-2"> </h3> <p class="text-gray-600 mb-4"> </p> <div class="bg-gray-50 rounded-lg p-4"><h4 class="text-sm font-medium text-gray-700 mb-2">Rules included:</h4> <ul class="space-y-1"></ul></div></div>'),Fe=f('<tr><td class="px-4 py-2"><code> </code></td><td class="px-4 py-2 text-gray-600"> </td></tr>'),Oe=f('<tr><td class="px-4 py-2"><code> </code></td><td class="px-4 py-2 text-gray-600"> </td></tr>'),Ae=f(`<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16"><h1 class="text-4xl font-bold text-gray-900 mb-8">Configuration</h1> <div class="prose prose-lg max-w-none"><p class="lead text-xl text-gray-600">All presets use TypeScript's <code>projectService</code> for zero-config support.
      No <code>tsconfig.json</code> required (though recommended for better inference).</p> <h2>Quick Start</h2> <p>The simplest configuration uses a preset:</p></div> <div class="my-8"><!></div> <div class="prose prose-lg max-w-none"><h2>Preset Configurations</h2> <p>Choose a preset that matches your needs:</p></div> <div class="my-8 grid gap-6"></div> <div class="prose prose-lg max-w-none"><h2>Config Factory</h2> <p>For more control, use the <code>createConfig()</code> factory function:</p></div> <div class="my-8"><!></div> <div class="prose prose-lg max-w-none"><h3>Factory Options</h3> <ul><li><code>preset</code> - Rule severity: <code>'recommended'</code> (warn) | <code>'strict'</code> (error)</li> <li><code>framework</code> - Framework-specific file patterns and ignores</li> <li><code>projectType</code> - Affects file patterns: <code>'app'</code> | <code>'library'</code> | <code>'cli'</code> | <code>'monorepo'</code> | <code>'legacy'</code></li> <li><code>typescript</code> - Custom tsconfig: <code></code></li> <li><code>files</code> - Additional file patterns to include</li> <li><code>ignores</code> - Additional patterns to ignore</li> <li><code>rules</code> - Rule severity overrides</li> <li><code>ignorePatterns</code> - Function names to skip</li></ul> <h2>Framework Presets</h2> <p>Built-in support for popular frameworks:</p></div> <div class="my-8 overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-4 py-2 text-left font-medium text-gray-600">Framework</th><th class="px-4 py-2 text-left font-medium text-gray-600">Description</th></tr></thead><tbody class="divide-y divide-gray-200"></tbody></table></div> <div class="my-8"><!></div> <div class="prose prose-lg max-w-none"><h2>Project Types</h2> <p>Project types adjust file patterns and rule strictness:</p></div> <div class="my-8 overflow-x-auto"><table class="w-full text-sm"><thead class="bg-gray-50"><tr><th class="px-4 py-2 text-left font-medium text-gray-600">Type</th><th class="px-4 py-2 text-left font-medium text-gray-600">Description</th></tr></thead><tbody class="divide-y divide-gray-200"></tbody></table></div> <div class="prose prose-lg max-w-none"><h2>Existing TypeScript Setup</h2> <p>If you already have <code>@typescript-eslint/parser</code> configured, use the <code>rules-only</code> preset:</p></div> <div class="my-8"><!></div> <div class="prose prose-lg max-w-none"><h2>Manual Configuration</h2> <p>For full control over parser options:</p></div> <div class="my-8"><!></div> <div class="prose prose-lg max-w-none"><h2>Eject Config</h2> <p>Generate a standalone config to customize further:</p></div> <div class="my-8"><!></div> <div class="prose prose-lg max-w-none"><h2>Common Options</h2> <h3>ignorePatterns</h3> <p>Skip functions or variables by name pattern. Available on all rules.
      Supports three pattern formats:</p> <ul><li><code>"helper"</code> - Exact match</li> <li><code>"test*"</code> - Glob pattern</li> <li><code>"/^_/"</code> - Regex pattern</li></ul></div> <div class="my-8"><!></div> <div class="prose prose-lg max-w-none"><h3>Rule-Specific Options</h3> <h4>tjd/accurate-jsdoc</h4> <ul><li><code>inferenceConfidence</code> (default: <code>0.5</code>) - Minimum confidence (0-1) for auto-fixing. Higher values require more certain type inference.</li></ul> <h4>tjd/no-redundant-jsdoc</h4> <ul><li><code>keepDescriptions</code> (default: <code>true</code>) - Keep JSDoc comments that have descriptions, only remove the type annotation</li></ul> <h2>Next Steps</h2> <ul><li><a>Learn about each rule</a> in detail</li> <li><a href="https://github.com/deanmarano/typedjs">View the source code</a> on GitHub</li></ul></div></div>`);function Je(V){const X=`// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  tjd.configs.recommended,
];`,K=`// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  ...tjd.createConfig({
    preset: 'strict',
    framework: 'next',
    projectType: 'app',
    ignorePatterns: ['test*', '_*'],
  }),
];`,Q=`// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  ...tjd.createConfig({ framework: 'next' }),
  // or use framework-specific preset:
  // ...tjd.configs.next,
];`,W=`// Generate standalone config
import tjd from 'eslint-plugin-typed-jsdoc';
console.log(tjd.ejectConfig({ preset: 'strict', framework: 'next' }));
// Outputs a complete config you can copy into eslint.config.js`,Y=`// eslint.config.js
import tjd from 'eslint-plugin-typed-jsdoc';

// Use this if you already have TypeScript parser configured
export default [
  // Your existing TypeScript parser config...
  tjd.configs['rules-only'],
];`,Z=`// eslint.config.js
import tsparser from '@typescript-eslint/parser';
import tjd from 'eslint-plugin-typed-jsdoc';

export default [
  {
    files: ['src/**/*.js'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    plugins: {
      tjd,
    },
    rules: {
      'tjd/accurate-jsdoc': ['error', {
        ignorePatterns: ['test*', '_*'],
      }],
      'tjd/no-redundant-jsdoc': 'warn',
    },
  },
];`,ee=`rules: {
  'tjd/accurate-jsdoc': ['error', {
    ignorePatterns: [
      'test*',           // Skip functions starting with "test"
      '*Callback',       // Skip functions ending with "Callback"
      '/^_/',            // Skip private functions (regex)
      'describe',        // Exact match
    ]
  }],
}`,te=[{name:"recommended",description:"Balanced defaults for most projects. Start here.",rules:{"tjd/accurate-jsdoc":"error","tjd/no-redundant-jsdoc":"warn"}},{name:"strict",description:"All rules as errors.",rules:{"tjd/accurate-jsdoc":"error","tjd/no-redundant-jsdoc":"error"}},{name:"rules-only",description:"Just rules, no parser config. Use if you have TypeScript parser already.",rules:{"tjd/accurate-jsdoc":"error","tjd/no-redundant-jsdoc":"warn"}}],re=[{name:"next",description:"Next.js - ignores .next/, includes JSX"},{name:"react",description:"React - ignores build/, includes JSX"},{name:"vue",description:"Vue - ignores dist/, .nuxt/, includes .vue files"},{name:"svelte",description:"Svelte - ignores .svelte-kit/, includes .svelte files"},{name:"ember",description:"Ember - ignores dist/, tmp/, includes .gjs files"},{name:"express",description:"Express - ignores public/"},{name:"fastify",description:"Fastify - Node.js server setup"},{name:"node",description:"Generic Node.js - .js, .mjs, .cjs files"}],oe=[{name:"app",description:"Application (default) - standard file patterns"},{name:"library",description:"Library - stricter rules for public APIs"},{name:"cli",description:"CLI tool - includes bin/ directory"},{name:"monorepo",description:"Monorepo - handles packages/*/"},{name:"legacy",description:"Legacy project - more lenient rules"}];var h=Ae();be("taz7pl",d=>{var o=Se();xe(()=>{je.title="Configuration - typed-jsdoc"}),m(d,o)});var _=r(t(h),4),se=t(_);u(se,{code:X,language:"javascript",filename:"eslint.config.js"}),e(_);var b=r(_,4);x(b,5,()=>te,j,(d,o)=>{var s=Te(),a=t(s),c=t(a,!0);e(a);var l=r(a,2),p=t(l,!0);e(l);var v=r(l,2),q=r(t(v),2);x(q,5,()=>Object.entries(i(o).rules),j,(ve,me)=>{var H=he(()=>_e(i(me),2));let fe=()=>i(H)[0],U=()=>i(H)[1];var E=Pe(),R=t(E),ge=t(R,!0);e(R);var $=r(R,2),ye=t($,!0);e($),e(E),g(()=>{n(ge,fe()),Ce($,1,`badge ${U()==="error"?"badge-error":"badge-warning"}`),n(ye,U())}),m(ve,E)}),e(q),e(v),e(s),g(()=>{n(c,i(o).name),n(p,i(o).description)}),m(d,s)}),e(b);var w=r(b,4),ae=t(w);u(ae,{code:K,language:"javascript",filename:"eslint.config.js"}),e(w);var C=r(w,2),G=r(t(C),2),N=r(t(G),6),ie=r(t(N),2);ie.textContent='{ project: "./tsconfig.json" }',e(N),y(8),e(G),y(4),e(C);var k=r(C,2),D=t(k),J=r(t(D));x(J,5,()=>re,j,(d,o)=>{var s=Fe(),a=t(s),c=t(a),l=t(c,!0);e(c),e(a);var p=r(a),v=t(p,!0);e(p),e(s),g(()=>{n(l,i(o).name),n(v,i(o).description)}),m(d,s)}),e(J),e(D),e(k);var S=r(k,2),ne=t(S);u(ne,{code:Q,language:"javascript",filename:"eslint.config.js"}),e(S);var P=r(S,4),L=t(P),z=r(t(L));x(z,5,()=>oe,j,(d,o)=>{var s=Oe(),a=t(s),c=t(a),l=t(c,!0);e(c),e(a);var p=r(a),v=t(p,!0);e(p),e(s),g(()=>{n(l,i(o).name),n(v,i(o).description)}),m(d,s)}),e(z),e(L),e(P);var T=r(P,4),de=t(T);u(de,{code:Y,language:"javascript",filename:"eslint.config.js"}),e(T);var F=r(T,4),ce=t(F);u(ce,{code:Z,language:"javascript",filename:"eslint.config.js"}),e(F);var O=r(F,4),le=t(O);u(le,{code:W,language:"javascript"}),e(O);var A=r(O,4),pe=t(A);u(pe,{code:ee,language:"javascript"}),e(A);var B=r(A,2),I=r(t(B),12),M=t(I),ue=t(M);y(),e(M),y(2),e(I),e(B),e(h),g(()=>we(ue,"href",`${ke??""}/docs/rules`)),m(V,h)}export{Je as component};
