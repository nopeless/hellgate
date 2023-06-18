# Hellgate

Hellgate is a permission resolver. Hellgate is a kind of Ring

## Ring

Ring is the basic unit of Hellgate. A Ring has a parent Ring and a set of permissions. A Ring can also provide a sin object which is used to add properties to a User

## Specifications

(WIP)

All permissions are implicitly undefined (falsy)

A Ring can inherit permissions from another Ring.

When a permission is calculated, it starts from the top (hellgate) and proceeds down to the Ring in question. If a permission is denied, it cannot be changed unless overriden.

Final permissions cannot be overriden. Final permissions by themselves do not imply override status.
