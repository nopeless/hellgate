# Hellgate

### Author: [@nopeless](https://github.com/nopeless)

> Hellgate is an agnostic, type-safe, dual-synced, extensible, and highly customizable permission system  

The idea of Hellgate is allowing a single object resolver (Hellgate) have multiple Rings that can be used to resolve permissions.

You can imagine Hellgate as physically going through a gate to Hell and passing through the circles of Hell.

## Features that are implemented

  * Agnostic: does not confine to a single access control system
  * Type-safe: permissions are inferred properly from the keys
  * Dual-sync: use it as a synchronous or asynchronous resolver
  * Extensible: add your own permission system on top of Hellgate with just a few lines of code

## Basic usage

```ts

const hellgate = new Hellgate({
  getUser(user) {
    // getUser will have to be able to understand what is a user object
    // and also parse on the fly
  }
})

```