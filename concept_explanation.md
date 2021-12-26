# Hellgate

### Author: [@nopeless](https://github.com/nopeless)

> Hellgate is an agnostic hierarchial role based access control with denies.

This document goes over the previous implementations of Access Control Lists (ACL), Attribute Based Access Control (ABAC) and Role Based Access Control (RBAC).

## Abstract

Access Control (AC) has been invented, expanded, and solidified over the past 40 years since the dawn of computer systems and applications. As companies had exponentially increasing branches of resources, whether that be data, software, or hardware, the need for access control became more and more apparent.

The most popular AC nowadays is RBAC with an extended deny features for complicated situations. In fact, Discord, one of the first chatting applications to include the complicated multi-role based access control of the Server's resources, made RBAC much more easier for the general public to access and interact with.

Implementing RBAC is very straight-forward. [NIST standard of RBAC from 1992](https://csrc.nist.gov/publications/detail/conference-paper/1992/10/13/role-based-access-controls) is very detailed on implications and serveral libraries such as [koa-rbac](https://www.npmjs.com/package/koa-rbac) exists. Despite having a history of decades and accepted by many, however, emulating a generic AC is hard.

Discord has 3 layers of resource access levels (4 if including threads), and has a aggregate logic for denies (instead of the hierarchial. Read [this](https://support.discord.com/hc/en-us/articles/218449248-Permissions-Lockout) and [this](https://support.discord.com/hc/en-us/community/posts/360037170591-Server-permission-overrides) issue for more ).

GitHub has many levels (teams) of permissions that only has grants. [Here are the specifics](https://docs.github.com/en/get-started/learning-about-github/access-permissions-on-github)

Apache Shiro, a popular Apache permission library, has a similar concept of roles and permissions. In addition to RBAC, the resources can also be subdified ex) `printer:*` and `printer:print:*`

An application that has to figure out complex access controls by itself and still work is virtually impossible to create as a single app, and the developer would need to create the AC library from the ground-up.

This is where Hellgate, a meta-library or framework, comes in. Hellgate offers to provide a common interface that is extendable with ease.

The rest of the document is an illustration of how Hellgate can be used to a variety of AC concepts.

## ACL - Access Control List

ACL is perhaps the most simplest implementation of AC. It is a list of users who can access a resource.

```
# Enumerated fashion
acl = [
  {
    user: 'user1',
    resource: 'resource1',
    action: 'action1'
  },
  {
    user: 'user2',
    resource: 'resource2',
    action: 'action2'
  }
]

# User based lookup
acl = {
  user1: {
    resource1: {
      action1: true
    },
    resource2: {
      action2: true
    }
  },
  user2: {
    resource1: {
      action1: true
    },
    resource2: {
      action2: true
    }
  }
}

# Resource based lookup
acl = {
  resource1: {
    action1: [
      'user1',
      'user2'
    ]
  },
  resource2: {
    action2: [
      'user1',
      'user2'
    ]
  }
}
```

These systems are simple yet powerful and reliable. The action is clear, and there is no way that a user can accidently access another system.

This user list, however, is barely extendible. Introducing a new member to those who can access will definitely come with a lot of hassle. 

## RBAC - Role Based Access Control

Giving a user a role, and giving the role a permission is the core philosophy of RBAC.

Users can have roles, roles can have rermissions. If a user has a role, and the role has a permission, the user can access the resource.

This additional step gives programmers a layer of abstraction that they can utilize. But roles aren't enough for most cases. For example, a senior dev is a role, but it definitely inherits the permissions of a junior dev.

```
# Role based access control
rbac = {
  role1: {
    resource1: {
      action1: true
    },
    resource2: {
      action2: true
    }
  },
  role2: {
    resource1: {
      action1: true
    },
    resource2: {
      action2: true
    }
  }
}
# users
users = {
  user1: {
    role: 'role1'
  },
  user2: {
    role: 'role2'
  }
}
```

## Hierarchial RBAC or HRBAC

In addition to RBAC, HRBAC has an additional property to roles, in that roles can grant every permission of a role.

This type of "possession leads to grant" mindset is actually the relation between ACL to RBAC.

| Type  | Description                                                                                            |
|-------|--------------------------------------------------------------------------------------------------------|
| ACL   | user has permissions                                                                                   |
| RBAC  | user can have roles that leads to multiple permissions                                                 |
| HRBAC | user can have roles that leads to multiple permissions, and roles can grant every permission of a role |

At this point, HRBAC can be extended even further to Entity Based Access Control (EBAC)

There is only one NPM library, [am-i-allowed](https://www.npmjs.com/package/am-i-allowed) that achieves this.

User (Actor or entity) can have multiple privilege-managed entity.

An entity has a set of operations that can be performed on it.

This type of implementation allows user to have entities that has potentially other entities that grant permissions to the user.

However, the implementation falls short for those with attributes. As an example, better trusted library visitors should be able to lend books for longer periods of time (ex 10 days) compared to normal visitors, who shouldn't be able to borrow for a long time (ex 1 day). This is achieved by having a "visitor" role that grants the "lend" permission to the "visitor" entity in most cases, but then it can lead to a cluster of roles that merely represent discrete levels attempting to process a continuum.


```
# hierarchy
hierarchy = {
  role1: [ role2 ],
  role2: []
}

# Role based access control
rbac = {
  role1: {
    resource1: {
      action1: true
    },
    resource2: {
      action2: true
    }
  },
  role2: {
    resource1: {
      action1: true
    },
    resource2: {
      action2: true
    }
  }
}
# users
users = {
  user1: {
    role: 'role1'
  },
  user2: {
    role: 'role2'
  }
}
```

## ABAC - Attribute Based Access Control

Giving attributes to users is akin to giving an "analog" role

An attribute can be anything more or equal to a Boolean value. For example, a user can have a height of 6ft, or a height of 6.1ft, or a height of 5ft.

A good example of ABAC in real life would be at a carnival. A person must be above 4ft to be able to ride the roller coaster. Traditional RBAC will attempt to create roles such as "over 4ft" to grant access to the roller coaster. As an eventual result of this continous role creation, the system will be very difficult to maintain, making ABAC a better choice.

```
# Attribute based access control
abac = {
  rollercoaster: { 
    height: {
      gt: 4 // greater than
    }
  }
}

users = [
  {
    name: tom,
    attributes: {
      height: 6.1
    }
  },
  {
    name: jerry,
    attributes: {
      height: 3.9
    }
  }
]

```

ABAC, however, doesn't give a clear idea on how resources should be organized. It is a way to give attributes to users, and then it is up to the developer to figure out how to access the resources based on the attributes.

A hierarchial resource managing system is never described.

# Hellgate

It combines most of the concepts into a reproducable framework that can be implemented to the developer's need.

It can simulatneously become any kind of AC system and extended easily.

There are 2 additional concepts to Hellgate in HRBAC and ABAC.

Hellgate - A resolver system that can "interpret" data and resolve it to attributes or roles

Sins - Domain specific attributes/roles that can either grant or deny access

The entire AC scheme assumes that every part of the resource is accepting resolution of an entity. I find this concept limiting to complex applications. A simple saying should demonstrate this issue: "angel in the streets devil in the sheets". If there are two concurrent systems "streets" and "sheets" both organizations do not have to implement the functions of each other. The person referred to in this sentence is an "angel" in the streets, but not a "devil". Inversely, the person is not an "angel" in the sheets but a "devil".

Apart from dynamic entity resolution, classic AC systems assume that denies are global and irreversible.

Here is a simple example of the situation. A man cannot use the womens bathroom. However, the janitor, who is a man, should be able to access the womens bathroom.

Classic RBAC would look like this

```
# Role based access control
resources = {
  mens_bathroom: [gender:male, janitor],
  womens_bathroom: [gender:female, janitor]
}

users = {
  emily: {
    attributes: {
      gender: female
    }
  },
  jack: {
    attributes: {
      gender: male
    }
  },
  hamilton: {
    roles: [janitor]
    attributes: {
      gender: male
    }
  }
}
```

However, the issue gets complicated once the developer introduces another level of deny.

For demonstration purposes, assume that the bathrooms are located in a science lab, where only the students attending the school and janitor can use.

```
# Role based access control
resources = {
  mens_bathroom: [gender:male, janitor, status:student],
  womens_bathroom: [gender:female, janitor, status:student]
}

users = {
  emily: {
    attributes: {
      gender: female,
      status: student
    }
  },
  jack: {
    attributes: {
      gender: male,
      status: student
    }
  },
  hamilton: {
    roles: [janitor]
    attributes: {
      gender: male
    }
  }
}
```

It is obvious that any kind of deny structure will not yield the desired result for the developer. `status:student` will always grant access to both sexes, and there is not an easy way to fix this structure without also breaking the previous janitor access behavior.

In my opinion, there has to be levels of denies that can be altered. In short terms, a denied access should be revokable depending on the level of the nested layer.

## Hellgate's solution

There is a science lab layer

```
science_lab = {
  allowed: [janitor, status:student],
  rings: [
    mens_bathroom,
    womens_bathroom,
  ]
}

mens_bathroom = {
  allowed: [gender:male, janitor]
}

womens_bathroom = {
  allowed: [gender:female, janitor]
}

```

This way, both janitors and students can access both bathrooms initially, but later get denied because of their `gender:*`

Here are the terminology used throughout Hellgate

| Term             | Description                                                                            | Conventional Term |
|------------------|----------------------------------------------------------------------------------------|-------------------|
| Hellgate         | An entry level gate that MUST provide a resolver                                       | Application       |
| Ring             | Sub level that inherits higher rings. A ring can have multiple rings                   | Subfield          |
| Status           | A global `Status` of a `User`                                                          | Rank, Group       |
| Status Authority | Authority granted by a user's status                                                   | Rank Permission   |
| Sin              | A `Ring` inherited property of a user. A sin only exists in the ring and its sub rings | Roles             |
| Sin Authority    | Authority granted or denied by a `User`'s `Sins`                                       | Role Permission   |
| Everyone         | A base authority that automatically overrides `sinAuthority`                           | Base Permission   |

there is much technical detail on how sin authority and status authority works.

This technical information is omitted on this paper due to the complexity of the topic.

The separation of attributes and roles, or combining them depending on the developer's needs, is enabled by the implementation of `sins` and `statuses` in the Hellgate library. This concept allows anyone who constructs their access control system to definte the way of calculating Allows and Denies instead of following a rigid scheme such as ACL, RBAC, HRBAC, or ABAC.

