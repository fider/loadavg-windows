# About
Use `require('loadavg-windows')` to enjoy `os.loadavg()` on Windows OS.

# Motivation

Currently Node.js on Windows platform do not implements `os.loadavg()` functionality - it returns `[0,0,0]`

# Important details
- **Expect first results after 1 min from application start (before 1 min runtime it will return `[0,0.0]`)**
- **Requiring it on other operatins systems have NO influence.** 

# Usage
Just one line required to enjoy `os.loadavg()` on Windows OS:
```node.js
require('loadavg-windows');
console.log( os.loadavg() );
```

# Installation
Requires [Node.js](https://nodejs.org/) v0.3.3+
`npm install loadavg-windows`

# Not important details:

This is pure JavaScript, platform-independent implementation of `os.loadavg()` that can be used on Windows system.

It uses only `os.cpus()` for proper calculations.

# TODO
- Avg from 1 min should work from start
- Live demo link
- Remove warning log when error detected
