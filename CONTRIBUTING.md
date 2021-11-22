
# Datastores

## There are two data stores (or three if you are going relational)

Structure of Hell (Memory)
```js
{
  // exists in top level
  ranks: {
    "<rank>": {
      // Object that offers the two properties
      grants: [object] // reference to another rank object. This reduces the possiblity of circular reference
    }
  }
}
```

Creatures (users, Database)
```js
{
  "<user_id>": {
    // ...
    ranks: ["<rank>"],
    // hell
    sins: {
      "<ring>": {
        sins: ["<sin>"],
        rings: {
          "<ring>": {
            sins: ["<sin>"]
          }
        }
      }
    }
  }
}
```
