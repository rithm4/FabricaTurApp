const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/** Scapă caracterele speciale, ca o cale de fișier să poată fi folosită într-o expresie regulată. */
const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Panoul operatorului, din `admin/`, e un site web separat, cu propriile dependențe.
// Metro nu trebuie să-l citească, altfel ar găsi o a doua copie de React în `admin/node_modules`.
// Separatorul acceptat e și `/`, și `\`, ca regula să meargă și pe Windows, și pe serverul de build.
const adminDir = escapeRegExp(path.join(__dirname, 'admin'));
config.resolver.blockList = [new RegExp(`^${adminDir}[\\\\/]`)];

module.exports = config;
