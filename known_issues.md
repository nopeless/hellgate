# Known issues

## `getUser` to `getSin` inference fails when literal is method and not property

> Affected versions: 2.0.3-beta~
> 
> Tracking file `getusergetsin.spec.ts`

```ts
// fails
getUser(id: User | string): User | null {
    if (typeof id === `string`) {
    return myUsers[id] ?? null;
    }

    return id;
},
getSin(u) {
    // u is improperly typed
}
```

```ts
// works
getUser: (id: User | string): User | null => {
    if (typeof id === `string`) {
    return myUsers[id] ?? null;
    }

    return id;
},
getSin(u) {
    // u is properly typed
}
```

> I don't know the root of this issue
