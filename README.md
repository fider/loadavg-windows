# !
(2018.01.24): Work in progress... 


[TOC] <- todo

# About
Currently Node.js on Windows platform do not implements `os.loadavg()` functionality (it returns [0,0,0])

This is pure JavaScript, platform-independent implementation of `os.loadavg()` that can be used on Windows system.

It uses only `os.cpus()` - details [here](#details)

# Installation
Requires [Node.js](https://nodejs.org/) v0.3.3+
`npm install loadavg-windows`

# Usage
Just one line required to enjoy `os.loadavg()` on Windows OS:
```node.js
require('loadavg-windows')
```
**Requiring it on other operatins systems have NO influence.** 

# Documentation
TODO (include notes about 1, 5 and 15min delays)

# Live demo
TODO link

# Details
TODO schema
